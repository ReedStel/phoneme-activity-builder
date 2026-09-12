/**
 * Seeds the database with the course materials:
 *  - the HCE phoneme inventory (symbols, English labels, example words)
 *  - the 90-word HCE corpus as three word lists (3, 4 and 5 phonemes)
 *  - a five-word starter list matching the sample Word Search
 *  - three example activities (two Wordles and a Word Search)
 *
 * `npm run db:seed` resets the data to this known state.
 * `node dist/seed.cjs --if-empty` (used by the Docker entrypoint) only seeds
 * a brand-new database, so a teacher's saved work survives restarts.
 */

import { PrismaClient } from "@prisma/client";
import { PHONEMES } from "../lib/phonemes";
import { WORDS_3, WORDS_4, WORDS_5, WORDSEARCH_WORDS, type PhonemeWord } from "../lib/words";

const prisma = new PrismaClient();
const ifEmpty = process.argv.includes("--if-empty");

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

/** Look up word ids by spelling, keeping the given order. */
function pick(list: { words: { id: number; english: string }[] }, spellings: string[]) {
  return spellings.map((spelling, position) => {
    const word = list.words.find((w) => w.english === spelling);
    if (!word) throw new Error(`Seed word "${spelling}" is missing from its list`);
    return { wordId: word.id, position };
  });
}

async function main() {
  if (ifEmpty && (await prisma.phoneme.count()) > 0) {
    console.log("Database already has data, so the seed was skipped.");
    return;
  }

  // Clear in dependency order (child tables first), then restart the ids.
  await prisma.activityWord.deleteMany();
  await prisma.activityConfig.deleteMany();
  await prisma.wordPhoneme.deleteMany();
  await prisma.word.deleteMany();
  await prisma.wordList.deleteMany();
  await prisma.phoneme.deleteMany();
  try {
    await prisma.$executeRaw`DELETE FROM sqlite_sequence`;
  } catch {
    // sqlite_sequence only exists once a table has used autoincrement.
  }

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
  const list5 = await createList(
    "HCE corpus: 5-phoneme words",
    "30 five-phoneme words from the course corpus (harder).",
    WORDS_5
  );
  const starter = await createList(
    "Word Search starter set",
    "Five short words matching the sample puzzle provided with the assessment.",
    WORDSEARCH_WORDS
  );

  await prisma.activityConfig.create({
    data: {
      title: "Phoneme'le: TH, SH and CH words",
      type: "WORDLE",
      difficulty: "easy",
      wordListId: list3.id,
      attempts: 6,
      showHints: true,
      words: { create: pick(list3, ["thin", "ship", "chin"]) },
    },
  });

  await prisma.activityConfig.create({
    data: {
      title: "Consonant cluster challenge",
      type: "WORDLE",
      difficulty: "hard",
      wordListId: list5.id,
      attempts: 4,
      showHints: false,
      words: { create: pick(list5, ["street", "splash", "sprout"]) },
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
      words: { create: pick(starter, ["chin", "jam", "bad", "log", "ring"]) },
    },
  });

  const counts = {
    phonemes: await prisma.phoneme.count(),
    wordLists: await prisma.wordList.count(),
    words: await prisma.word.count(),
    wordPhonemes: await prisma.wordPhoneme.count(),
    activities: await prisma.activityConfig.count(),
    activityWords: await prisma.activityWord.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
