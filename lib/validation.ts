/**
 * Input validation for every API route, using zod.
 *
 * Phoneme symbols are validated in two stages: shape here (non-empty strings,
 * sensible lengths), then existence against the Phoneme inventory table in
 * the route, so the error message can name the exact unknown symbol.
 */

import { z } from "zod";

export const ACTIVITY_TYPES = ["WORDLE", "WORDSEARCH"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export const MAX_PHONEMES_PER_WORD = 8;
export const MAX_WORDS_PER_LIST = 100;

/** A single phoneme symbol such as "θ" or "tʃ" (multi-character allowed). */
export const phonemeSymbolSchema = z
  .string()
  .trim()
  .min(1, "Phoneme symbol cannot be empty")
  .max(4, "Phoneme symbol is too long");

export const englishWordSchema = z
  .string()
  .trim()
  .min(1, "English spelling is required")
  .max(30, "English spelling is too long (max 30 characters)")
  .regex(/^[a-z][a-z' -]*$/i, "English spelling may only contain letters, spaces, hyphens and apostrophes")
  .transform((s) => s.toLowerCase());

export const wordInputSchema = z.object({
  english: englishWordSchema,
  phonemes: z
    .array(phonemeSymbolSchema)
    .min(1, "A word needs at least one phoneme")
    .max(MAX_PHONEMES_PER_WORD, `A word may have at most ${MAX_PHONEMES_PER_WORD} phonemes`),
});

export const wordUpdateSchema = wordInputSchema.partial().refine(
  (v) => v.english !== undefined || v.phonemes !== undefined,
  "Provide an English spelling and/or a phoneme list to update"
);

export const wordListInputSchema = z.object({
  name: z.string().trim().min(1, "List name is required").max(80, "List name is too long"),
  description: z.string().trim().max(300, "Description is too long").optional().nullable(),
  words: z
    .array(wordInputSchema)
    .max(MAX_WORDS_PER_LIST, `A list may hold at most ${MAX_WORDS_PER_LIST} words`)
    .optional(),
});

export const wordListUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "List name is required").max(80, "List name is too long").optional(),
    description: z.string().trim().max(300, "Description is too long").optional().nullable(),
  })
  .refine((v) => v.name !== undefined || v.description !== undefined, "Nothing to update");

const activityBase = {
  title: z.string().trim().min(1, "Title is required").max(80, "Title is too long"),
  type: z.enum(ACTIVITY_TYPES, { message: "type must be WORDLE or WORDSEARCH" }),
  difficulty: z.enum(DIFFICULTIES, { message: "difficulty must be easy, medium or hard" }).default("medium"),
  wordListId: z.number().int().positive("wordListId must be a positive integer"),
  targetWordId: z.number().int().positive().nullable().optional(),
  attempts: z.number().int().min(3, "attempts must be 3 to 8").max(8, "attempts must be 3 to 8").default(5),
  gridSize: z.number().int().min(6, "gridSize must be 6 to 14").max(14, "gridSize must be 6 to 14").default(10),
  allowDiagonals: z.boolean().default(false),
  showHints: z.boolean().default(true),
  seed: z.number().int().min(1).max(1_000_000).default(1),
};

export const activityInputSchema = z.object(activityBase).superRefine((v, ctx) => {
  if (v.type === "WORDLE" && !v.targetWordId) {
    ctx.addIssue({
      code: "custom",
      path: ["targetWordId"],
      message: "A Wordle activity needs a targetWordId (the single word to guess)",
    });
  }
});

export const activityUpdateSchema = z.object({
  title: activityBase.title.optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  wordListId: activityBase.wordListId.optional(),
  targetWordId: activityBase.targetWordId,
  attempts: z.number().int().min(3).max(8).optional(),
  gridSize: z.number().int().min(6).max(14).optional(),
  allowDiagonals: z.boolean().optional(),
  showHints: z.boolean().optional(),
  seed: z.number().int().min(1).max(1_000_000).optional(),
});

/** Turn a zod error into a flat, human-readable list of messages. */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message));
}
