/**
 * Input validation for every API route, using zod.
 *
 * Phoneme symbols are validated in two stages. Here they are normalised
 * (see lib/phoneme-normalize.ts) and checked for shape. The route then checks
 * each one against the Phoneme inventory table, so the error can name the
 * exact unknown symbol and suggest the HCE symbol that was probably meant.
 * Rules that need the database (a word belongs to the chosen list, spellings
 * are unique) live in lib/word-rules.ts and lib/activities.ts.
 */

import { z } from "zod";
import { normalizeSymbol } from "./phoneme-normalize";
import {
  ACTIVITY_TYPES,
  ATTEMPTS_RANGE,
  DIFFICULTIES,
  GRID_RANGE,
  MAX_PHONEMES_PER_WORD,
  MAX_WORDS_PER_LIST,
} from "./constants";

export {
  ACTIVITY_TYPES,
  ATTEMPTS_RANGE,
  DIFFICULTIES,
  GRID_RANGE,
  MAX_PHONEMES_PER_WORD,
  MAX_WORDS_PER_LIST,
  WORD_LIMITS,
} from "./constants";
export type { ActivityType, Difficulty } from "./constants";

/** A single phoneme symbol such as "θ" or "tʃ" (multi-character allowed). */
export const phonemeSymbolSchema = z
  .string({ error: 'Each phoneme must be text, for example "tʃ"' })
  .transform(normalizeSymbol)
  .refine((s) => s.length > 0, "Phoneme symbol cannot be empty")
  .refine((s) => s.length <= 4, "Phoneme symbol is too long");

export const phonemeListSchema = z
  .array(phonemeSymbolSchema, {
    error: 'phonemes must be a list of symbols, for example ["tʃ", "ɪ", "n"]',
  })
  .min(1, "A word needs at least one phoneme")
  .max(MAX_PHONEMES_PER_WORD, `A word may have at most ${MAX_PHONEMES_PER_WORD} phonemes`);

export const englishWordSchema = z
  .string({ error: "English spelling must be text" })
  .trim()
  .min(1, "English spelling is required")
  .max(30, "English spelling is too long (30 characters at most)")
  .regex(
    /^[a-z][a-z' -]*$/i,
    "English spelling may only contain letters, spaces, hyphens and apostrophes"
  )
  .transform((s) => s.toLowerCase());

export const wordInputSchema = z.object({
  english: englishWordSchema,
  phonemes: phonemeListSchema,
});
export type WordInput = z.infer<typeof wordInputSchema>;

/** Bulk import: several words in one request, stored all-or-nothing. */
export const wordBatchSchema = z.object({
  words: z
    .array(wordInputSchema, { error: "words must be a list of words" })
    .min(1, "Add at least one word")
    .max(MAX_WORDS_PER_LIST, `At most ${MAX_WORDS_PER_LIST} words can be imported at once`),
});

export const wordUpdateSchema = z
  .object({
    english: englishWordSchema.optional(),
    phonemes: phonemeListSchema.optional(),
  })
  .refine(
    (v) => v.english !== undefined || v.phonemes !== undefined,
    "Provide an English spelling and/or a phoneme list to update"
  );

const listName = z
  .string({ error: "List name must be text" })
  .trim()
  .min(1, "List name is required")
  .max(80, "List name is too long (80 characters at most)");

const listDescription = z
  .string({ error: "Description must be text" })
  .trim()
  .max(300, "Description is too long (300 characters at most)")
  .nullable()
  .optional();

export const wordListInputSchema = z.object({
  name: listName,
  description: listDescription,
  words: z
    .array(wordInputSchema)
    .max(MAX_WORDS_PER_LIST, `A list may hold at most ${MAX_WORDS_PER_LIST} words`)
    .optional(),
});

export const wordListUpdateSchema = z
  .object({
    name: listName.optional(),
    description: listDescription,
  })
  .refine((v) => v.name !== undefined || v.description !== undefined, "Nothing to update");

const idField = (field: string) =>
  z
    .number({ error: `${field} must be a number` })
    .int(`${field} must be a whole number`)
    .positive(`${field} must be positive`);

const fields = {
  title: z
    .string({ error: "Title must be text" })
    .trim()
    .min(1, "Title is required")
    .max(80, "Title is too long (80 characters at most)"),
  type: z.enum(ACTIVITY_TYPES, { error: "type must be WORDLE or WORDSEARCH" }),
  difficulty: z.enum(DIFFICULTIES, { error: "difficulty must be easy, medium or hard" }),
  wordListId: idField("wordListId"),
  wordIds: z
    .array(idField("Each word id"), { error: "wordIds must be a list of word ids" })
    .min(1, "Choose at least one word")
    .max(12, "Choose at most 12 words"),
  attempts: z
    .number({ error: "attempts must be a number" })
    .int("attempts must be a whole number")
    .min(ATTEMPTS_RANGE.min, `attempts must be ${ATTEMPTS_RANGE.min} to ${ATTEMPTS_RANGE.max}`)
    .max(ATTEMPTS_RANGE.max, `attempts must be ${ATTEMPTS_RANGE.min} to ${ATTEMPTS_RANGE.max}`),
  gridSize: z
    .number({ error: "gridSize must be a number" })
    .int("gridSize must be a whole number")
    .min(GRID_RANGE.min, `gridSize must be ${GRID_RANGE.min} to ${GRID_RANGE.max}`)
    .max(GRID_RANGE.max, `gridSize must be ${GRID_RANGE.min} to ${GRID_RANGE.max}`),
  allowDiagonals: z.boolean({ error: "allowDiagonals must be true or false" }),
  showHints: z.boolean({ error: "showHints must be true or false" }),
  seed: z
    .number({ error: "seed must be a number" })
    .int("seed must be a whole number")
    .min(1, "seed must be 1 to 1,000,000")
    .max(1_000_000, "seed must be 1 to 1,000,000"),
};

export const activityInputSchema = z.object({
  title: fields.title,
  type: fields.type,
  difficulty: fields.difficulty.default("medium"),
  wordListId: fields.wordListId,
  wordIds: fields.wordIds,
  attempts: fields.attempts.default(5),
  gridSize: fields.gridSize.default(10),
  allowDiagonals: fields.allowDiagonals.default(false),
  showHints: fields.showHints.default(true),
  seed: fields.seed.default(1),
});
export type ActivityInput = z.infer<typeof activityInputSchema>;

export const activityUpdateSchema = z
  .object({
    title: fields.title.optional(),
    difficulty: fields.difficulty.optional(),
    wordListId: fields.wordListId.optional(),
    wordIds: fields.wordIds.optional(),
    attempts: fields.attempts.optional(),
    gridSize: fields.gridSize.optional(),
    allowDiagonals: fields.allowDiagonals.optional(),
    showHints: fields.showHints.optional(),
    seed: fields.seed.optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), "Nothing to update");

/** Turn zod paths like ["words", 2, "phonemes", 0] into "Word 3, phoneme 1". */
function describePath(path: PropertyKey[]): string {
  const parts: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    const next = path[i + 1];
    if (typeof next === "number" && (key === "words" || key === "phonemes" || key === "wordIds")) {
      const noun = key === "words" ? "Word" : key === "phonemes" ? "phoneme" : "word id";
      parts.push(`${noun} ${next + 1}`);
      i++;
      continue;
    }
    parts.push(String(key));
  }
  return parts.join(", ");
}

/** Turn a zod error into a flat, human-readable list of messages. */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) =>
    i.path.length ? `${describePath(i.path)}: ${i.message}` : i.message
  );
}
