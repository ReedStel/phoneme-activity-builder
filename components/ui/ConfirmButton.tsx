"use client";

import { useEffect, useRef, useState } from "react";
import { btn } from "./buttons";

/**
 * A delete button that asks "are you sure?" inline instead of in a browser
 * pop-up, so destructive actions always take two deliberate clicks.
 */
export function ConfirmButton({
  label,
  prompt,
  confirmLabel = "Yes, delete",
  onConfirm,
}: {
  label: string;
  prompt: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Move keyboard focus to the confirm button when the question appears.
  useEffect(() => {
    if (asking) confirmRef.current?.focus();
  }, [asking]);

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={btn.dangerSm}>
        {label}
      </button>
    );
  }

  return (
    <span role="group" aria-label={prompt} className="inline-flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold">{prompt}</span>
      <button
        ref={confirmRef}
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onConfirm();
          } finally {
            setBusy(false);
            setAsking(false);
          }
        }}
        className={btn.dangerSolidSm}
      >
        {busy ? "Deleting…" : confirmLabel}
      </button>
      <button type="button" onClick={() => setAsking(false)} className={btn.secondarySm}>
        Cancel
      </button>
    </span>
  );
}
