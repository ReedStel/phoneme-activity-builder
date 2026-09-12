"use client";

import { useMemo } from "react";
import { DifficultyPicker } from "@/components/activities/DifficultyPicker";
import { SaveGeneratePanel } from "@/components/activities/SaveGeneratePanel";
import { SavedActivities } from "@/components/activities/SavedActivities";
import { useActivityBuilder } from "@/components/activities/useActivityBuilder";
import { WordPicker } from "@/components/activities/WordPicker";
import { btn, field } from "@/components/ui/buttons";
import { Card } from "@/components/ui/Card";
import { PageIntro } from "@/components/ui/PageIntro";
import { WORD_LIMITS } from "@/lib/constants";
import { buildWordSearch } from "@/lib/wordsearch";
import { WordSearchPreview } from "./WordSearchPreview";

const gap = { gap: "var(--density-gap, 1.5rem)" };
const GRID_OPTIONS = [6, 8, 10, 12, 14];

/** The Word Search builder: everything is loaded from, and saved to, the database. */
export function WordSearchBuilder() {
  const b = useActivityBuilder("WORDSEARCH");
  const { draft } = b;
  const words = b.selectedWords;

  // The same seeded generator runs on the server, so the downloaded puzzle
  // is exactly the one previewed here.
  const preview = useMemo(() => {
    const { min } = WORD_LIMITS.WORDSEARCH;
    if (words.length < min) {
      return { error: `Choose at least ${min} words to preview the puzzle.` };
    }
    try {
      return { grid: buildWordSearch(words, draft.gridSize, draft.allowDiagonals, draft.seed) };
    } catch {
      return { error: "These words do not fit on the grid. Try a bigger grid, allow diagonals, or choose fewer words." };
    }
  }, [words, draft.gridSize, draft.allowDiagonals, draft.seed]);

  return (
    <>
      <PageIntro title="Word Search Builder">
        Build a phoneme word search from any saved word list. Pick the words and difficulty, reshuffle until you
        like the layout, then save it and generate the classroom file from the stored activity.
      </PageIntro>

      <div className="grid items-start lg:grid-cols-2" style={gap}>
        <div className="flex min-w-0 flex-col" style={gap}>
          <SavedActivities builder={b} />

          <Card title="1 · Activity details">
            <label htmlFor="ws-title" className="block text-sm font-medium">
              Activity title
            </label>
            <input
              id="ws-title"
              value={draft.title}
              onChange={(e) => b.update({ title: e.target.value })}
              maxLength={80}
              className={field}
            />
          </Card>

          <Card title="2 · Choose words">
            <WordPicker builder={b} />
          </Card>

          <Card title="3 · Difficulty">
            <DifficultyPicker type="WORDSEARCH" value={draft.difficulty} onChange={b.setDifficulty} />
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label htmlFor="ws-grid" className="block text-sm font-medium">
                  Grid size
                </label>
                <select
                  id="ws-grid"
                  value={draft.gridSize}
                  onChange={(e) => b.update({ gridSize: Number(e.target.value) })}
                  className={`${field} w-auto`}
                >
                  {GRID_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} by {n}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.allowDiagonals}
                  onChange={(e) => b.update({ allowDiagonals: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Allow diagonal words
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.showHints}
                  onChange={(e) => b.update({ showHints: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Show mouse-over phoneme hints
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => b.update({ seed: draft.seed + 1 })} className={btn.secondary}>
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
              <span className="text-xs text-muted">Layout #{draft.seed} (saved with the activity)</span>
            </div>
          </Card>

          <SaveGeneratePanel builder={b} />
        </div>

        <Card title="Live preview" className="min-w-0 lg:sticky lg:top-4">
          {"grid" in preview && preview.grid ? (
            <WordSearchPreview
              key={`${draft.gridSize}-${draft.allowDiagonals}-${draft.seed}-${draft.wordIds.join(".")}`}
              data={preview.grid}
              showHints={draft.showHints}
            />
          ) : (
            <p className="text-sm text-muted">{preview.error}</p>
          )}
        </Card>
      </div>
    </>
  );
}
