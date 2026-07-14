/**
 * Word Search grid generation.
 *
 * The grid is built from a seed so the in-app preview and the downloaded
 * HTML file show exactly the same puzzle: the seed is embedded in the
 * generated file's config.
 */

import type { PhonemeWord } from "./words";

export interface Placement {
  word: PhonemeWord;
  /** [row, col] of every cell the word occupies, in phoneme order */
  cells: [number, number][];
}

export interface WordSearchGrid {
  size: number;
  /** grid[row][col] = phoneme IPA symbol */
  grid: string[][];
  placements: Placement[];
}

/** Small deterministic PRNG (mulberry32) so puzzles are reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ORTHOGONAL: [number, number][] = [
  [0, 1], // right
  [1, 0], // down
];
const DIAGONAL: [number, number][] = [
  [1, 1], // down-right
  [-1, 1], // up-right
];

/**
 * Place every word on the grid, then fill empty cells with phonemes drawn
 * from the words themselves (so decoys are plausible sounds, not noise).
 * Throws only if the grid is too small for the longest word, which the UI
 * prevents by construction.
 */
export function buildWordSearch(
  words: PhonemeWord[],
  size: number,
  allowDiagonals: boolean,
  seed: number
): WordSearchGrid {
  const rand = mulberry32(seed);
  const directions = allowDiagonals
    ? [...ORTHOGONAL, ...DIAGONAL]
    : ORTHOGONAL;

  // Retry whole-grid construction until every word fits (bounded attempts).
  for (let attempt = 0; attempt < 50; attempt++) {
    const grid: (string | null)[][] = Array.from({ length: size }, () =>
      Array<string | null>(size).fill(null)
    );
    const placements: Placement[] = [];
    let ok = true;

    for (const word of words) {
      const placed = tryPlaceWord(grid, word, directions, size, rand);
      if (!placed) {
        ok = false;
        break;
      }
      placements.push(placed);
    }

    if (!ok) continue;

    // Fill the remaining cells with phonemes sampled from the word list.
    const pool = words.flatMap((w) => w.phonemes);
    const filled = grid.map((row) =>
      row.map((cell) => cell ?? pool[Math.floor(rand() * pool.length)])
    );
    return { size, grid: filled, placements };
  }

  throw new Error("Could not fit all words on the grid — increase the grid size.");
}

function tryPlaceWord(
  grid: (string | null)[][],
  word: PhonemeWord,
  directions: [number, number][],
  size: number,
  rand: () => number
): Placement | null {
  const len = word.phonemes.length;

  for (let tries = 0; tries < 200; tries++) {
    const [dr, dc] = directions[Math.floor(rand() * directions.length)];
    const row = Math.floor(rand() * size);
    const col = Math.floor(rand() * size);
    const endRow = row + dr * (len - 1);
    const endCol = col + dc * (len - 1);
    if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;

    const cells: [number, number][] = [];
    let fits = true;
    for (let i = 0; i < len; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const existing = grid[r][c];
      if (existing !== null && existing !== word.phonemes[i]) {
        fits = false;
        break;
      }
      cells.push([r, c]);
    }
    if (!fits) continue;

    cells.forEach(([r, c], i) => {
      grid[r][c] = word.phonemes[i];
    });
    return { word, cells };
  }
  return null;
}
