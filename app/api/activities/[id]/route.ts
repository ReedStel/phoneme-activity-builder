import { prisma } from "@/lib/db";
import { ApiError, handle, ok, parseBody, parseId } from "@/lib/api";
import { activityInclude, serializeActivity, validateActivityRefs } from "@/lib/activities";
import { activityUpdateSchema } from "@/lib/validation";

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

/** PATCH /api/activities/:id - update any subset of an activity's settings. */
export function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    const id = parseId((await params).id);
    const input = await parseBody(req, activityUpdateSchema);

    const existing = await prisma.activityConfig.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, `Activity ${id} not found`);

    // Re-check references using the merged (existing + incoming) values.
    const wordListId = input.wordListId ?? existing.wordListId;
    const targetWordId =
      input.targetWordId !== undefined ? input.targetWordId : existing.targetWordId;
    await validateActivityRefs(wordListId, targetWordId, existing.type);

    const activity = await prisma.activityConfig.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
        wordListId,
        targetWordId: existing.type === "WORDLE" ? targetWordId : null,
        ...(input.attempts !== undefined ? { attempts: input.attempts } : {}),
        ...(input.gridSize !== undefined ? { gridSize: input.gridSize } : {}),
        ...(input.allowDiagonals !== undefined ? { allowDiagonals: input.allowDiagonals } : {}),
        ...(input.showHints !== undefined ? { showHints: input.showHints } : {}),
        ...(input.seed !== undefined ? { seed: input.seed } : {}),
      },
      include: activityInclude,
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
