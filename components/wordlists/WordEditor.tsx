"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PhonemeBuilder } from "@/components/phonemes/PhonemeBuilder";
import { btn, field } from "@/components/ui/buttons";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { toProblem, type NewWord, type Problem, type WordDto } from "@/lib/client-api";

/**
 * Add a new word, or edit an existing one, using the HCE phoneme keyboard.
 * The parent gives this a new `key` for each word, so switching between
 * words starts with a fresh form.
 */
export function WordEditor({
  editing,
  onSave,
  onCancel,
}: {
  editing: WordDto | null;
  onSave: (word: NewWord) => Promise<void>;
  onCancel: () => void;
}) {
  const [english, setEnglish] = useState(editing?.english ?? "");
  const [phonemes, setPhonemes] = useState<string[]>(editing?.phonemes ?? []);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // When editing starts, bring the form into view and focus the spelling.
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const issues: string[] = [];
    if (!english.trim()) issues.push("Type the English spelling.");
    if (phonemes.length === 0) issues.push("Add at least one phoneme with the keyboard.");
    if (issues.length) {
      setProblem({ message: "This word is not ready yet", details: issues });
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      await onSave({ english: english.trim(), phonemes });
      if (!editing) {
        setEnglish("");
        setPhonemes([]);
      }
    } catch (err) {
      setProblem(toProblem(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="word-editor" className="scroll-mt-4">
      <Card title={editing ? `Edit “${editing.english}”` : "Add a word"}>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="word-english" className="block text-sm font-medium">
              English spelling <span className="font-normal text-muted">(shown to students when they solve it)</span>
            </label>
            <input
              ref={inputRef}
              id="word-english"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              maxLength={30}
              placeholder="e.g. chin"
              className={field}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <p id="word-phonemes-label" className="mb-1 text-sm font-medium">
              Phonemes, in order
            </p>
            <PhonemeBuilder value={phonemes} onChange={setPhonemes} labelId="word-phonemes-label" />
          </div>
          <ErrorAlert problem={problem} onDismiss={() => setProblem(null)} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className={btn.primary}>
              {busy ? "Saving…" : editing ? "Save changes" : "Add word"}
            </button>
            {editing && (
              <button type="button" onClick={onCancel} className={btn.secondary}>
                Cancel editing
              </button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
