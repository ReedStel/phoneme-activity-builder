/**
 * Assessment 3: instrumentation and reporting.
 *
 * Writes are fire and forget: recording a metric must never break or slow
 * down a request, so failures are logged and swallowed. Reads are aggregated
 * in one place and used by both the dashboard page and
 * GET /api/metrics/summary.
 *
 * Set METRICS_DISABLED=1 to turn recording off (used when load testing, so
 * the extra writes are not what gets measured).
 */

import { prisma } from "./db";
import { TYPE_LABEL, type ActivityType } from "./constants";

const OFF = process.env.METRICS_DISABLED === "1";

/** Run a write in the background; never let a metric break a request. */
function background(run: () => Promise<unknown>) {
  if (OFF) return;
  void run().catch((err) => console.error("metrics write failed:", err));
}

export function recordRequest(entry: {
  method: string;
  path: string;
  status: number;
  durationMs: number;
}) {
  // The dashboard polling itself would otherwise dominate the traffic panel.
  if (entry.path.startsWith("/api/metrics")) return;
  background(() => prisma.requestLog.create({ data: entry }));
}

export function recordGeneration(entry: {
  activityId: number | null;
  activityType: string;
  status: "success" | "failure";
  reason?: string;
  wordCount?: number;
  durationMs?: number;
}) {
  background(() =>
    prisma.generationEvent.create({
      data: {
        activityId: entry.activityId,
        activityType: entry.activityType,
        status: entry.status,
        reason: entry.reason ?? null,
        wordCount: entry.wordCount ?? 0,
        durationMs: entry.durationMs ?? 0,
      },
    })
  );
}

export function recordActivityEvent(entry: {
  entity: "activity" | "wordList" | "word";
  entityId?: number | null;
  action: "created" | "updated" | "deleted";
  detail?: string;
}) {
  background(() =>
    prisma.activityEvent.create({
      data: {
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        action: entry.action,
        detail: entry.detail ?? null,
      },
    })
  );
}

