"use client";

import { useState } from "react";
import { DifficultyPicker } from "@/components/activities/DifficultyPicker";
import { SaveGeneratePanel } from "@/components/activities/SaveGeneratePanel";
import { SavedActivities } from "@/components/activities/SavedActivities";
import { useActivityBuilder } from "@/components/activities/useActivityBuilder";
import { WordPicker } from "@/components/activities/WordPicker";
import { PhonemeWordChips } from "@/components/phonemes/PhonemeWordChips";
import { field } from "@/components/ui/buttons";
import { Card } from "@/components/ui/Card";
import { PageIntro } from "@/components/ui/PageIntro";
import { ATTEMPTS_RANGE } from "@/lib/constants";
import { WordlePreview } from "./WordlePreview";

const gap = { gap: "var(--density-gap, 1.5rem)" };
const ATTEMPT_OPTIONS = Array.from(
  { length: ATTEMPTS_RANGE.max - ATTEMPTS_RANGE.min + 1 },
  (_, i) => ATTEMPTS_RANGE.min + i
);

/** The Wordle builder: everything is loaded from, and saved to, the database. */
export function WordleBuilder() {
  const b = useActivityBuilder("WORDLE");
  const { draft } = b;
  const [round, setRound] = useState(0);
  const words = b.selectedWords;
  const safeRound = round < words.length ? round : 0;
  const current = words[safeRound];

  return (
    <>
      <PageIntro title="Wordle Builder">
        Choose phoneme words from a saved word list, set the difficulty and test the game. Save it to the
        database, then generate the classroom file from the stored activity.
      </PageIntro>

      <div className="grid items-start lg:grid-cols-2" style={gap}>
        <div className="flex min-w-0 flex-col" style={gap}>
          <SavedActivities builder={b} />

          <Card title="1 · Activity details">
            <label htmlFor="wordle-title" className="block text-sm font-medium">
              Activity title
            </label>
            <input
              id="wordle-title"
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
            <DifficultyPicker type="WORDLE" value={draft.difficulty} onChange={b.setDifficulty} />
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label htmlFor="wordle-attempts" className="block text-sm font-medium">
                  Guesses per word
                </label>
                <select
                  id="wordle-attempts"
                  value={draft.attempts}
                  onChange={(e) => b.update({ attempts: Number(e.target.value) })}
                  className={`${field} w-auto`}
                >
                  {ATTEMPT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} guesses
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.showHints}
                  onChange={(e) => b.update({ showHints: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Show mouse-over phoneme hints (/θ/: TH as in thin)
              </label>
            </div>
          </Card>

          <SaveGeneratePanel builder={b} />
        </div>

        <Card title="Live preview" className="min-w-0 lg:sticky lg:top-4">
          {!current ? (
            <p className="text-sm text-muted">Choose at least one word to preview the game.</p>
          ) : (
            <>
              {words.length > 1 && (
                <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Choose which word to preview">
                  {words.map((w, i) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setRound(i)}
                      aria-pressed={i === safeRound}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-accent ${
                        i === safeRound ? "border-accent bg-accent-soft text-accent" : "border-border hover:border-accent"
                      }`}
                    >
                      Word {i + 1}
                    </button>
                  ))}
                </div>
              )}
              <p className="mb-3 text-sm text-muted">
                Target: <PhonemeWordChips phonemes={current.phonemes} /> ={" "}
                <strong>“{current.english}”</strong> · {draft.attempts} guesses
              </p>
              <WordlePreview
                key={`${current.id}-${draft.attempts}`}
                word={current}
                attempts={draft.attempts}
                showHints={draft.showHints}
              />
              {words.length > 1 && (
                <p className="mt-4 text-xs text-muted">
                  In the generated file students play all {words.length} words in order, then see their score.
                </p>
              )}
            </>
          )}
        </Card>
      </div>
    </>
  );
}
