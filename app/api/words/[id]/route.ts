import { prisma } from "@/lib/db";
import { ApiError, handle, ok, parseBody, parseId } from "@/lib/api";
import { assertPhonemesExist } from "@/lib/phoneme-check";
import { wordInclude, toWordDto } from "@/lib/serialize";
import { wordUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/words/:id */
export function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const id = parseId((await params).id);
    const word = await prisma.word.findUnique({ where: { id }, include: wordInclude });
    if (!word) throw new ApiError(404, `Word ${id} not found`);
    return ok(toWordDto(word));
  });
}

/** PATCH /api/words/:id - update the spelling and/or replace the phoneme sequence. */
export function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    const id = parseId((await params).id);
    const input = await parseBody(req, wordUpdateSchema);
    if (input.phonemes) await assertPhonemesExist(input.phonemes);

    // Replacing the phoneme rows and updating the word happen atomically.
    const word = await prisma.$transaction(async (tx) => {
      const existing = await tx.word.findUnique({ where: { id } });
      if (!existing) throw new ApiError(404, `Word ${id} not found`);
      if (input.phonemes) {
        await tx.wordPhoneme.deleteMany({ where: { wordId: id } });
        await tx.wordPhoneme.createMany({
          data: input.phonemes.map((symbol, position) => ({ wordId: id, position, symbol })),
        });
      }
      return tx.word.update({
        where: { id },
        data: input.english !== undefined ? { english: input.english } : {},
        include: wordInclude,
      });
    });
    return ok(toWordDto(word));
  });
}

/** DELETE /api/words/:id */
export function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const id = parseId((await params).id);
    await prisma.word.delete({ where: { id } });
    return ok({ deleted: id });
  });
}
