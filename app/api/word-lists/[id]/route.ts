import { prisma } from "@/lib/db";
import { recordActivityEvent } from "@/lib/metrics";
import { ApiError, handle, ok, parseBody, parseId } from "@/lib/api";
import { wordInclude, toWordDto } from "@/lib/serialize";
import { wordListUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/word-lists/:id - one list with all of its words. */
export function GET(req: Request, { params }: Ctx) {
  return handle(req, async () => {
    const id = parseId((await params).id);
    const list = await prisma.wordList.findUnique({
      where: { id },
      include: { words: { include: wordInclude, orderBy: { id: "asc" } } },
    });
    if (!list) throw new ApiError(404, `Word list ${id} not found`);
    return ok({ ...list, words: list.words.map(toWordDto) });
  });
}

/** PATCH /api/word-lists/:id - rename or re-describe a list. */
export function PATCH(req: Request, { params }: Ctx) {
  return handle(req, async () => {
    const id = parseId((await params).id);
    const input = await parseBody(req, wordListUpdateSchema);
    const list = await prisma.wordList.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    });
    recordActivityEvent({ entity: "wordList", entityId: id, action: "updated", detail: list.name });
    return ok(list);
  });
}

/** DELETE /api/word-lists/:id - removes the list, its words and its activities. */
export function DELETE(req: Request, { params }: Ctx) {
  return handle(req, async () => {
    const id = parseId((await params).id);
    const deleted = await prisma.wordList.delete({ where: { id } });
    recordActivityEvent({ entity: "wordList", entityId: id, action: "deleted", detail: deleted.name });
    return ok({ deleted: id });
  });
}
