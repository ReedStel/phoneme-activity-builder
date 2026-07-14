"use client";

import { useMemo, useState } from "react";
import { hintFor, ipaWord } from "@/lib/phonemes";
import type { WordSearchGrid, Placement } from "@/lib/wordsearch";

type Cell = [number, number];

function straightPath(a: Cell, b: Cell): Cell[] | null {
  const dr = Math.sign(b[0] - a[0]);
  const dc = Math.sign(b[1] - a[1]);
  const isStraight =
    dr === 0 || dc === 0 || Math.abs(b[0] - a[0]) === Math.abs(b[1] - a[1]);
  if (!isStraight) return null;
  const len = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) + 1;
  return Array.from({ length: len }, (_, i) => [a[0] + dr * i, a[1] + dc * i]);
}

function samePath(a: Cell[], b: Cell[]): boolean {
  return (
    a.length === b.length &&
    a.every((cell, i) => cell[0] === b[i][0] && cell[1] === b[i][1])
  );
}

/**
 * Playable Word Search preview. Selection model: click the first phoneme of
 * a word, then its last phoneme (simpler and more touch-friendly than drag).
 */
export function WordSearchPreview({
  data,
  showHints,
}: {
  data: WordSearchGrid;
  showHints: boolean;
}) {
  const [found, setFound] = useState<Set<string>>(new Set());
  const [start, setStart] = useState<Cell | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [message, setMessage] = useState(
    "Click the FIRST phoneme of a word, then its LAST phoneme."
  );

  // Teacher aid: highlights every placed word (like the sample activity).
  const answerCells = useMemo(() => {
    const set = new Set<string>();
    for (const p of data.placements) {
      p.cells.forEach(([r, c]) => set.add(`${r},${c}`));
    }
    return set;
  }, [data.placements]);

  const foundCells = useMemo(() => {
    const set = new Set<string>();
    for (const p of data.placements) {
      if (found.has(p.word.english)) {
        p.cells.forEach(([r, c]) => set.add(`${r},${c}`));
      }
    }
    return set;
  }, [found, data.placements]);

  const allFound = found.size === data.placements.length;

  const onCell = (r: number, c: number) => {
    if (!start) {
      setStart([r, c]);
      setMessage("Now click the LAST phoneme of the word.");
      return;
    }
    const path = straightPath(start, [r, c]);
    setStart(null);
    if (!path) {
      setMessage("Selections must be in a straight line — try again.");
      return;
    }
    const reversed = [...path].reverse();
    const hit = data.placements.find(
      (p: Placement) =>
        !found.has(p.word.english) &&
        (samePath(path, p.cells) || samePath(reversed, p.cells))
    );
    if (!hit) {
      setMessage("That is not one of the hidden words — keep looking!");
      return;
    }
    const next = new Set(found);
    next.add(hit.word.english);
    setFound(next);
    setMessage(
      next.size === data.placements.length
        ? `Fantastic! You found all ${data.placements.length} phoneme words!`
        : `Found ${ipaWord(hit.word.phonemes)} ("${hit.word.english}"). ${
            data.placements.length - next.size
          } to go.`
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <ul aria-label="Words to find" className="flex flex-wrap justify-center gap-2">
        {data.placements.map((p) => {
          const isFound = found.has(p.word.english);
          return (
            <li
              key={p.word.english}
              className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                isFound
                  ? "border-tile-correct bg-accent-soft text-tile-correct line-through"
                  : "border-border bg-surface"
              }`}
            >
              {ipaWord(p.word.phonemes)}
              {isFound && (
                <span className="ml-1 font-medium no-underline">
                  = &ldquo;{p.word.english}&rdquo;
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Scroll container keeps large grids usable on narrow screens */}
      <div className="max-w-full overflow-x-auto pb-1">
        <div
          role="grid"
          aria-label="Word search grid"
          className="grid w-max gap-1"
          style={{ gridTemplateColumns: `repeat(${data.size}, auto)` }}
        >
          {data.grid.map((rowArr, r) =>
            rowArr.map((ipa, c) => {
              const key = `${r},${c}`;
              const isStart = start?.[0] === r && start?.[1] === c;
              const isFound = foundCells.has(key);
              const isRevealed = showAnswers && answerCells.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onCell(r, c)}
                  title={showHints ? hintFor(ipa) : undefined}
                  aria-label={`Row ${r + 1}, column ${c + 1}: ${hintFor(ipa)}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent sm:h-10 sm:w-10 sm:text-sm ${
                    isFound
                      ? "border-tile-correct bg-tile-correct text-white"
                      : isStart
                        ? "border-accent bg-accent-soft"
                        : isRevealed
                          ? "border-tile-present bg-accent-soft"
                          : "border-border bg-surface hover:border-accent"
                  }`}
                >
                  {ipa}
                </button>
              );
            })
          )}
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`min-h-6 text-center text-sm font-semibold ${allFound ? "text-tile-correct" : ""}`}
      >
        {message}
      </p>

      <button
        type="button"
        onClick={() => setShowAnswers((v) => !v)}
        aria-pressed={showAnswers}
        className="pressable rounded-full border border-border bg-surface px-5 py-2 text-sm font-semibold hover:border-accent hover:bg-highlight"
      >
        {showAnswers ? "Hide answers" : "Show answers"}
      </button>
    </div>
  );
}
