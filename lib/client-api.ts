/**
 * Typed fetch helpers the pages use to talk to the backend API.
 *
 * Every call throws an ApiClientError carrying the server's headline and
 * detail list, so components can show exactly what went wrong.
 */

import type { ActivityDto } from "./activities";
import type { ActivityType, Difficulty } from "./constants";
import type { WordDto } from "./serialize";

export type { ActivityDto } from "./activities";
export type { WordDto } from "./serialize";

export interface WordListSummary {
  id: number;
  name: string;
  description: string | null;
  wordCount: number;
  activityCount: number;
  updatedAt: string;
}

export interface WordListDetail {
  id: number;
  name: string;
  description: string | null;
  words: WordDto[];
}

export interface NewWord {
  english: string;
  phonemes: string[];
}

export interface ActivityPayload {
  title: string;
  type: ActivityType;
  difficulty: Difficulty;
  wordListId: number;
  wordIds: number[];
  attempts: number;
  gridSize: number;
  allowDiagonals: boolean;
  showHints: boolean;
  seed: number;
}

/** A problem to show the teacher: a headline plus optional specifics. */
export interface Problem {
  message: string;
  details?: string[];
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: string[] = []
  ) {
    super(message);
  }
}

const OFFLINE = "Could not reach the server. Check that it is running, then try again.";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiClientError(OFFLINE, 0);
  }
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Not JSON; handled below.
  }
  if (!res.ok) {
    const b = body as { error?: string; details?: string[] } | null;
    throw new ApiClientError(b?.error ?? `Request failed (${res.status})`, res.status, b?.details ?? []);
  }
  return body as T;
}

const json = (method: string, data?: unknown): RequestInit => ({
  method,
  body: data === undefined ? undefined : JSON.stringify(data),
});

export const api = {
  listWordLists: () => request<WordListSummary[]>("/api/word-lists"),
  getWordList: (id: number) => request<WordListDetail>(`/api/word-lists/${id}`),
  createWordList: (data: { name: string; description?: string | null; words?: NewWord[] }) =>
    request<WordListDetail>("/api/word-lists", json("POST", data)),
  updateWordList: (id: number, data: { name?: string; description?: string | null }) =>
    request<WordListSummary>(`/api/word-lists/${id}`, json("PATCH", data)),
  deleteWordList: (id: number) => request<{ deleted: number }>(`/api/word-lists/${id}`, json("DELETE")),

  addWord: (listId: number, word: NewWord) =>
    request<WordDto>(`/api/word-lists/${listId}/words`, json("POST", word)),
  importWords: (listId: number, words: NewWord[]) =>
    request<{ created: number; words: WordDto[] }>(`/api/word-lists/${listId}/words`, json("POST", { words })),
  updateWord: (id: number, data: Partial<NewWord>) => request<WordDto>(`/api/words/${id}`, json("PATCH", data)),
  deleteWord: (id: number) => request<{ deleted: number }>(`/api/words/${id}`, json("DELETE")),

  listActivities: (type?: ActivityType) =>
    request<ActivityDto[]>(`/api/activities${type ? `?type=${type}` : ""}`),
  createActivity: (payload: ActivityPayload) => request<ActivityDto>("/api/activities", json("POST", payload)),
  updateActivity: (id: number, payload: Partial<Omit<ActivityPayload, "type">>) =>
    request<ActivityDto>(`/api/activities/${id}`, json("PATCH", payload)),
  deleteActivity: (id: number) => request<{ deleted: number }>(`/api/activities/${id}`, json("DELETE")),
};

/**
 * Ask the server to build the HTML file for a saved activity and download
 * it. Returns the downloaded filename.
 */
export async function downloadActivity(id: number): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`/api/activities/${id}/generate`, { cache: "no-store" });
  } catch {
    throw new ApiClientError(OFFLINE, 0);
  }
  if (!res.ok) {
    const b = (await res.json().catch(() => null)) as { error?: string; details?: string[] } | null;
    throw new ApiClientError(b?.error ?? `Generation failed (${res.status})`, res.status, b?.details ?? []);
  }
  const disposition = res.headers.get("content-disposition") ?? "";
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `activity-${id}.html`;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

/** Turn any thrown value into something the ErrorAlert component can show. */
export function toProblem(err: unknown): Problem {
  if (err instanceof ApiClientError) return { message: err.message, details: err.details };
  return { message: err instanceof Error ? err.message : "Something went wrong" };
}
