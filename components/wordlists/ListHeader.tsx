"use client";

import { useState } from "react";
import { btn } from "@/components/ui/buttons";
import { Card } from "@/components/ui/Card";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import type { WordListDetail } from "@/lib/client-api";
import { plural } from "@/lib/format";
import { ListDetailsForm, type ListFormValues } from "./ListDetailsForm";

/** The selected list's name and description, with rename and delete. */
export function ListHeader({
  list,
  onSave,
  onDelete,
}: {
  list: WordListDetail;
  onSave: (values: ListFormValues) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <Card>
      {editing ? (
        <>
          <h2 className="mb-3 text-lg font-semibold">Edit list details</h2>
          <ListDetailsForm
            idPrefix="edit-list"
            initial={{ name: list.name, description: list.description ?? "" }}
            submitLabel="Save details"
            onSubmit={async (values) => {
              await onSave(values);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Word list #{list.id}</p>
            <h2 className="text-2xl font-bold leading-tight">{list.name}</h2>
            {list.description && <p className="mt-1 max-w-prose text-sm text-muted">{list.description}</p>}
            <p className="mt-1 text-xs text-muted">{plural(list.words.length, "word")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setEditing(true)} className={btn.secondarySm}>
              Rename
            </button>
            <ConfirmButton
              label="Delete list"
              prompt={`Delete this list and its ${plural(list.words.length, "word")}? Activities using it go too.`}
              onConfirm={onDelete}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
