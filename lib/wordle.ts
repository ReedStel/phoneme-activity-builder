/**
 * Wordle scoring logic, shared by the in-app preview.
 * (The generated HTML embeds an equivalent vanilla-JS implementation because
 * the output file must be dependency-free.)
 */

export type CellState = "correct" | "present" | "absent";

const RANK: Record<CellState, number> = { absent: 0, present: 1, correct: 2 };

/**
 * Standard Wordle two-pass scoring: exact matches first, then remaining
 * phonemes can claim a "present" only while unmatched copies remain in the
 * target, so duplicated phonemes are scored fairly.
 */
export function scoreGuess(guess: string[], target: string[]): CellState[] {
  const result: CellState[] = Array(guess.length).fill("absent");
  const remaining: Record<string, number> = {};

  target.forEach((p, i) => {
    if (guess[i] === p) result[i] = "correct";
    else remaining[p] = (remaining[p] ?? 0) + 1;
  });

  guess.forEach((p, i) => {
    if (result[i] === "correct") return;
    if ((remaining[p] ?? 0) > 0) {
      result[i] = "present";
      remaining[p]!--;
    }
  });

  return result;
}

/** Keep the strongest state seen for a keyboard key. */
export function mergeKeyState(
  previous: CellState | undefined,
  next: CellState
): CellState {
  if (!previous) return next;
  return RANK[next] > RANK[previous] ? next : previous;
}
