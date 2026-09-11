"use client";

import { useState } from "react";
import { btn } from "@/components/ui/buttons";
import { Card } from "@/components/ui/Card";
import type { WordListSummary } from "@/lib/client-api";
import { plural } from "@/lib/format";
import { ListDetailsForm, type ListFormValues } from "./ListDetailsForm";

/** Every saved word list, plus the form for creating a new one. */
export function ListSidebar({
  lists,
  selectedId,
  onSelect,
  onCreate,
}: {
  lists: WordListSummary[] | null;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreate: (values: ListFormValues) => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);

  return (
    <Card title="Your word lists" className="min-w-0 lg:sticky lg:top-4">
      {lists === null ? (
        <p className="text-sm text-muted">Loading lists…</p>
      ) : (
        <ul className="-mx-1 flex flex-col gap-1" aria-label="Word lists">
          {lists.map((l) => {
            const active = l.id === selectedId;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => onSelect(l.id)}
                  aria-current={active ? "true" : undefined}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                    active ? "border-accent bg-accent-soft" : "border-transparent hover:border-border hover:bg-highlight"
                  }`}
                >
                  <span className="block text-sm font-semibold leading-snug">{l.name}</span>
                  <span className="block text-xs text-muted">
                    {plural(l.wordCount, "word")} · {plural(l.activityCount, "activity", "activities")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 border-t border-border pt-3">
        {creating ? (
          <ListDetailsForm
            idPrefix="new-list"
            submitLabel="Create list"
            onSubmit={async (values) => {
              await onCreate(values);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        ) : (
          <button type="button" onClick={() => setCreating(true)} className={btn.secondary}>
            + New list
          </button>
        )}
      </div>
    </Card>
  );
}
