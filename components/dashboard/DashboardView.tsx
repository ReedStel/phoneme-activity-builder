"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { PageIntro } from "@/components/ui/PageIntro";
import { btn } from "@/components/ui/buttons";
import type { DashboardSummary } from "@/lib/metrics";
import { DailyChart } from "./DailyChart";
import {
  AlertList,
  MiniTable,
  StatCard,
  formatNumber,
  formatSeconds,
  formatTime,
  formatUptime,
} from "./parts";

const WINDOWS = [7, 14, 30];

/**
 * The reporting and monitoring view. The first render comes from the server
 * so the page is useful with JavaScript still loading; after that it can be
 * refreshed by hand or every 15 seconds from GET /api/metrics/summary.
 */
export function DashboardView({ initial }: { initial: DashboardSummary }) {
  const [summary, setSummary] = useState(initial);
  const [days, setDays] = useState(initial.windowDays);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextDays: number) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/metrics/summary?days=${nextDays}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`The server answered ${res.status}`);
      setSummary((await res.json()) as DashboardSummary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh the dashboard.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => void load(days), 15000);
    return () => clearInterval(id);
  }, [live, days, load]);

  function changeWindow(next: number) {
    setDays(next);
    void load(next);
  }

  const healthy = summary.health.status === "ok";
  const { totals, generation, engagement, traffic } = summary;
  const wordle = totals.byType.find((t) => t.type === "WORDLE")?.count ?? 0;
  const wordSearch = totals.byType.find((t) => t.type === "WORDSEARCH")?.count ?? 0;

  return (
    <>
      <PageIntro title="Dashboard">
        How the builder is being used and whether it is healthy. Everything here is read from the
        database: stored word lists and activities, every generation attempt, every API call, and how
        long each page stays open.
      </PageIntro>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
            healthy ? "bg-accent-soft text-accent" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${healthy ? "bg-tile-correct" : "bg-red-600"}`}
          />
          {healthy ? "Healthy" : "Database down"}
        </span>
        <span className="text-sm text-muted">
          Database replied in {summary.health.databaseMs} ms, up {formatUptime(summary.health.uptimeSeconds)}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Last {days} days</span>
          <div className="flex gap-1" role="group" aria-label="Reporting window">
            {WINDOWS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => changeWindow(w)}
                aria-pressed={w === days}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  w === days ? "bg-accent-soft text-accent" : "text-muted hover:bg-highlight"
                }`}
              >
                {w}d
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={live}
              onChange={(e) => setLive(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Auto refresh
          </label>
          <button type="button" onClick={() => void load(days)} disabled={busy} className={btn.secondarySm}>
            {busy ? "Refreshing…" : "Refresh"}
          </button>
          <a href={`/api/metrics/report?days=${days}`} className={btn.secondarySm}>
            Download CSV
          </a>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-600/40 bg-red-50 px-3 py-2 text-sm text-red-900 dark:bg-red-950/50 dark:text-red-100">
          {error}
        </p>
      ) : null}

      <AlertList alerts={summary.alerts} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Wordle activities" value={formatNumber(wordle)} hint="saved in the database" />
        <StatCard
          label="Word Search activities"
          value={formatNumber(wordSearch)}
          hint="saved in the database"
        />
        <StatCard
          label="Files generated"
          value={formatNumber(generation.success)}
          tone="good"
          hint={generation.successRate === null ? "no attempts yet" : `${generation.successRate}% of attempts`}
        />
        <StatCard
          label="Failed generations"
          value={formatNumber(generation.failure)}
          tone={generation.failure > 0 ? "bad" : "normal"}
          hint={generation.failure > 0 ? "see the failure table below" : "none in this window"}
        />
        <StatCard
          label="Average time on page"
          value={formatSeconds(engagement.averageDwellSeconds)}
          hint={`${formatNumber(engagement.views)} page views`}
        />
        <StatCard
          label="Most used activity"
          value={generation.mostUsedType ? generation.mostUsedType.label : "no data"}
          hint={
            generation.mostUsedType
              ? `${formatNumber(generation.mostUsedType.count)} files generated`
              : "nothing generated yet"
          }
        />
        <StatCard
          label="API requests"
          value={formatNumber(traffic.requests)}
          hint={
            traffic.errorRate === null
              ? "no traffic recorded"
              : `${traffic.errorRate}% returned an error, ${traffic.averageMs ?? 0} ms average`
          }
        />
        <StatCard
          label="Stored data"
          value={`${formatNumber(totals.wordLists)} lists`}
          hint={`${formatNumber(totals.words)} words, ${formatNumber(totals.activities)} activities`}
        />
      </div>

      <Card title={`Activity over the last ${summary.windowDays} days`}>
        <p className="mb-3 text-sm text-muted">
          {formatNumber(totals.activitiesCreated)} activities created, {formatNumber(totals.activitiesUpdated)}{" "}
          updated and {formatNumber(totals.activitiesDeleted)} deleted in this window.
        </p>
        <DailyChart series={summary.series} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Time on page">
          <MiniTable
            caption="Page views and average time on page"
            columns={["Page", "Views", "Average"]}
            rows={engagement.byPath.map((p) => [p.path, formatNumber(p.views), formatSeconds(p.averageDwellSeconds)])}
            empty="No page views recorded yet. Open a few pages and they will appear here."
          />
        </Card>

        <Card title="Slowest endpoints">
          <MiniTable
            caption="Average server time per endpoint"
            columns={["Endpoint", "Average", "Calls"]}
            rows={traffic.slowest.map((s) => [s.path, `${s.averageMs} ms`, formatNumber(s.requests)])}
            empty="No API calls recorded yet."
          />
        </Card>

        <Card title="Recent generation failures">
          <MiniTable
            caption="The most recent failed generation attempts and why they failed"
            columns={["When", "Type", "Reason"]}
            rows={generation.recentFailures.map((f) => [
              formatTime(f.createdAt),
              f.activityType,
              f.reason ?? "Unknown",
            ])}
            empty="No failures recorded. Every generation attempt has worked."
          />
        </Card>

        <Card title="Recent changes">
          <MiniTable
            caption="The most recent create, update and delete actions"
            columns={["When", "Change", "Detail"]}
            rows={summary.recentEvents.map((e) => [
              formatTime(e.createdAt),
              `${e.entity} ${e.action}`,
              e.detail ?? "",
            ])}
            empty="Nothing has been changed yet."
          />
        </Card>
      </div>

      <p className="text-xs text-muted">
        Updated {formatTime(summary.generatedAt)}. Page timings come from the browser when a page is
        closed or left; everything else is recorded on the server as it happens.
      </p>
    </>
  );
}
