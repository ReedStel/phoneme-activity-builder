"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  downloadActivity,
  toProblem,
  type ActivityDto,
  type Problem,
  type WordDto,
  type WordListSummary,
} from "@/lib/client-api";
import {
  DIFFICULTY_PRESETS,
  TYPE_LABEL,
  WORD_LIMITS,
  type ActivityType,
  type Difficulty,
} from "@/lib/constants";

/** The activity being edited in the builder, before or after saving. */
export interface Draft {
  title: string;
  difficulty: Difficulty;
  wordListId: number | null;
  wordIds: number[];
  attempts: number;
  gridSize: number;
  allowDiagonals: boolean;
  showHints: boolean;
  seed: number;
}

export type Busy = "saving" | "generating" | "deleting" | null;

const DEFAULT_TITLE: Record<ActivityType, string> = {
  WORDLE: "Phoneme'le",
  WORDSEARCH: "Phoneme Word Search",
};

function newDraft(type: ActivityType): Draft {
  return {
    title: DEFAULT_TITLE[type],
    difficulty: "medium",
    wordListId: null,
    wordIds: [],
    attempts: 5,
    gridSize: 10,
    allowDiagonals: false,
    seed: 1,
    ...DIFFICULTY_PRESETS[type].medium, // also sets showHints
  };
}

function draftFromActivity(a: ActivityDto): Draft {
  return {
    title: a.title,
    difficulty: a.difficulty as Difficulty,
    wordListId: a.wordListId,
    wordIds: [...a.wordIds],
    attempts: a.attempts,
    gridSize: a.gridSize,
    allowDiagonals: a.allowDiagonals,
    showHints: a.showHints,
    seed: a.seed,
  };
}

function sameDraft(a: Draft, b: Draft): boolean {
  return (
    a.title === b.title &&
    a.difficulty === b.difficulty &&
    a.wordListId === b.wordListId &&
    a.attempts === b.attempts &&
    a.gridSize === b.gridSize &&
    a.allowDiagonals === b.allowDiagonals &&
    a.showHints === b.showHints &&
    a.seed === b.seed &&
    a.wordIds.length === b.wordIds.length &&
    a.wordIds.every((id, i) => id === b.wordIds[i])
  );
}

/** Whether a word suits the activity: Wordle needs 2+ phonemes, Word Search must fit the grid. */
export function isEligible(type: ActivityType, word: WordDto, gridSize: number): boolean {
  return type === "WORDLE" ? word.phonemes.length >= 2 : word.phonemes.length <= gridSize;
}

/** A shuffled selection of suitable words. */
export function randomWordIds(type: ActivityType, words: WordDto[], gridSize: number, count: number): number[] {
  const pool = words.filter((w) => isEligible(type, w, gridSize));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map((w) => w.id);
}

function starterList(type: ActivityType, lists: WordListSummary[]): WordListSummary | null {
  if (type === "WORDSEARCH") {
    return lists.find((l) => l.wordCount >= 3 && l.wordCount <= 12) ?? lists.find((l) => l.wordCount >= 3) ?? null;
  }
  return lists.find((l) => l.wordCount > 0) ?? null;
}

function starterWordIds(type: ActivityType, words: WordDto[], gridSize: number): number[] {
  const count = type === "WORDLE" ? 1 : 5;
  return words
    .filter((w) => isEligible(type, w, gridSize))
    .slice(0, count)
    .map((w) => w.id);
}

function draftIssues(type: ActivityType, d: Draft): string[] {
  const issues: string[] = [];
  const { min, max } = WORD_LIMITS[type];
  if (!d.title.trim()) issues.push("Give the activity a title.");
  if (d.wordListId === null) issues.push("Choose a word list.");
  if (d.wordIds.length < min) {
    issues.push(min === 1 ? "Choose at least one word." : `Choose at least ${min} words for a ${TYPE_LABEL[type]}.`);
  }
  if (d.wordIds.length > max) issues.push(`Choose at most ${max} words.`);
  return issues;
}

/**
 * State and actions shared by the Wordle and Word Search builders: loading
 * word lists and saved activities from the API, editing a draft, and saving,
 * loading, deleting and generating activities.
 */
