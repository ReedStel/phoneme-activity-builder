/**
 * Simulated input records for the reporting dashboard.
 *
 * Assessment 3 asks the system to report on usage over time, which needs a
 * history to report on. This script writes realistic observability records
 * (page views, generation attempts, create and update actions, API calls)
 * across the last N days. It only touches the metrics tables, never the
 * teacher data: word lists and activities are left exactly as they are.
 *
 *   npx tsx scripts/simulate-usage.ts                 # 14 days of usage
 *   npx tsx scripts/simulate-usage.ts --days 30       # a longer history
 *   npx tsx scripts/simulate-usage.ts --reset         # clear metrics first
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Small seeded generator, so a re-run produces the same shaped history. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260930);
const pick = <T>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
const between = (min: number, max: number) => Math.round(min + rand() * (max - min));

const PAGES = [
  { path: "/", weight: 5, dwell: [8000, 40000] },
  { path: "/word-lists", weight: 8, dwell: [45000, 240000] },
  { path: "/wordle", weight: 7, dwell: [60000, 300000] },
  { path: "/wordsearch", weight: 5, dwell: [50000, 260000] },
  { path: "/dashboard", weight: 3, dwell: [20000, 120000] },
  { path: "/about", weight: 2, dwell: [10000, 60000] },
] as const;

const FAILURE_REASONS = [
  "This activity has no words left. They may have been deleted from the word list, so edit the activity and choose some words.",
  "Could not fit every word on the grid. Increase the grid size, allow diagonals, or choose fewer words.",
  "This activity needs fixing before it can be generated",
] as const;

const API_CALLS = [
  { method: "GET", path: "/api/word-lists", ms: [4, 30] },
  { method: "GET", path: "/api/activities", ms: [5, 35] },
  { method: "POST", path: "/api/activities", ms: [12, 70] },
  { method: "PATCH", path: "/api/activities/1", ms: [10, 60] },
  { method: "POST", path: "/api/word-lists/1/words", ms: [8, 55] },
  { method: "GET", path: "/api/phonemes", ms: [2, 12] },
] as const;

function weightedPage() {
  const total = PAGES.reduce((n, p) => n + p.weight, 0);
  let target = rand() * total;
  for (const page of PAGES) {
    target -= page.weight;
    if (target <= 0) return page;
  }
  return PAGES[0];
}

function arg(name: string, fallback: number) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const value = Number(process.argv[i + 1]);
  return Number.isFinite(value) ? value : fallback;
}

async function main() {
  const days = Math.min(Math.max(arg("days", 14), 1), 90);
  const reset = process.argv.includes("--reset");

  // Used by the Docker entrypoint: only write a history into a database that
  // has none, so a teacher's real usage is never buried under invented data.
  if (process.argv.includes("--if-empty")) {
    const existing = await prisma.pageView.count();
    if (existing > 0) {
      console.log(`Usage history already present (${existing} page views), skipping the simulation.`);
      return;
    }
  }

  if (reset) {
    await prisma.$transaction([
      prisma.pageView.deleteMany(),
      prisma.generationEvent.deleteMany(),
      prisma.activityEvent.deleteMany(),
      prisma.requestLog.deleteMany(),
    ]);
    console.log("Cleared the existing metrics tables.");
  }

  const activities = await prisma.activityConfig.findMany({
    select: { id: true, type: true, title: true },
  });
  const lists = await prisma.wordList.findMany({ select: { id: true, name: true } });
  if (!activities.length) {
    console.warn("No saved activities found: run `npm run db:seed` first for a realistic history.");
  }

  const pageViews: { path: string; sessionId: string; dwellMs: number; createdAt: Date }[] = [];
  const generations: {
    activityId: number | null;
    activityType: string;
    status: string;
    reason: string | null;
    wordCount: number;
    durationMs: number;
    createdAt: Date;
  }[] = [];
  const events: { entity: string; entityId: number | null; action: string; detail: string | null; createdAt: Date }[] = [];
  const requests: { method: string; path: string; status: number; durationMs: number; createdAt: Date }[] = [];

  for (let dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - dayOffset);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const busyness = weekend ? 0.35 : 1;

    // A teacher works in sessions: a few visits per weekday, fewer at weekends.
    const sessions = Math.max(1, Math.round(between(3, 7) * busyness));
    for (let s = 0; s < sessions; s++) {
      const sessionId = `sim-${day.getDate()}-${s}-${Math.floor(rand() * 1e6)}`;
      const startHour = between(8, 19);
      const views = between(2, 6);
      for (let v = 0; v < views; v++) {
        const page = weightedPage();
        const at = new Date(day);
        at.setHours(startHour, between(0, 59), between(0, 59), 0);
        pageViews.push({
          path: page.path,
          sessionId,
          dwellMs: between(page.dwell[0], page.dwell[1]),
          createdAt: at,
        });
      }

      // Most sessions generate at least one activity file.
      const attempts = between(0, 3);
      for (let g = 0; g < attempts; g++) {
        const activity = activities.length ? pick(activities) : null;
        const type = activity?.type ?? (rand() < 0.65 ? "WORDLE" : "WORDSEARCH");
        const failed = rand() < 0.09;
        const at = new Date(day);
        at.setHours(startHour, between(0, 59), between(0, 59), 0);
        generations.push({
          activityId: activity?.id ?? null,
          activityType: type,
          status: failed ? "failure" : "success",
          reason: failed ? pick(FAILURE_REASONS) : null,
          wordCount: failed ? 0 : between(3, 8),
          durationMs: failed ? between(3, 20) : between(12, 90),
          createdAt: at,
        });
      }

      // Occasional edits to the stored data.
      if (rand() < 0.55 && activities.length) {
        const activity = pick(activities);
        const action = rand() < 0.45 ? "created" : rand() < 0.85 ? "updated" : "deleted";
        const at = new Date(day);
        at.setHours(startHour, between(0, 59), 0, 0);
        events.push({
          entity: "activity",
          entityId: activity.id,
          action,
          detail: `${activity.type}: ${activity.title}`,
          createdAt: at,
        });
      }
      if (rand() < 0.3 && lists.length) {
        const list = pick(lists);
        const at = new Date(day);
        at.setHours(startHour, between(0, 59), 0, 0);
        events.push({
          entity: rand() < 0.5 ? "word" : "wordList",
          entityId: list.id,
          action: rand() < 0.7 ? "created" : "updated",
          detail: list.name,
          createdAt: at,
        });
      }

      // The API calls those actions would have made.
      const calls = between(6, 18);
      for (let c = 0; c < calls; c++) {
        const call = pick(API_CALLS);
        const at = new Date(day);
        at.setHours(startHour, between(0, 59), between(0, 59), 0);
        const roll = rand();
        const status = roll < 0.04 ? 400 : roll < 0.05 ? 404 : call.method === "POST" ? 201 : 200;
        requests.push({
          method: call.method,
          path: call.path,
          status,
          durationMs: between(call.ms[0], call.ms[1]),
          createdAt: at,
        });
      }
    }
  }

  await prisma.pageView.createMany({ data: pageViews });
  await prisma.generationEvent.createMany({ data: generations });
  await prisma.activityEvent.createMany({ data: events });
  await prisma.requestLog.createMany({ data: requests });

  console.log(
    `Simulated ${days} days of usage: ${pageViews.length} page views, ${generations.length} generation attempts ` +
      `(${generations.filter((g) => g.status === "failure").length} failed), ${events.length} data changes, ` +
      `${requests.length} API calls.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
