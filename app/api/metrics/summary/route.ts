import { handle, ok } from "@/lib/api";
import { getDashboardSummary } from "@/lib/metrics";

/**
 * GET /api/metrics/summary?days=14
 *
 * Everything the dashboard shows, as JSON: health, stored totals, generation
 * success and failure counts, average time on page, traffic, a daily series
 * and any current alerts. The dashboard page renders this on the server and
 * then refreshes from here.
 *
 * Results are reused for a few seconds (see lib/metrics.ts). Add ?fresh=1 to
 * compute new figures immediately, which the dashboard's Refresh button does.
 */
export function GET(req: Request) {
  return handle(req, async () => {
    const params = new URL(req.url).searchParams;
    const days = Math.min(Math.max(Number(params.get("days")) || 14, 1), 90);
    const fresh = params.get("fresh") === "1";
    return ok(await getDashboardSummary(days, { fresh }));
  });
}
