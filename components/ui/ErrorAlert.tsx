import type { Problem } from "@/lib/client-api";

/**
 * Shows an API or form problem: a headline plus a bullet list of specific
 * issues (for example each unknown phoneme with a "did you mean" hint).
 */
export function ErrorAlert({ problem, onDismiss }: { problem: Problem | null; onDismiss?: () => void }) {
  if (!problem) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">{problem.message}</p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss this message"
            className="rounded-md px-1.5 text-base leading-none hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-700 dark:hover:bg-red-900/50"
          >
            ×
          </button>
        )}
      </div>
      {problem.details && problem.details.length > 0 && (
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
          {problem.details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
