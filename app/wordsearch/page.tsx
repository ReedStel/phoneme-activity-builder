"use client";

import { useMemo, useState } from "react";
import { PhonemeWordChips } from "@/components/phonemes/PhonemeWordChips";
import { Card } from "@/components/ui/Card";
import { GenerateButton } from "@/components/ui/GenerateButton";
import { WordSearchPreview } from "@/components/wordsearch/WordSearchPreview";
import { downloadHtml } from "@/lib/generate/shared";
import {
  buildWordSearchHtml,
  wordSearchFilename,
} from "@/lib/generate/wordsearch-html";
import { buildWordSearch } from "@/lib/wordsearch";
import { WORDSEARCH_WORDS } from "@/lib/words";

const GRID_SIZES = [8, 10, 12];

export default function WordSearchPage() {
  const [title, setTitle] = useState("Phoneme Word Search");
  const [gridSize, setGridSize] = useState(10);
  const [allowDiagonals, setAllowDiagonals] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [seed, setSeed] = useState(1);

  // The same seeded grid drives both the preview and the generated file,
  // so the teacher downloads exactly the puzzle they previewed.
  const generated = useMemo(
    () => buildWordSearch(WORDSEARCH_WORDS, gridSize, allowDiagonals, seed),
    [gridSize, allowDiagonals, seed]
  );

  const generate = () => {
    const config = {
      title,
      words: WORDSEARCH_WORDS,
      gridSize,
      allowDiagonals,
      showHints,
      seed,
    };
    downloadHtml(
      wordSearchFilename(config),
      buildWordSearchHtml(config, generated)
    );
    return wordSearchFilename(config);
  };

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Word Search Builder</h2>
        <p className="mt-1 text-sm text-muted">
          Generates a phoneme word search from a small fixed word list
          (Assessment 1). Preview it, reshuffle the layout, then download the
          standalone HTML activity.
        </p>
      </div>

      <div
        className="grid items-start lg:grid-cols-2"
        style={{ gap: "var(--density-gap, 1.5rem)" }}
      >
        <div
          className="flex min-w-0 flex-col"
          style={{ gap: "var(--density-gap, 1.5rem)" }}
        >
          <Card title="1 · Activity details">
            <label className="block text-sm font-medium" htmlFor="ws-title">
              Activity title
            </label>
            <input
              id="ws-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent"
            />
          </Card>

          <Card title="2 · Word list (fixed for Assessment 1)">
            <ul className="space-y-2">
              {WORDSEARCH_WORDS.map((w) => (
                <li
                  key={w.english}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <PhonemeWordChips phonemes={w.phonemes} />
                  <span className="text-muted">= “{w.english}”</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              Dynamic word-list management arrives with the database in
              Assessment 2.
            </p>
          </Card>

          <Card title="3 · Difficulty settings">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label
                  className="block text-sm font-medium"
                  htmlFor="grid-size"
                >
                  Grid size
                </label>
                <select
                  id="grid-size"
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {GRID_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n} × {n}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={allowDiagonals}
                  onChange={(e) => setAllowDiagonals(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Allow diagonal words (harder)
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={showHints}
                  onChange={(e) => setShowHints(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Show mouse-over phoneme hints
              </label>
            </div>
            <button
              type="button"
              onClick={() => setSeed((s) => s + 1)}
              className="pressable mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-accent hover:bg-highlight"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8m0 0V3m0 5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16m0 0v5m0-5h5" />
              </svg>
              Reshuffle layout
            </button>
          </Card>

          <Card title="4 · Generate">
            <GenerateButton onGenerate={generate} />
          </Card>
        </div>

        <Card title="Live preview" className="min-w-0 lg:sticky lg:top-4">
          <WordSearchPreview
            key={`${gridSize}-${allowDiagonals}-${seed}`}
            data={generated}
            showHints={showHints}
          />
        </Card>
      </div>
    </>
  );
}
