/**
 * Dev utility: writes sample generated activities to ./samples so the
 * standalone HTML output can be inspected without clicking through the UI.
 * Run with: npx tsx scripts/generate-samples.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildWordleHtml } from "../lib/generate/wordle-html";
import { buildWordSearchHtml } from "../lib/generate/wordsearch-html";
import { buildWordSearch } from "../lib/wordsearch";
import { ALL_WORDS, WORDSEARCH_WORDS } from "../lib/words";

const outDir = join(__dirname, "..", "samples");
mkdirSync(outDir, { recursive: true });

const wordleHtml = buildWordleHtml({
  title: "Phoneme Wordle — TH words",
  word: ALL_WORDS.find((w) => w.english === "thin")!, // /θɪn/
  attempts: 5,
  showHints: true,
});
writeFileSync(join(outDir, "sample-wordle.html"), wordleHtml);

const wsConfig = {
  title: "Phoneme Word Search",
  words: WORDSEARCH_WORDS,
  gridSize: 10,
  allowDiagonals: false,
  showHints: true,
  seed: 1,
};
const grid = buildWordSearch(
  wsConfig.words,
  wsConfig.gridSize,
  wsConfig.allowDiagonals,
  wsConfig.seed
);
writeFileSync(
  join(outDir, "sample-word-search.html"),
  buildWordSearchHtml(wsConfig, grid)
);

console.log(`Samples written to ${outDir}`);
