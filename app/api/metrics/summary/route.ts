import { handle, ok } from "@/lib/api";
import { getDashboardSummary } from "@/lib/metrics";

/**
 * GET /api/metrics/summary?days=14
 *
 * Everything the dashboard shows, as JSON: health, stored totals, generation
 * success and failure counts, average time on page, traffic, a daily series
 * and any current alerts. The dashboard page renders this on the server and
 * then refreshes from here.
 */
export function GET(req: Request) {
  return handle(req, async () => {
    const raw = new URL(req.url).searchParams.get("days");
    const days = Math.min(Math.max(Number(raw) || 14, 1), 90);
    return ok(await getDashboardSummary(days));
  });
}
