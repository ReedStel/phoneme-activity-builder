import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api";

/**
 * GET /health
 * Liveness and readiness check. Returns 200 when the server is up and the
 * database answers a trivial query; 503 if the database is unreachable.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({
      status: "ok",
      database: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Health check failed:", err);
    return fail(503, "Database unavailable");
  }
}
