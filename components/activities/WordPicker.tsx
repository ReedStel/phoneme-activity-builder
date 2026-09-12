"use client";

import Link from "next/link";
import { btn, field } from "@/components/ui/buttons";
import { WORD_LIMITS } from "@/lib/constants";
import { plural } from "@/lib/format";
import { ipaWord } from "@/lib/phonemes";
import { isEligible, randomWordIds, type ActivityBuilder } from "./useActivityBuilder";

/**
 * Choose a stored word list, then pick which of its words the activity
 * uses. The order you tick them is the order students play them.
 */
export function WordPicker({ builder: b }: { builder: ActivityBuilder }) {
  const { type, draft, lists, listWords } = b;
  const { min, max } = WORD_LIMITS[type];
  const selected = new Set(draft.wordIds);
  const atMax = draft.wordIds.length >= max;
  const byId = new Map((listWords ?? []).map((w) => [w.id, w]));
  const order = draft.wordIds
    .map((id) => byId.get(id)?.english)
    .filter(Boolean)
    .join(" → ");
  const randomCount = type === "WORDLE" ? 3 : 6;
  const idPrefix = type.toLowerCase();

  function toggle(id: number) {
    if (selected.has(id)) b.update({ wordIds: draft.wordIds.filter((x) => x !== id) });
    else if (!atMax) b.update({ wordIds: [...draft.wordIds, id] });
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${idPrefix}-list`} className="block text-sm font-medium">
          Word list
        </label>
        <div className="flex flex-wrap items-center gap-x-3">
          <select
            id={`${idPrefix}-list`}
            value={draft.wordListId ?? ""}
            onChange={(e) => b.chooseList(Number(e.target.value))}
            className={`${field} min-w-0 flex-1`}
          >
            {draft.wordListId === null && <option value="">Choose a list…</option>}
            {lists?.map((l) => (
              <option key={l.id} value={l.id} disabled={l.wordCount === 0}>
                {l.name} ({plural(l.wordCount, "word")})
              </option>
            ))}
          </select>
          <Link
            href={draft.wordListId ? `/word-lists?list=${draft.wordListId}` : "/word-lists"}
            className="mt-1 text-sm font-semibold text-accent hover:underline"
          >
            Add or edit words
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={`${idPrefix}-words-label`} className="text-sm font-medium">
          Words{" "}
          <span className="font-normal text-muted">
            ({draft.wordIds.length} chosen, {min} to {max} allowed)
          </span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!listWords?.length}
            onClick={() =>
              listWords && b.update({ wordIds: randomWordIds(type, listWords, draft.gridSize, randomCount) })
            }
            className={btn.secondarySm}
          >
            Pick {randomCount} at random
          </button>
          <button
            type="button"
            disabled={draft.wordIds.length === 0}
            onClick={() => b.update({ wordIds: [] })}
            className={btn.secondarySm}
          >
            Clear
          </button>
        </div>
      </div>

      {listWords === null ? (
        <p className="text-sm text-muted">Loading words…</p>
      ) : listWords.length === 0 ? (
        <p className="text-sm text-muted">
          This list has no words yet.{" "}
          <Link href={`/word-lists?list=${draft.wordListId}`} className="font-semibold text-accent hover:underline">
            Add some
          </Link>
          .
        </p>
      ) : (
        <ul
          aria-labelledby={`${idPrefix}-words-label`}
          className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-2"
        >
          {listWords.map((w) => {
            const checked = selected.has(w.id);
            const eligible = isEligible(type, w, draft.gridSize);
            const disabled = !checked && (atMax || !eligible);
            const position = checked ? draft.wordIds.indexOf(w.id) + 1 : null;
            return (
              <li key={w.id}>
                <label
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                    checked ? "bg-accent-soft" : "hover:bg-highlight"
                  } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(w.id)}
                    className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                  />
                  <span className="font-semibold">{w.english}</span>
                  <span className="font-mono text-xs text-muted">{ipaWord(w.phonemes)}</span>
                  {!eligible ? (
                    <span className="ml-auto text-xs text-muted">{type === "WORDLE" ? "too short" : "too long for grid"}</span>
                  ) : (
                    position && (
                      <span className="ml-auto rounded-full bg-accent px-1.5 text-xs font-bold text-surface">
                        <span className="sr-only">order </span>
                        {position}
                      </span>
                    )
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {order && (
        <p className="text-xs text-muted">
          {type === "WORDLE" ? "Play order" : "Hidden words"}: {order}
        </p>
      )}
    </div>
  );
}
