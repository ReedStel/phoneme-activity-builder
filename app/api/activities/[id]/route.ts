import { prisma } from "@/lib/db";
import { ApiError, handle, ok, parseBody, parseId } from "@/lib/api";
import { activityInclude, serializeActivity, validateActivitySelection } from "@/lib/activities";
import { activityUpdateSchema, type ActivityType } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/activities/:id */
export function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const id = parseId((await params).id);
    const activity = await prisma.activityConfig.findUnique({
      where: { id },
      include: activityInclude,
    });
    if (!activity) throw new ApiError(404, `Activity ${id} not found`);
    return ok(serializeActivity(activity));
  });
}

/** PATCH /api/activities/:id - update any subset of an activity's settings or words. */
export function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    const id = parseId((await params).id);
    const input = await parseBody(req, activityUpdateSchema);

    const existing = await prisma.activityConfig.findUnique({
      where: { id },
      include: { words: { orderBy: { position: "asc" } } },
    });
    if (!existing) throw new ApiError(404, `Activity ${id} not found`);

    if (
      input.wordListId !== undefined &&
      input.wordListId !== existing.wordListId &&
      input.wordIds === undefined
    ) {
      throw new ApiError(400, "Changing the word list also needs a new word selection (wordIds)");
    }

    // Check the merged result (existing values plus the incoming changes).
    const wordListId = input.wordListId ?? existing.wordListId;
    const wordIds = input.wordIds ?? existing.words.map((w) => w.wordId);
    const gridSize = input.gridSize ?? existing.gridSize;
    await validateActivitySelection({
      type: existing.type as ActivityType,
      wordListId,
      wordIds,
      gridSize,
    });

    const activity = await prisma.$transaction(async (tx) => {
      if (input.wordIds) {
        await tx.activityWord.deleteMany({ where: { activityId: id } });
        await tx.activityWord.createMany({
          data: input.wordIds.map((wordId, position) => ({ activityId: id, wordId, position })),
        });
      }
      return tx.activityConfig.update({
        where: { id },
        data: {
          wordListId,
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
          ...(input.attempts !== undefined ? { attempts: input.attempts } : {}),
          ...(input.gridSize !== undefined ? { gridSize: input.gridSize } : {}),
          ...(input.allowDiagonals !== undefined ? { allowDiagonals: input.allowDiagonals } : {}),
          ...(input.showHints !== undefined ? { showHints: input.showHints } : {}),
          ...(input.seed !== undefined ? { seed: input.seed } : {}),
        },
        include: activityInclude,
      });
    });
    return ok(serializeActivity(activity));
  });
}

/** DELETE /api/activities/:id */
export function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const id = parseId((await params).id);
    await prisma.activityConfig.delete({ where: { id } });
    return ok({ deleted: id });
  });
}
