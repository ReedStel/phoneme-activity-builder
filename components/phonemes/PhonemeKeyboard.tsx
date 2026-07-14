"use client";

import { KEYBOARD_ROWS, PHONEME_MAP } from "@/lib/phonemes";
import type { CellState } from "@/lib/wordle";
import { PhonemeKey } from "./PhonemeKey";

/**
 * The on-screen phoneme keyboard, laid out in the rows specified by the
 * course corpus ("Keyboard for wɜːdəl"): consonant rows first, then vowels.
 * Used both when the teacher composes a custom word and when playing the
 * Wordle preview (where keys are coloured by guess feedback).
 */
export function PhonemeKeyboard({
  onPress,
  keyStates = {},
  disabled = false,
}: {
  onPress: (ipa: string) => void;
  keyStates?: Record<string, CellState>;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5" aria-label="Phoneme keyboard">
      {KEYBOARD_ROWS.map((row, i) => (
        <div key={i} className="flex flex-wrap gap-1.5">
          {row.map((ipa) => {
            const phoneme = PHONEME_MAP.get(ipa);
            if (!phoneme) return null;
            return (
              <PhonemeKey
                key={ipa}
                phoneme={phoneme}
                onPress={onPress}
                state={keyStates[ipa]}
                disabled={disabled}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
