/**
 * Shared logic for activity configurations: the Prisma include shape, the
 * JSON serializer, and the rules for which words an activity may use.
 *
 * The same rules run when an activity is saved and again when it is
 * generated, because words can be edited or deleted after saving.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { ApiError } from "./api";
import { TYPE_LABEL, WORD_LIMITS, type ActivityType } from "./constants";
import { toPhonemeWord, toWordDto, wordInclude } from "./serialize";

export const activityInclude = {
  wordList: { select: { id: true, name: true } },
  words: {
    orderBy: { position: "asc" as const },
    include: { word: { include: wordInclude } },
  },
} satisfies Prisma.ActivityConfigInclude;

export type ActivityRow = Prisma.ActivityConfigGetPayload<{ include: typeof activityInclude }>;

export function serializeActivity(a: ActivityRow) {
  const words = a.words.map((aw) => toWordDto(aw.word));
  return {
    id: a.id,
    title: a.title,
    type: a.type as ActivityType,
    difficulty: a.difficulty,
    wordListId: a.wordListId,
    wordListName: a.wordList.name,
    wordIds: words.map((w) => w.id),
    words,
    attempts: a.attempts,
    gridSize: a.gridSize,
    allowDiagonals: a.allowDiagonals,
    showHints: a.showHints,
    seed: a.seed,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export type ActivityDto = ReturnType<typeof serializeActivity>;

/** Problems with a set of words for an activity type (an empty array means fine). */
export function activityWordProblems(
  type: ActivityType,
  words: { english: string; phonemes: string[] }[],
  gridSize: number
): string[] {
  const problems: string[] = [];
  const { min, max } = WORD_LIMITS[type];
  if (words.length < min || words.length > max) {
    problems.push(
      `A ${TYPE_LABEL[type]} needs ${min} to ${max} words, but this one has ${words.length}.`
    );
  }
  for (const w of words) {
    if (type === "WORDLE" && w.phonemes.length < 2) {
      problems.push(`"${w.english}" has only one phoneme. Wordle words need at least two.`);
    }
    if (type === "WORDSEARCH" && w.phonemes.length > gridSize) {
      problems.push(
        `"${w.english}" has ${w.phonemes.length} phonemes, which will not fit in a ${gridSize} by ${gridSize} grid.`
      );
    }
  }
  return problems;
}

/**
 * Check a word selection against the database: the list exists, every
 * chosen word exists and belongs to that list, nothing is chosen twice, and
 * the words suit the activity type.
 */
export async function validateActivitySelection(opts: {
  type: ActivityType;
  wordListId: number;
  wordIds: number[];
  gridSize: number;
}): Promise<void> {
  const { type, wordListId, wordIds, gridSize } = opts;

  const list = await prisma.wordList.findUnique({ where: { id: wordListId }, select: { id: true } });
  if (!list) throw new ApiError(400, `Word list ${wordListId} does not exist`);

  if (new Set(wordIds).size !== wordIds.length) {
    throw new ApiError(400, "The same word was chosen more than once");
  }

  const rows = await prisma.word.findMany({ where: { id: { in: wordIds } }, include: wordInclude });
  const byId = new Map(rows.map((r) => [r.id, r]));

  const missing = wordIds.filter((id) => !byId.has(id));
  if (missing.length) {
    throw new ApiError(
      400,
      "Some chosen words do not exist",
      missing.map((id) => `Word ${id} was not found (it may have been deleted)`)
    );
  }

  const outside = rows.filter((r) => r.wordListId !== wordListId);
  if (outside.length) {
    throw new ApiError(
      400,
      "Every chosen word must come from the chosen word list",
      outside.map((r) => `"${r.english}" belongs to a different list`)
    );
  }

  const ordered = wordIds.map((id) => toPhonemeWord(byId.get(id)!));
  const problems = activityWordProblems(type, ordered, gridSize);
  if (problems.length) throw new ApiError(400, "These words do not suit this activity", problems);
}
