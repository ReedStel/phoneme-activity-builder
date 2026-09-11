"use client";

import { useMemo, useState, type FormEvent } from "react";
import { btn, field } from "@/components/ui/buttons";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { toProblem, type NewWord, type Problem } from "@/lib/client-api";
import { plural } from "@/lib/format";
import { describeUnknownPhoneme, isHcePhoneme, parseWordLines } from "@/lib/phoneme-normalize";

/**
 * Paste many words at once, one per line. Lines are parsed in the browser so
 * the teacher sees problems immediately; the server then validates every
 * phoneme again and stores the batch all-or-nothing.
 */
export function BulkImport({ onImport }: { onImport: (words: NewWord[]) => Promise<void> }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  const parsed = useMemo(() => parseWordLines(text), [text]);
  const warnings = useMemo(
    () =>
      parsed.words.flatMap((w) =>
        [...new Set(w.phonemes.filter((p) => !isHcePhoneme(p)))].map(
          (p) => `“${w.english}”: ${describeUnknownPhoneme(p)}`
        )
      ),
    [parsed]
  );

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (parsed.problems.length) {
      setProblem({ message: "Some lines could not be read", details: parsed.problems.map((p) => p.message) });
      return;
    }
    if (parsed.words.length === 0) {
      setProblem({ message: "Paste at least one word, one per line." });
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      await onImport(parsed.words);
      setText("");
    } catch (err) {
      setProblem(toProblem(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Bulk import">
      <p className="text-sm text-muted">
        Paste one word per line: the English spelling, then its phonemes. Separate the phonemes with spaces, or
        paste them joined up and they are split automatically. Rows copied from a spreadsheet work too.
      </p>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-highlight px-3 py-2 font-mono text-xs leading-relaxed">
        {"chin: tʃ ɪ n\nboat = b əʉ t\nfrog f ɹ ɔ g"}
      </pre>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <label htmlFor="bulk-words" className="sr-only">
          Words to import, one per line
        </label>
        <textarea
          id="bulk-words"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          spellCheck={false}
          placeholder="chin: tʃ ɪ n"
          className={`${field} font-mono`}
        />

        {text.trim() && (
          <div className="space-y-2 text-xs">
            <p className="text-muted">
              {plural(parsed.words.length, "word")} ready
              {parsed.problems.length > 0 && `, ${plural(parsed.problems.length, "line")} to fix`}.
            </p>
            {parsed.words.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Words that will be imported">
                {parsed.words.slice(0, 12).map((w, i) => (
                  <li key={i} className="rounded-full border border-border px-2 py-0.5">
                    <span className="font-semibold">{w.english}</span>{" "}
                    <span className="font-mono">
                      /
                      {w.phonemes.map((p, j) => (
                        <span key={j} className={isHcePhoneme(p) ? "" : "rounded bg-red-100 px-0.5 text-red-800 dark:bg-red-900/60 dark:text-red-200"}>
                          {p}
                        </span>
                      ))}
                      /
                    </span>
                  </li>
                ))}
                {parsed.words.length > 12 && <li className="px-1 text-muted">and {parsed.words.length - 12} more</li>}
              </ul>
            )}
            {warnings.length > 0 && (
              <div className="rounded-lg border border-tile-present/50 bg-highlight p-2">
                <p className="font-semibold">These symbols are not HCE phonemes, so the server will reject them:</p>
                <ul className="mt-1 list-disc pl-5">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <ErrorAlert problem={problem} onDismiss={() => setProblem(null)} />
        <button type="submit" disabled={busy} className={btn.primary}>
          {busy ? "Importing…" : parsed.words.length > 1 ? `Import ${parsed.words.length} words` : "Import"}
        </button>
      </form>
    </Card>
  );
}