/** Page views are awaited: the browser beacon route has nothing else to do. */
export async function recordPageView(entry: { path: string; sessionId: string; dwellMs: number }) {
  if (OFF) return;
  await prisma.pageView.create({ data: entry });
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export type DaySeries = {
  date: string;
  label: string;
  created: number;
  success: number;
  failure: number;
};

export type DashboardSummary = {
  windowDays: number;
  generatedAt: string;
  health: { status: "ok" | "down"; databaseMs: number; uptimeSeconds: number };
  totals: {
    wordLists: number;
    words: number;
    activities: number;
    byType: { type: ActivityType; label: string; count: number }[];
    activitiesCreated: number;
    activitiesUpdated: number;
    activitiesDeleted: number;
  };
  generation: {
    total: number;
    success: number;
    failure: number;
    successRate: number | null;
    averageMs: number | null;
    mostUsedType: { type: ActivityType; label: string; count: number } | null;
    recentFailures: { id: number; activityType: string; reason: string | null; createdAt: string }[];
  };
  engagement: {
    views: number;
    averageDwellSeconds: number | null;
    byPath: { path: string; views: number; averageDwellSeconds: number | null }[];
  };
  traffic: {
    requests: number;
    errors: number;
    errorRate: number | null;
    averageMs: number | null;
    slowest: { path: string; averageMs: number; requests: number }[];
  };
  series: DaySeries[];
  alerts: { level: "warning" | "error" | "info"; message: string }[];
  recentEvents: { id: number; entity: string; action: string; detail: string | null; createdAt: string }[];
};

function dayKey(d: Date) {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function emptySeries(days: number): DaySeries[] {
  const out: DaySeries[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    out.push({
      date: dayKey(d),
      label: d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
      created: 0,
      success: 0,
      failure: 0,
    });
  }
  return out;
}

const round = (n: number | null | undefined, places = 1) =>
  n === null || n === undefined ? null : Math.round(n * 10 ** places) / 10 ** places;

/**
 * How long a computed summary is reused.
 *
 * The Assessment 3 load test showed the dashboard failing first at 10,000
 * users: 9,164 of the 9,219 errors, because every render ran about twenty
 * aggregate queries. Reusing one result for a few seconds, and letting
 * requests that arrive together share a single in-flight computation, removes
 * that bottleneck while the figures stay effectively live.
 */
const SUMMARY_CACHE_MS = Number(process.env.DASHBOARD_CACHE_MS ?? 5000);
const summaryCache = new Map<number, { at: number; value: Promise<DashboardSummary> }>();

/** Everything the dashboard shows. Pass fresh to skip the short cache. */
export function getDashboardSummary(
  windowDays = 14,
  options: { fresh?: boolean } = {}
): Promise<DashboardSummary> {
  const hit = summaryCache.get(windowDays);
  if (!options.fresh && hit && Date.now() - hit.at < SUMMARY_CACHE_MS) return hit.value;

  const value = buildDashboardSummary(windowDays);
  summaryCache.set(windowDays, { at: Date.now(), value });
  value.catch(() => summaryCache.delete(windowDays)); // never keep a failure
  return value;
}

/** One round of queries for everything the dashboard shows. */
async function buildDashboardSummary(windowDays: number): Promise<DashboardSummary> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const startedAt = Date.now();

  let databaseUp = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseUp = false;
  }
  const databaseMs = Date.now() - startedAt;

  const [
    wordLists,
    words,
    activities,
    activitiesByType,
    activityActions,
    generationByStatus,
    generationSuccessByType,
    generationAgg,
    recentFailures,
    pageAgg,
    pageByPath,
    requests,
    errors,
    requestAgg,
    slowest,
    emptyLists,
    activitiesWithoutWords,
    failures24h,
    recentEvents,
    generationRows,
    createdRows,
  ] = await Promise.all([
    prisma.wordList.count(),
    prisma.word.count(),
    prisma.activityConfig.count(),
    prisma.activityConfig.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.activityEvent.groupBy({
      by: ["action"],
      where: { entity: "activity", createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.generationEvent.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.generationEvent.groupBy({
      by: ["activityType"],
      where: { status: "success", createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.generationEvent.aggregate({
      where: { status: "success", createdAt: { gte: since } },
      _avg: { durationMs: true },
    }),
    prisma.generationEvent.findMany({
      where: { status: "failure" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, activityType: true, reason: true, createdAt: true },
    }),
    prisma.pageView.aggregate({
      where: { createdAt: { gte: since }, dwellMs: { gt: 0 } },
      _avg: { dwellMs: true },
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _avg: { dwellMs: true },
      orderBy: { _count: { path: "desc" } },
      take: 6,
    }),
    prisma.requestLog.count({ where: { createdAt: { gte: since } } }),
    prisma.requestLog.count({ where: { createdAt: { gte: since }, status: { gte: 400 } } }),
    prisma.requestLog.aggregate({ where: { createdAt: { gte: since } }, _avg: { durationMs: true } }),
    prisma.requestLog.groupBy({
      by: ["path"],
      where: { createdAt: { gte: since } },
      _avg: { durationMs: true },
      _count: { _all: true },
      orderBy: { _avg: { durationMs: "desc" } },
      take: 5,
    }),
    prisma.wordList.findMany({
      where: { words: { none: {} } },
      select: { id: true, name: true },
      take: 5,
    }),
    prisma.activityConfig.findMany({
      where: { words: { none: {} } },
      select: { id: true, title: true },
      take: 5,
    }),
    prisma.generationEvent.count({ where: { status: "failure", createdAt: { gte: since24h } } }),
    prisma.activityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, entity: true, action: true, detail: true, createdAt: true },
    }),
    prisma.generationEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    prisma.activityEvent.findMany({
      where: { entity: "activity", action: "created", createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
  ]);

  const actionCount = (action: string) =>
    activityActions.find((r) => r.action === action)?._count._all ?? 0;

  const byType = (["WORDLE", "WORDSEARCH"] as ActivityType[]).map((type) => ({
    type,
    label: TYPE_LABEL[type],
    count: activitiesByType.find((r) => r.type === type)?._count._all ?? 0,
  }));

  const success = generationByStatus.find((r) => r.status === "success")?._count._all ?? 0;
  const failure = generationByStatus.find((r) => r.status === "failure")?._count._all ?? 0;
  const total = success + failure;

  const mostUsed = generationSuccessByType
    .map((r) => ({
      type: r.activityType as ActivityType,
      label: TYPE_LABEL[r.activityType as ActivityType] ?? r.activityType,
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count)[0];

  const series = emptySeries(windowDays);
  const index = new Map(series.map((d) => [d.date, d]));
  for (const row of generationRows) {
    const day = index.get(dayKey(new Date(row.createdAt)));
    if (day) day[row.status === "success" ? "success" : "failure"] += 1;
  }
  for (const row of createdRows) {
    const day = index.get(dayKey(new Date(row.createdAt)));
    if (day) day.created += 1;
  }

  const alerts: DashboardSummary["alerts"] = [];
  if (!databaseUp) {
    alerts.push({ level: "error", message: "The database did not answer its health query." });
  }
  if (failures24h > 0) {
    const attempts = failures24h === 1 ? "attempt" : "attempts";
    alerts.push({
      level: "error",
      message: `${failures24h} generation ${attempts} failed in the last 24 hours.`,
    });
  }
  for (const list of emptyLists) {
    alerts.push({
      level: "warning",
      message: `Word list "${list.name}" has no words yet, so no activity can use it.`,
    });
  }
  for (const activity of activitiesWithoutWords) {
    alerts.push({
      level: "warning",
      message: `Activity "${activity.title}" has no words left and will fail to generate.`,
    });
  }
  if (!alerts.length) {
    alerts.push({ level: "info", message: "No problems detected. Everything is healthy." });
  }

  return {
    windowDays,
    generatedAt: new Date().toISOString(),
    health: {
      status: databaseUp ? "ok" : "down",
      databaseMs,
      uptimeSeconds: Math.round(process.uptime()),
    },
    totals: {
      wordLists,
      words,
      activities,
      byType,
      activitiesCreated: actionCount("created"),
      activitiesUpdated: actionCount("updated"),
      activitiesDeleted: actionCount("deleted"),
    },
    generation: {
      total,
      success,
      failure,
      successRate: total ? round((success / total) * 100) : null,
      averageMs: round(generationAgg._avg.durationMs, 0),
      mostUsedType: mostUsed ?? null,
      recentFailures: recentFailures.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
    },
    engagement: {
      views: pageAgg._count._all,
      averageDwellSeconds: round((pageAgg._avg.dwellMs ?? 0) / 1000),
      byPath: pageByPath.map((p) => ({
        path: p.path,
        views: p._count._all,
        averageDwellSeconds: round((p._avg.dwellMs ?? 0) / 1000),
      })),
    },
    traffic: {
      requests,
      errors,
      errorRate: requests ? round((errors / requests) * 100) : null,
      averageMs: round(requestAgg._avg.durationMs, 0),
      slowest: slowest.map((s) => ({
        path: s.path,
        averageMs: Math.round(s._avg.durationMs ?? 0),
        requests: s._count._all,
      })),
    },
    series,
    alerts,
    recentEvents: recentEvents.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
  };
}
