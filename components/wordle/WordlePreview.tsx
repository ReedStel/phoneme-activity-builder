"use client";

import { useEffect, useState } from "react";
import { hintFor, ipaWord } from "@/lib/phonemes";
import { mergeKeyState, scoreGuess, type CellState } from "@/lib/wordle";
import type { PhonemeWord } from "@/lib/words";
import { PhonemeKeyboard } from "../phonemes/PhonemeKeyboard";

interface GuessRow {
  phonemes: string[];
  result: CellState[];
}

const CELL_STATE_CLASSES: Record<CellState, string> = {
  correct: "bg-tile-correct border-tile-correct text-white",
  present: "bg-tile-present border-tile-present text-white",
  absent: "bg-tile-absent border-tile-absent text-white",
};

/**
 * Fully playable Wordle preview so the teacher can test the activity
 * exactly as students will experience it before generating the HTML file.
 */
export function WordlePreview({
  word,
  attempts,
  showHints,
}: {
  word: PhonemeWord;
  attempts: number;
  showHints: boolean;
}) {
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [current, setCurrent] = useState<string[]>([]);
  const [keyStates, setKeyStates] = useState<Record<string, CellState>>({});
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [message, setMessage] = useState("");

  // Note: the parent passes a `key` derived from the configuration, so this
  // component remounts (a fresh game) whenever the word or settings change.
  const target = word.phonemes;

  const press = (ipa: string) => {
    if (status !== "playing" || current.length >= target.length) return;
    setCurrent((c) => [...c, ipa]);
    setMessage("");
  };

  const backspace = () => {
    if (status !== "playing") return;
    setCurrent((c) => c.slice(0, -1));
  };

  const submit = () => {
    if (status !== "playing") return;
    if (current.length < target.length) {
      setMessage(
        `Add ${target.length - current.length} more phoneme(s) before checking.`
      );
      return;
    }
    const result = scoreGuess(current, target);
    setKeyStates((prev) => {
      const next = { ...prev };
      current.forEach((p, i) => {
        next[p] = mergeKeyState(next[p], result[i]);
      });
      return next;
    });
    const nextGuesses = [...guesses, { phonemes: current, result }];
    setGuesses(nextGuesses);
    setCurrent([]);

    if (result.every((s) => s === "correct")) {
      setStatus("won");
      setMessage("Correct! Well done!");
    } else if (nextGuesses.length >= attempts) {
      setStatus("lost");
      setMessage("Out of attempts — the answer is revealed below.");
    } else {
      setMessage(`Not quite — attempt ${nextGuesses.length + 1} of ${attempts}.`);
    }
  };

  // Physical keyboard support: Enter submits, Backspace deletes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") submit();
      if (e.key === "Backspace") backspace();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const rows: { phonemes: string[]; result?: CellState[] }[] = [
    ...guesses,
    ...(status === "playing" ? [{ phonemes: current }] : []),
  ];
  while (rows.length < attempts) rows.push({ phonemes: [] });

  return (
    <div className="flex flex-col items-center gap-4">
      <div role="grid" aria-label="Guess board" className="flex flex-col gap-1.5">
        {rows.slice(0, attempts).map((row, r) => (
          <div key={r} role="row" className="flex gap-1.5">
            {target.map((_, c) => {
              const ipa = row.phonemes[c];
              const state = row.result?.[c];
              return (
                <div
                  key={c}
                  role="gridcell"
                  title={ipa && showHints ? hintFor(ipa) : undefined}
                  className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 text-lg font-bold ${
                    state
                      ? CELL_STATE_CLASSES[state]
                      : ipa
                        ? "border-muted bg-surface"
                        : "border-border bg-surface"
                  }`}
                >
                  {ipa ? `/${ipa}/` : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p role="status" aria-live="polite" className="min-h-6 text-sm font-semibold">
        {message}
      </p>

      {status !== "playing" && (
        <div className="w-full rounded-xl border border-border bg-accent-soft p-4 text-center">
          <p className="font-semibold">
            {status === "won" ? "Solved! The phoneme word was:" : "The phoneme word was:"}
          </p>
          <p className="my-1 text-2xl font-bold">
            {ipaWord(word.phonemes)} = &ldquo;{word.english}&rdquo;
          </p>
          <ul className="mt-2 inline-block text-left text-sm text-muted">
            {word.phonemes.map((ipa, i) => (
              <li key={i}>{hintFor(ipa)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={backspace}
          disabled={status !== "playing"}
          className="pressable rounded-full border border-border bg-surface px-5 py-2 text-sm font-semibold hover:border-accent hover:bg-highlight disabled:opacity-40"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={status !== "playing"}
          className="pressable rounded-full bg-accent px-5 py-2 text-sm font-bold text-surface hover:bg-accent-strong disabled:opacity-40"
        >
          Check
        </button>
      </div>

      <PhonemeKeyboard
        onPress={press}
        keyStates={keyStates}
        disabled={status !== "playing"}
      />
    </div>
  );
}
