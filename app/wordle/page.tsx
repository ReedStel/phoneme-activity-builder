"use client";

import { useMemo, useState } from "react";
import { PhonemeKeyboard } from "@/components/phonemes/PhonemeKeyboard";
import { PhonemeWordChips } from "@/components/phonemes/PhonemeWordChips";
import { Card } from "@/components/ui/Card";
import { GenerateButton } from "@/components/ui/GenerateButton";
import { WordlePreview } from "@/components/wordle/WordlePreview";
import { buildWordleHtml, wordleFilename } from "@/lib/generate/wordle-html";
import { downloadHtml } from "@/lib/generate/shared";
import { ipaWord } from "@/lib/phonemes";
import { ALL_WORDS, WORDLE_GROUPS, type PhonemeWord } from "@/lib/words";

const MAX_CUSTOM_LENGTH = 6;

export default function WordlePage() {
  const [title, setTitle] = useState("Phoneme'le");
  const [presetEnglish, setPresetEnglish] = useState("thin");
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [customPhonemes, setCustomPhonemes] = useState<string[]>([]);
  const [customEnglish, setCustomEnglish] = useState("");
  const [attempts, setAttempts] = useState(5);
  const [showHints, setShowHints] = useState(true);

  const customWord: PhonemeWord | null =
    customPhonemes.length >= 2 && customEnglish.trim()
      ? { english: customEnglish.trim().toLowerCase(), phonemes: customPhonemes }
      : null;

  const presetWord =
    ALL_WORDS.find((w) => w.english === presetEnglish) ?? ALL_WORDS[0];
  const word: PhonemeWord =
    mode === "custom" && customWord ? customWord : presetWord;

  // Key forces the preview game to restart when the configuration changes.
  const previewKey = useMemo(
    () => `${word.english}-${word.phonemes.join(".")}-${attempts}`,
    [word, attempts]
  );

  const generate = () => {
    const config = { title, word, attempts, showHints };
    downloadHtml(wordleFilename(config), buildWordleHtml(config));
    return wordleFilename(config);
  };

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Wordle Builder</h2>
        <p className="mt-1 text-sm text-muted">
          Configure a phoneme-based Wordle, test it in the live preview, then
          generate the standalone HTML activity.
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
            <label className="block text-sm font-medium" htmlFor="wordle-title">
              Activity title
            </label>
            <input
              id="wordle-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent"
            />
          </Card>

          <Card title="2 · Target phoneme word">
            <div
              role="radiogroup"
              aria-label="Word source"
              className="mb-3 flex gap-2"
            >
              {(
                [
                  ["preset", "Choose a preset"],
                  ["custom", "Compose my own"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={mode === value}
                  onClick={() => setMode(value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                    mode === value
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border bg-surface text-muted hover:border-accent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "preset" ? (
              <>
                <label
                  className="block text-sm font-medium"
                  htmlFor="preset-word"
                >
                  Preset word (HCE corpus — length sets the difficulty)
                </label>
                <select
                  id="preset-word"
                  value={presetEnglish}
                  onChange={(e) => setPresetEnglish(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {WORDLE_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.words.map((w) => (
                        <option key={w.english} value={w.english}>
                          {ipaWord(w.phonemes)} — “{w.english}”
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">
                    Tap phonemes to build the word ({customPhonemes.length}/
                    {MAX_CUSTOM_LENGTH})
                  </p>
                  <div className="mt-1 flex min-h-10 flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-2">
                    {customPhonemes.length > 0 ? (
                      <PhonemeWordChips phonemes={customPhonemes} />
                    ) : (
                      <span className="text-sm text-muted">
                        No phonemes yet — use the keyboard below.
                      </span>
                    )}
                    {customPhonemes.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setCustomPhonemes((p) => p.slice(0, -1))
                        }
                        className="ml-auto rounded-md border border-border px-2 py-1 text-xs font-semibold hover:border-accent"
                      >
                        ⌫ Remove last
                      </button>
                    )}
                  </div>
                </div>
                <PhonemeKeyboard
                  onPress={(ipa) =>
                    setCustomPhonemes((p) =>
                      p.length < MAX_CUSTOM_LENGTH ? [...p, ipa] : p
                    )
                  }
                />
                <div>
                  <label
                    className="block text-sm font-medium"
                    htmlFor="custom-english"
                  >
                    English spelling (revealed on a correct answer)
                  </label>
                  <input
                    id="custom-english"
                    type="text"
                    value={customEnglish}
                    onChange={(e) => setCustomEnglish(e.target.value)}
                    placeholder="e.g. thin"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent"
                  />
                </div>
                {!customWord && (
                  <p className="text-xs text-muted">
                    Add at least two phonemes and the English spelling to use a
                    custom word (otherwise the selected preset is used).
                  </p>
                )}
              </div>
            )}
          </Card>

          <Card title="3 · Difficulty settings">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label
                  className="block text-sm font-medium"
                  htmlFor="attempts"
                >
                  Attempts allowed
                </label>
                <select
                  id="attempts"
                  value={attempts}
                  onChange={(e) => setAttempts(Number(e.target.value))}
                  className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {[4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} attempts
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={showHints}
                  onChange={(e) => setShowHints(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Show mouse-over phoneme hints (e.g. /θ/ → TH as in thin)
              </label>
            </div>
          </Card>

          <Card title="4 · Generate">
            <GenerateButton onGenerate={generate} />
          </Card>
        </div>

        <Card title="Live preview" className="min-w-0 lg:sticky lg:top-4">
          <p className="mb-3 text-sm text-muted">
            Target: <PhonemeWordChips phonemes={word.phonemes} /> ={" "}
            <strong>“{word.english}”</strong> · {attempts} attempts
          </p>
          <WordlePreview
            key={previewKey}
            word={word}
            attempts={attempts}
            showHints={showHints}
          />
        </Card>
      </div>
    </>
  );
}
