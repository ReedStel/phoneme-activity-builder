import { prisma } from "@/lib/db";
import { ApiError, handle, ok, parseBody, parseId } from "@/lib/api";
import { wordInclude, toWordDto } from "@/lib/serialize";
import { wordListUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/word-lists/:id - one list with all of its words. */
export function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
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
  return handle(async () => {
    const id = parseId((await params).id);
    const input = await parseBody(req, wordListUpdateSchema);
    const list = await prisma.wordList.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    });
    return ok(list);
  });
}

/** DELETE /api/word-lists/:id - removes the list, its words and its activities. */
export function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const id = parseId((await params).id);
    await prisma.wordList.delete({ where: { id } });
    return ok({ deleted: id });
  });
}
