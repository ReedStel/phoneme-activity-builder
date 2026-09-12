"use client";

import { btn } from "@/components/ui/buttons";
import { MAX_PHONEMES_PER_WORD } from "@/lib/constants";
import { hintFor, ipaWord } from "@/lib/phonemes";
import { PhonemeKeyboard } from "./PhonemeKeyboard";

/**
 * Composes a word's phoneme sequence by tapping the HCE keyboard. Because
 * every symbol comes from the keyboard, a word built here can never contain
 * an unknown phoneme. Click a chip to remove that phoneme.
 */
export function PhonemeBuilder({
  value,
  onChange,
  labelId,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  labelId?: string;
}) {
  const full = value.length >= MAX_PHONEMES_PER_WORD;

  return (
    <div className="space-y-2">
      <div
        aria-labelledby={labelId}
        className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background p-2"
      >
        {value.length === 0 ? (
          <span className="text-sm text-muted">No phonemes yet. Tap the keys below in order.</span>
        ) : (
          value.map((ipa, i) => (
            <button
              key={`${ipa}-${i}`}
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label={`Remove phoneme ${i + 1}, ${hintFor(ipa)}`}
              title={`${hintFor(ipa)}. Click to remove.`}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-accent-soft px-2 py-1 font-mono text-sm font-semibold hover:border-red-400 focus-visible:outline-2 focus-visible:outline-accent"
            >
              /{ipa}/
              <span aria-hidden="true" className="text-xs text-muted">
                ×
              </span>
            </button>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span aria-live="polite">
          {value.length
            ? `${ipaWord(value)} · ${value.length} of ${MAX_PHONEMES_PER_WORD} phonemes`
            : `Up to ${MAX_PHONEMES_PER_WORD} phonemes`}
        </span>
        {value.length > 0 && (
          <span className="flex gap-2">
            <button type="button" onClick={() => onChange(value.slice(0, -1))} className={btn.secondarySm}>
              Undo last
            </button>
            <button type="button" onClick={() => onChange([])} className={btn.secondarySm}>
              Clear
            </button>
          </span>
        )}
      </div>

      <PhonemeKeyboard
        onPress={(ipa) => {
          if (!full) onChange([...value, ipa]);
        }}
        disabled={full}
      />
    </div>
  );
}
