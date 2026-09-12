"use client";

import { btn } from "@/components/ui/buttons";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import type { ActivityBuilder } from "./useActivityBuilder";

/** Save state, the Save and Generate buttons, and the result of each action. */
export function SaveGeneratePanel({ builder: b }: { builder: ActivityBuilder }) {
  const status =
    b.activeId === null
      ? { dot: "bg-tile-absent", text: "Not saved yet. Save it to keep it in the database." }
      : b.dirty
        ? { dot: "bg-tile-present", text: `Activity #${b.activeId} has unsaved changes.` }
        : { dot: "bg-tile-correct", text: `Saved as activity #${b.activeId}. Everything is stored in the database.` };
  const locked = b.busy !== null;

  return (
    <Card title="4 · Save and generate">
      <p className="flex items-center gap-2 text-sm">
        <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.dot}`} />
        {status.text}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => b.save(false)} disabled={locked} className={btn.secondary}>
          {b.busy === "saving" ? "Saving…" : b.activeId === null ? "Save activity" : "Save changes"}
        </button>
        {b.activeId !== null && (
          <button type="button" onClick={() => b.save(true)} disabled={locked} className={btn.secondary}>
            Save as new
          </button>
        )}
        <button type="button" onClick={() => b.generate()} disabled={locked} className={btn.primary}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16" />
          </svg>
          {b.busy === "generating" ? "Generating…" : "Generate HTML"}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Generate saves any changes first. The server then builds a single playable .html file from the stored
        activity, so the file always matches what is saved.
      </p>
      <div className="mt-3 space-y-2">
        <ErrorAlert problem={b.problem} onDismiss={b.clearProblem} />
        <p role="status" aria-live="polite" className="text-sm font-semibold text-tile-correct">
          {b.notice}
        </p>
      </div>
    </Card>
  );
}
