/**
 * Converts Prisma rows into the plain shapes the frontend and the HTML
 * generators already use (PhonemeWord etc.), so the Assessment 1 components
 * keep working unchanged on top of database data.
 */

import type { Prisma } from "@prisma/client";
import type { PhonemeWord } from "./words";

export const wordInclude = {
  phonemes: { orderBy: { position: "asc" as const } },
} satisfies Prisma.WordInclude;

export type WordRow = Prisma.WordGetPayload<{ include: typeof wordInclude }>;

export interface WordDto extends PhonemeWord {
  id: number;
  wordListId: number;
  updatedAt: string;
}

export function toWordDto(w: WordRow): WordDto {
  return {
    id: w.id,
    wordListId: w.wordListId,
    english: w.english,
    phonemes: w.phonemes.map((p) => p.symbol),
    updatedAt: w.updatedAt.toISOString(),
  };
}

export function toPhonemeWord(w: WordRow): PhonemeWord {
  return { english: w.english, phonemes: w.phonemes.map((p) => p.symbol) };
}
