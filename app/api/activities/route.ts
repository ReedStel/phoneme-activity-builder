import { prisma } from "@/lib/db";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { activityInclude, serializeActivity, validateActivitySelection } from "@/lib/activities";
import { ACTIVITY_TYPES, activityInputSchema, type ActivityType } from "@/lib/validation";

/**
 * GET /api/activities - saved activity configurations, newest first.
 * Filter by type with ?type=WORDLE or ?type=WORDSEARCH.
 */
export function GET(req: Request) {
  return handle(async () => {
    const type = new URL(req.url).searchParams.get("type");
    if (type !== null && !ACTIVITY_TYPES.includes(type as ActivityType)) {
      throw new ApiError(400, "type must be WORDLE or WORDSEARCH");
    }
    const activities = await prisma.activityConfig.findMany({
      where: type ? { type } : undefined,
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
    await validateActivitySelection({
      type: input.type,
      wordListId: input.wordListId,
      wordIds: input.wordIds,
      gridSize: input.gridSize,
    });

    const activity = await prisma.activityConfig.create({
      data: {
        title: input.title,
        type: input.type,
        difficulty: input.difficulty,
        wordListId: input.wordListId,
        attempts: input.attempts,
        gridSize: input.gridSize,
        allowDiagonals: input.allowDiagonals,
        showHints: input.showHints,
        seed: input.seed,
        words: {
          create: input.wordIds.map((wordId, position) => ({ wordId, position })),
        },
      },
      include: activityInclude,
    });
    return ok(serializeActivity(activity), 201);
  });
}
