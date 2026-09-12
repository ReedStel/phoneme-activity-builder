"use client";

import { btn } from "@/components/ui/buttons";
import { Card } from "@/components/ui/Card";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { TYPE_LABEL } from "@/lib/constants";
import { plural } from "@/lib/format";
import type { ActivityBuilder } from "./useActivityBuilder";

/** Saved activities of one type, read from the database, with load and delete. */
export function SavedActivities({ builder: b }: { builder: ActivityBuilder }) {
  const label = TYPE_LABEL[b.type];

  return (
    <Card title={`Saved ${label} activities`}>
      {b.activities === null ? (
        <p className="text-sm text-muted">Loading saved activities…</p>
      ) : b.activities.length === 0 ? (
        <p className="text-sm text-muted">Nothing saved yet. Set one up below and press Save.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {b.activities.map((a) => {
            const active = a.id === b.activeId;
            return (
              <li
                key={a.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                  active ? "border-accent bg-accent-soft" : "border-border"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {a.title}
                    {active && (
                      <span className="ml-2 rounded-full bg-accent px-2 py-0.5 align-middle text-[0.65rem] font-bold uppercase tracking-wide text-surface">
                        Editing
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    <span className="capitalize">{a.difficulty}</span> · {plural(a.words.length, "word")} ·{" "}
                    {a.wordListName} · #{a.id}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!active && (
                    <button type="button" onClick={() => b.load(a)} className={btn.secondarySm}>
                      Load
                    </button>
                  )}
                  <a
                    href={`/api/activities/${a.id}/generate?inline=1`}
                    target="_blank"
                    rel="noreferrer"
                    title="Open the file the server builds from this saved activity"
                    className={btn.secondarySm}
                  >
                    Open file
                  </a>
                  <ConfirmButton label="Delete" prompt="Delete this activity?" onConfirm={() => b.remove(a)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" onClick={b.startNew} className={`${btn.secondarySm} mt-3`}>
        + New {label}
      </button>
    </Card>
  );
}
