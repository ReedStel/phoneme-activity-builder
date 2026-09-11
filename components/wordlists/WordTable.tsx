"use client";

import { useState } from "react";
import { PhonemeWordChips } from "@/components/phonemes/PhonemeWordChips";
import { btn, field } from "@/components/ui/buttons";
import { Card } from "@/components/ui/Card";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import type { WordDto } from "@/lib/client-api";

/** The words in a list, with edit and delete on every row. */
export function WordTable({
  words,
  editingId,
  onEdit,
  onDelete,
}: {
  words: WordDto[];
  editingId: number | null;
  onEdit: (word: WordDto) => void;
  onDelete: (word: WordDto) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? words.filter((w) => w.english.includes(q) || w.phonemes.join("").includes(q)) : words;

  return (
    <Card title={`Words in this list (${words.length})`}>
      {words.length === 0 ? (
        <p className="text-sm text-muted">
          No words yet. Add one with the phoneme keyboard above, or paste several into Bulk import below.
        </p>
      ) : (
        <>
          {words.length > 8 && (
            <div className="mb-3">
              <label htmlFor="word-filter" className="sr-only">
                Filter words
              </label>
              <input
                id="word-filter"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by spelling or phoneme"
                className={field}
              />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-sm">
              <caption className="sr-only">Words in this list with their phonemes</caption>
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    English
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Phonemes
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((w) => (
                  <tr
                    key={w.id}
                    className={`border-t border-border align-middle ${w.id === editingId ? "bg-accent-soft" : ""}`}
                  >
                    <td className="py-2 pr-3 font-semibold">{w.english}</td>
                    <td className="py-2 pr-3">
                      <PhonemeWordChips phonemes={w.phonemes} />
                    </td>
                    <td className="py-2 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        <button type="button" onClick={() => onEdit(w)} className={btn.secondarySm}>
                          Edit
                        </button>
                        <ConfirmButton label="Delete" prompt={`Delete “${w.english}”?`} onConfirm={() => onDelete(w)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 && <p className="py-3 text-sm text-muted">No words match “{query}”.</p>}
          </div>
        </>
      )}
    </Card>
  );
}