export function useActivityBuilder(type: ActivityType) {
  const [lists, setLists] = useState<WordListSummary[] | null>(null);
  const [activities, setActivities] = useState<ActivityDto[] | null>(null);
  const [wordsByList, setWordsByList] = useState<Record<number, WordDto[]>>({});
  const [draft, setDraft] = useState<Draft>(() => newDraft(type));
  const [activeId, setActiveId] = useState<number | null>(null);
  const [saved, setSaved] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [notice, setNotice] = useState("");

  // First load: word lists and saved activities, then a sensible starting selection.
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listWordLists(), api.listActivities(type)])
      .then(async ([ls, acts]) => {
        if (cancelled) return;
        setLists(ls);
        setActivities(acts);
        const start = starterList(type, ls);
        if (!start) return;
        const detail = await api.getWordList(start.id);
        if (cancelled) return;
        setWordsByList((m) => ({ ...m, [start.id]: detail.words }));
        setDraft((d) =>
          d.wordListId === null
            ? { ...d, wordListId: start.id, wordIds: starterWordIds(type, detail.words, d.gridSize) }
            : d
        );
      })
      .catch((e) => {
        if (!cancelled) setProblem(toProblem(e));
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  // Success messages clear themselves after a few seconds.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 8000);
    return () => clearTimeout(t);
  }, [notice]);

  const listWords = draft.wordListId !== null ? (wordsByList[draft.wordListId] ?? null) : null;

  const selectedWords = useMemo(() => {
    if (!listWords) return [] as WordDto[];
    const byId = new Map(listWords.map((w) => [w.id, w]));
    return draft.wordIds.map((id) => byId.get(id)).filter((w): w is WordDto => w !== undefined);
  }, [listWords, draft.wordIds]);

  const dirty = saved === null || !sameDraft(draft, saved);

  const ensureWords = useCallback(
    async (listId: number): Promise<WordDto[]> => {
      const cached = wordsByList[listId];
      if (cached) return cached;
      const detail = await api.getWordList(listId);
      setWordsByList((m) => ({ ...m, [listId]: detail.words }));
      return detail.words;
    },
    [wordsByList]
  );

  function update(patch: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function setDifficulty(level: Difficulty) {
    setDraft((d) => ({ ...d, difficulty: level, ...DIFFICULTY_PRESETS[type][level] }));
  }

  async function chooseList(listId: number) {
    setProblem(null);
    setDraft((d) => ({ ...d, wordListId: listId, wordIds: [] }));
    try {
      const words = await ensureWords(listId);
      setDraft((d) =>
        d.wordListId === listId && d.wordIds.length === 0
          ? { ...d, wordIds: starterWordIds(type, words, d.gridSize) }
          : d
      );
    } catch (e) {
      setProblem(toProblem(e));
    }
  }

  async function startNew() {
    setProblem(null);
    setActiveId(null);
    setSaved(null);
    const start = lists ? starterList(type, lists) : null;
    setDraft({ ...newDraft(type), wordListId: start?.id ?? null });
    setNotice(`Started a new ${TYPE_LABEL[type]}. It is not saved until you press Save.`);
    if (!start) return;
    try {
      const words = await ensureWords(start.id);
      setDraft((d) =>
        d.wordListId === start.id && d.wordIds.length === 0
          ? { ...d, wordIds: starterWordIds(type, words, d.gridSize) }
          : d
      );
    } catch (e) {
      setProblem(toProblem(e));
    }
  }

  async function load(a: ActivityDto) {
    setProblem(null);
    try {
      await ensureWords(a.wordListId);
      const d = draftFromActivity(a);
      setDraft(d);
      setSaved(d);
      setActiveId(a.id);
      setNotice(`Loaded “${a.title}” (activity #${a.id}) from the database.`);
    } catch (e) {
      setProblem(toProblem(e));
    }
  }

  async function refreshActivities() {
    setActivities(await api.listActivities(type));
  }

  function checkDraft(): boolean {
    const issues = draftIssues(type, draft);
    if (issues.length) {
      setProblem({ message: "This activity is not ready yet", details: issues });
      return false;
    }
    return true;
  }

  /** Create or update the activity on the server and adopt the stored version. */
  async function persist(asNew: boolean): Promise<ActivityDto> {
    const { wordListId, ...rest } = draft;
    const body = { ...rest, wordListId: wordListId as number };
    const result =
      activeId !== null && !asNew
        ? await api.updateActivity(activeId, body)
        : await api.createActivity({ ...body, type });
    const stored = draftFromActivity(result);
    setActiveId(result.id);
    setSaved(stored);
    setDraft(stored);
    await refreshActivities();
    return result;
  }

  async function save(asNew = false) {
    if (!checkDraft()) return;
    const creating = activeId === null || asNew;
    setBusy("saving");
    setProblem(null);
    try {
      const result = await persist(asNew);
      setNotice(creating ? `Saved as new activity #${result.id}.` : `Saved changes to activity #${result.id}.`);
    } catch (e) {
      setProblem(toProblem(e));
    } finally {
      setBusy(null);
    }
  }

  async function generate() {
    if (!checkDraft()) return;
    setBusy("generating");
    setProblem(null);
    try {
      let id = activeId;
      if (id === null || dirty) id = (await persist(false)).id;
      const filename = await downloadActivity(id);
      setNotice(`Downloaded ${filename}. The server built it from activity #${id} in the database.`);
    } catch (e) {
      setProblem(toProblem(e));
    } finally {
      setBusy(null);
    }
  }

  async function remove(a: ActivityDto) {
    setBusy("deleting");
    setProblem(null);
    try {
      await api.deleteActivity(a.id);
      await refreshActivities();
      if (a.id === activeId) {
        setActiveId(null);
        setSaved(null);
      }
      setNotice(`Deleted “${a.title}”.`);
    } catch (e) {
      setProblem(toProblem(e));
    } finally {
      setBusy(null);
    }
  }

  return {
    type,
    lists,
    activities,
    listWords,
    selectedWords,
    draft,
    update,
    setDifficulty,
    chooseList,
    startNew,
    load,
    save,
    generate,
    remove,
    activeId,
    dirty,
    busy,
    problem,
    clearProblem: () => setProblem(null),
    notice,
  };
}

export type ActivityBuilder = ReturnType<typeof useActivityBuilder>;
