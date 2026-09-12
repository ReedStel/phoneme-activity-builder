"use client";

import { useState, type FormEvent } from "react";
import { btn, field } from "@/components/ui/buttons";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { toProblem, type Problem } from "@/lib/client-api";

export interface ListFormValues {
  name: string;
  description: string;
}

/** Create or rename a word list. Server errors are shown under the fields. */
export function ListDetailsForm({
  idPrefix,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  idPrefix: string;
  initial?: ListFormValues;
  submitLabel: string;
  onSubmit: (values: ListFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setProblem({ message: "Give the list a name first." });
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
    } catch (err) {
      setProblem(toProblem(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor={`${idPrefix}-name`} className="block text-sm font-medium">
          List name
        </label>
        <input
          id={`${idPrefix}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="e.g. Week 3: TH sounds"
          className={field}
          autoComplete="off"
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-description`} className="block text-sm font-medium">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          rows={2}
          className={field}
        />
      </div>
      <ErrorAlert problem={problem} onDismiss={() => setProblem(null)} />
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={btn.primary}>
          {busy ? "Saving…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={btn.secondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
