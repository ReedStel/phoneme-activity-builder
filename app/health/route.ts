import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api";

/**
 * GET /health
 *
 * Liveness and readiness check. Returns 200 when the server is up and the
 * database answers a trivial query; 503 if the database is unreachable.
 *
 * It also reports how long that database round trip took, how long the
 * process has been up, what is stored, and whether any generation has failed
 * in the last day, so an external monitor (or the footer badge, or the
 * dashboard) can see more than just "up".
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const databaseMs = Date.now() - startedAt;

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [wordLists, words, activities, generationFailures24h] = await Promise.all([
      prisma.wordList.count(),
      prisma.word.count(),
      prisma.activityConfig.count(),
      prisma.generationEvent.count({ where: { status: "failure", createdAt: { gte: since24h } } }),
    ]);

    return ok({
      status: "ok",
      database: "ok",
      databaseMs,
      uptimeSeconds: Math.round(process.uptime()),
      counts: { wordLists, words, activities },
      generationFailures24h,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Health check failed:", err);
    return fail(503, "Database unavailable");
  }
}
