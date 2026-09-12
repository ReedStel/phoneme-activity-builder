/**
 * Constants shared by the server (validation, generation) and the browser
 * (builder forms). This file has no dependencies, so importing it never
 * pulls the validation library into the client bundle.
 */

export const ACTIVITY_TYPES = ["WORDLE", "WORDSEARCH"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const TYPE_LABEL: Record<ActivityType, string> = {
  WORDLE: "Wordle",
  WORDSEARCH: "Word Search",
};

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const MAX_PHONEMES_PER_WORD = 8;
export const MAX_WORDS_PER_LIST = 100;

/** How many words each activity type may use. */
export const WORD_LIMITS: Record<ActivityType, { min: number; max: number }> = {
  WORDLE: { min: 1, max: 10 },
  WORDSEARCH: { min: 3, max: 12 },
};

export const ATTEMPTS_RANGE = { min: 3, max: 8 };
export const GRID_RANGE = { min: 6, max: 14 };

/**
 * What each difficulty level sets. Teachers can still fine-tune any value
 * afterwards; the level itself is saved with the activity as a label.
 */
export const DIFFICULTY_PRESETS = {
  WORDLE: {
    easy: { attempts: 6, showHints: true },
    medium: { attempts: 5, showHints: true },
    hard: { attempts: 4, showHints: false },
  },
  WORDSEARCH: {
    easy: { gridSize: 8, allowDiagonals: false, showHints: true },
    medium: { gridSize: 10, allowDiagonals: false, showHints: true },
    hard: { gridSize: 12, allowDiagonals: true, showHints: false },
  },
} as const;

export const DIFFICULTY_SUMMARY: Record<ActivityType, Record<Difficulty, string>> = {
  WORDLE: {
    easy: "6 guesses, hints on",
    medium: "5 guesses, hints on",
    hard: "4 guesses, no hints",
  },
  WORDSEARCH: {
    easy: "8 by 8 grid, straight lines",
    medium: "10 by 10 grid, straight lines",
    hard: "12 by 12, diagonals, no hints",
  },
};
