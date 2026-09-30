import type { ReactNode } from "react";
import type { DashboardSummary } from "@/lib/metrics";

/** Small shared pieces used by the dashboard. */

export function formatNumber(n: number) {
  return n.toLocaleString("en-AU");
}

export function formatSeconds(value: number | null | undefined) {
  if (value === null || value === undefined) return "no data";
  if (value < 60) return `${value < 10 ? value.toFixed(1) : Math.round(value)}s`;
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  return `${minutes}m ${seconds}s`;
}

export function formatUptime(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatCard({
  label,
  value,
  hint,
  tone = "normal",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "normal" | "good" | "bad";
}) {
  const valueClass =
    tone === "good"
      ? "text-accent"
      : tone === "bad"
        ? "text-red-700 dark:text-red-400"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold leading-tight ${valueClass}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

const ALERT_STYLES: Record<DashboardSummary["alerts"][number]["level"], string> = {
  error: "border-red-600/40 bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-100",
  warning: "border-tile-present/50 bg-highlight text-foreground",
  info: "border-border bg-highlight text-muted",
};

const ALERT_WORD: Record<DashboardSummary["alerts"][number]["level"], string> = {
  error: "Problem",
  warning: "Warning",
  info: "All clear",
};

export function AlertList({ alerts }: { alerts: DashboardSummary["alerts"] }) {
  return (
    <ul className="flex flex-col gap-2" aria-label="System alerts">
      {alerts.map((alert, i) => (
        <li
          key={i}
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${ALERT_STYLES[alert.level]}`}
        >
          <span className="font-bold">{ALERT_WORD[alert.level]}:</span>
          <span>{alert.message}</span>
        </li>
      ))}
    </ul>
  );
}

export function MiniTable({
  caption,
  columns,
  rows,
  empty = "Nothing recorded yet.",
}: {
  caption: string;
  columns: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            {columns.map((c, i) => (
              <th key={c} scope="col" className={`py-2 font-semibold ${i ? "text-right" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-border/60 last:border-0">
              {row.map((cell, c) => (
                <td key={c} className={`py-2 ${c ? "text-right tabular-nums" : "font-medium"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
