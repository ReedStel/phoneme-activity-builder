/**
 * Seeds the database with the course materials:
 *  - the HCE phoneme inventory (symbols, English labels, example words)
 *  - the 90-word HCE corpus as three word lists (3, 4 and 5 phonemes)
 *  - a small starter list for the Word Search
 *  - one example Wordle and one example Word Search configuration
 *
 * Run with `npm run db:seed` (or automatically by `prisma migrate dev`).
 * The seed is idempotent: it clears the tables first, so re-running it
 * restores a known state.
 */

import { PrismaClient } from "@prisma/client";
import { PHONEMES } from "../lib/phonemes";
import { WORDS_3, WORDS_4, WORDS_5, WORDSEARCH_WORDS, type PhonemeWord } from "../lib/words";

const prisma = new PrismaClient();

async function createList(name: string, description: string, words: PhonemeWord[]) {
  return prisma.wordList.create({
    data: {
      name,
      description,
      words: {
        create: words.map((w) => ({
          english: w.english,
          phonemes: {
            create: w.phonemes.map((symbol, position) => ({ position, symbol })),
          },
        })),
      },
    },
    include: { words: true },
  });
}

async function main() {
  // Clear in dependency order (child tables first).
  await prisma.activityConfig.deleteMany();
  await prisma.wordPhoneme.deleteMany();
  await prisma.word.deleteMany();
  await prisma.wordList.deleteMany();
  await prisma.phoneme.deleteMany();

  await prisma.phoneme.createMany({
    data: PHONEMES.map((p, i) => ({
      symbol: p.ipa,
      label: p.label,
      example: p.example,
      type: p.type,
      sortOrder: i,
    })),
  });

  const list3 = await createList(
    "HCE corpus: 3-phoneme words",
    "30 three-phoneme words from the course corpus (easier).",
    WORDS_3
  );
  await createList(
    "HCE corpus: 4-phoneme words",
    "30 four-phoneme words from the course corpus (medium).",
    WORDS_4
  );
  await createList(
    "HCE corpus: 5-phoneme words",
    "30 five-phoneme words from the course corpus (harder).",
    WORDS_5
  );
  const starter = await createList(
    "Word Search starter set",
    "Five short words matching the sample puzzle provided with the assessment.",
    WORDSEARCH_WORDS
  );

  const thin = list3.words.find((w) => w.english === "thin");

  await prisma.activityConfig.create({
    data: {
      title: "Phoneme'le: thin",
      type: "WORDLE",
      difficulty: "easy",
      wordListId: list3.id,
      targetWordId: thin?.id,
      attempts: 5,
      showHints: true,
    },
  });

  await prisma.activityConfig.create({
    data: {
      title: "Phoneme Word Search",
      type: "WORDSEARCH",
      difficulty: "medium",
      wordListId: starter.id,
      gridSize: 10,
      allowDiagonals: false,
      showHints: true,
      seed: 1,
    },
  });

  const counts = {
    phonemes: await prisma.phoneme.count(),
    wordLists: await prisma.wordList.count(),
    words: await prisma.word.count(),
    wordPhonemes: await prisma.wordPhoneme.count(),
    activities: await prisma.activityConfig.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
