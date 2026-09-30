import { z } from "zod";
import { handle, ok, parseBody } from "@/lib/api";
import { recordPageView } from "@/lib/metrics";

/**
 * POST /api/metrics/page-view
 *
 * Sent by the browser when a page is hidden or closed, so the dashboard can
 * report average time on page. The session id is a random value per browser
 * tab, not a person: no personal data is stored.
 */
const pageViewSchema = z.object({
  path: z.string().min(1).max(120),
  sessionId: z.string().min(6).max(64),
  dwellMs: z
    .number()
    .int()
    .min(0)
    .max(6 * 60 * 60 * 1000), // ignore anything over six hours (a tab left open)
});

export function POST(req: Request) {
  return handle(req, async () => {
    const input = await parseBody(req, pageViewSchema);
    await recordPageView(input);
    return ok({ recorded: true }, 201);
  });
}
