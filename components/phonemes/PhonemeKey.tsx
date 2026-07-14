"use client";

import { hintFor, type Phoneme } from "@/lib/phonemes";
import type { CellState } from "@/lib/wordle";

const STATE_CLASSES: Record<CellState, string> = {
  correct: "bg-tile-correct border-tile-correct text-white",
  present: "bg-tile-present border-tile-present text-white",
  absent: "bg-tile-absent border-tile-absent text-white",
};

/**
 * A single phoneme button with a mouse-over / focus tooltip showing the
 * phonetic-to-English letter equivalence, e.g. "/θ/ — TH (as in thin)".
 */
export function PhonemeKey({
  phoneme,
  onPress,
  state,
  disabled = false,
}: {
  phoneme: Phoneme;
  onPress: (ipa: string) => void;
  state?: CellState;
  disabled?: boolean;
}) {
  const hint = hintFor(phoneme.ipa);
  const stateClass = state
    ? STATE_CLASSES[state]
    : "bg-surface border-border hover:border-accent hover:bg-highlight";

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={() => onPress(phoneme.ipa)}
        disabled={disabled}
        aria-label={hint}
        title={hint}
        className={`pressable flex min-h-12 min-w-12 flex-col items-center justify-center rounded-lg border-2 px-2 py-1 text-base font-bold leading-tight shadow-[0_2px_0_var(--border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 disabled:shadow-none ${stateClass}`}
      >
        /{phoneme.ipa}/
        <small
          className={`text-[0.65rem] font-medium ${state ? "text-white/80" : "text-muted"}`}
        >
          {phoneme.label}
        </small>
      </button>
      {/* Custom tooltip (in addition to title) so hints are instant and styled */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {hint}
      </span>
    </span>
  );
}
