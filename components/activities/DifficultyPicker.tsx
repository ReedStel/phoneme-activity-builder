"use client";

import { DIFFICULTIES, DIFFICULTY_SUMMARY, type ActivityType, type Difficulty } from "@/lib/constants";

/** Easy, medium or hard. Choosing one applies that level's settings. */
export function DifficultyPicker({
  type,
  value,
  onChange,
}: {
  type: ActivityType;
  value: Difficulty;
  onChange: (level: Difficulty) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Difficulty level" className="grid gap-2 sm:grid-cols-3">
      {DIFFICULTIES.map((level) => (
        <button
          key={level}
          type="button"
          role="radio"
          aria-checked={value === level}
          onClick={() => onChange(level)}
          className={`rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
            value === level ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-accent"
          }`}
        >
          <span className="block font-semibold capitalize">{level}</span>
          <span className="block text-xs text-muted">{DIFFICULTY_SUMMARY[type][level]}</span>
        </button>
      ))}
    </div>
  );
}
