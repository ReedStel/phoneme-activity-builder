/**
 * Server-side rules for words that need the database:
 *  - every phoneme must exist in the HCE Phoneme inventory table, and
 *  - an English spelling may appear only once in a word list.
 *
 * Both throw an ApiError whose details name the exact problem, so the
 * teacher can see what to fix without guessing.
 */

import { prisma } from "./db";
import { ApiError } from "./api";
import { describeUnknownPhoneme } from "./phoneme-normalize";

interface WordLike {
  english: string;
  phonemes: string[];
}

/** Check every phoneme against the inventory table in a single query. */
export async function assertKnownPhonemes(words: WordLike[]): Promise<void> {
  const unique = [...new Set(words.flatMap((w) => w.phonemes))];
  if (unique.length === 0) return;

  const known = await prisma.phoneme.findMany({
    where: { symbol: { in: unique } },
    select: { symbol: true },
  });
  const knownSet = new Set(known.map((k) => k.symbol));

  const details: string[] = [];
  words.forEach((w, i) => {
    const bad = [...new Set(w.phonemes.filter((p) => !knownSet.has(p)))];
    const prefix = words.length > 1 ? `Word ${i + 1} ("${w.english}")` : `"${w.english}"`;
    for (const symbol of bad) details.push(`${prefix}: ${describeUnknownPhoneme(symbol)}`);
  });

  if (details.length) throw new ApiError(400, "Unknown phoneme symbol(s)", details);
}

/**
 * Reject spellings that repeat within the incoming words, or that already
 * exist in the list. `ignoreWordId` lets a word keep its own spelling when
 * it is being edited.
 */
export async function assertUniqueSpellings(
  wordListId: number | null,
  words: { english: string }[],
  ignoreWordId?: number
): Promise<void> {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const w of words) {
    if (seen.has(w.english)) repeated.add(w.english);
    seen.add(w.english);
  }
  if (repeated.size) {
    throw new ApiError(
      409,
      "The same word appears more than once",
      [...repeated].map((e) => `"${e}" is listed more than once`)
    );
  }
  if (wordListId === null) return;

  const clashes = await prisma.word.findMany({
    where: {
      wordListId,
      english: { in: [...seen] },
      ...(ignoreWordId ? { id: { not: ignoreWordId } } : {}),
    },
    select: { english: true },
  });
  if (clashes.length) {
    throw new ApiError(
      409,
      "Word already in this list",
      clashes.map((c) => `"${c.english}" is already in this list`)
    );
  }
}
