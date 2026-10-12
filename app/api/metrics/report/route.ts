import { handle } from "@/lib/api";
import { getDashboardSummary } from "@/lib/metrics";

/** Escape a value for CSV: quote it and double any quotes inside. */
function cell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * GET /api/metrics/report?days=14
 *
 * The same figures as the dashboard, as a CSV file a teacher or coordinator
 * can open in Excel. Reporting should not be locked inside one screen.
 */
export function GET(req: Request) {
  return handle(req, async () => {
    const raw = new URL(req.url).searchParams.get("days");
    const days = Math.min(Math.max(Number(raw) || 14, 1), 90);
    const s = await getDashboardSummary(days, { fresh: true });

    const lines: string[] = [];
    lines.push(cell("Phoneme Activity Builder usage report"));
    lines.push([cell("Generated"), cell(s.generatedAt)].join(","));
    lines.push([cell("Window (days)"), cell(s.windowDays)].join(","));
    lines.push("");

    lines.push([cell("Measure"), cell("Value")].join(","));
    const measures: [string, string | number | null][] = [
      ["Health", s.health.status],
      ["Database response (ms)", s.health.databaseMs],
      ["Uptime (seconds)", s.health.uptimeSeconds],
      ["Word lists stored", s.totals.wordLists],
      ["Words stored", s.totals.words],
      ["Activities stored", s.totals.activities],
      ...s.totals.byType.map((t) => [`${t.label} activities stored`, t.count] as [string, number]),
      ["Activities created in window", s.totals.activitiesCreated],
      ["Activities updated in window", s.totals.activitiesUpdated],
      ["Activities deleted in window", s.totals.activitiesDeleted],
      ["Generation attempts", s.generation.total],
      ["Generated successfully", s.generation.success],
      ["Generation failures", s.generation.failure],
      ["Generation success rate (%)", s.generation.successRate],
      ["Average generation time (ms)", s.generation.averageMs],
      ["Most used activity type", s.generation.mostUsedType?.label ?? "no data"],
      ["Page views", s.engagement.views],
      ["Average time on page (seconds)", s.engagement.averageDwellSeconds],
      ["API requests", s.traffic.requests],
      ["API errors", s.traffic.errors],
      ["API error rate (%)", s.traffic.errorRate],
      ["Average API response (ms)", s.traffic.averageMs],
    ];
    for (const [label, value] of measures) lines.push([cell(label), cell(value)].join(","));
    lines.push("");

    lines.push(
      [cell("Date"), cell("Activities created"), cell("Generated"), cell("Failed")].join(",")
    );
    for (const day of s.series) {
      lines.push([cell(day.date), cell(day.created), cell(day.success), cell(day.failure)].join(","));
    }
    lines.push("");

    lines.push([cell("Page"), cell("Views"), cell("Average seconds on page")].join(","));
    for (const p of s.engagement.byPath) {
      lines.push([cell(p.path), cell(p.views), cell(p.averageDwellSeconds)].join(","));
    }

    const filename = `phoneme-builder-report-${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(`${lines.join("\r\n")}\r\n`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  });
}
