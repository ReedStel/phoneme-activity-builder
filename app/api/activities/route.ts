import { prisma } from "@/lib/db";
import { handle, ok, parseBody } from "@/lib/api";
import { activityInclude, serializeActivity, validateActivityRefs } from "@/lib/activities";
import { activityInputSchema } from "@/lib/validation";

/** GET /api/activities - all saved activity configurations, newest first. */
export function GET() {
  return handle(async () => {
    const activities = await prisma.activityConfig.findMany({
      orderBy: { updatedAt: "desc" },
      include: activityInclude,
    });
    return ok(activities.map(serializeActivity));
  });
}

/** POST /api/activities - save a new Wordle or Word Search configuration. */
export function POST(req: Request) {
  return handle(async () => {
    const input = await parseBody(req, activityInputSchema);
    await validateActivityRefs(input.wordListId, input.targetWordId, input.type);

    const activity = await prisma.activityConfig.create({
      data: {
        title: input.title,
        type: input.type,
        difficulty: input.difficulty,
        wordListId: input.wordListId,
        targetWordId: input.type === "WORDLE" ? input.targetWordId : null,
        attempts: input.attempts,
        gridSize: input.gridSize,
        allowDiagonals: input.allowDiagonals,
        showHints: input.showHints,
        seed: input.seed,
      },
      include: activityInclude,
    });
    return ok(serializeActivity(activity), 201);
  });
}
