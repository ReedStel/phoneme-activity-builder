import { prisma } from "@/lib/db";
import { ApiError, handle, ok, parseBody, parseId } from "@/lib/api";
import { assertPhonemesExist } from "@/lib/phoneme-check";
import { wordInclude, toWordDto } from "@/lib/serialize";
import { MAX_WORDS_PER_LIST, wordInputSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/word-lists/:id/words - add a word (English + ordered phonemes) to a list. */
export function POST(req: Request, { params }: Ctx) {
  return handle(async () => {
    const listId = parseId((await params).id);
    const input = await parseBody(req, wordInputSchema);

    const list = await prisma.wordList.findUnique({
      where: { id: listId },
      include: { _count: { select: { words: true } } },
    });
    if (!list) throw new ApiError(404, `Word list ${listId} not found`);
    if (list._count.words >= MAX_WORDS_PER_LIST) {
      throw new ApiError(
        400,
        `This list already holds the maximum of ${MAX_WORDS_PER_LIST} words`
      );
    }
    await assertPhonemesExist(input.phonemes);

    const word = await prisma.word.create({
      data: {
        english: input.english,
        wordListId: listId,
        phonemes: {
          create: input.phonemes.map((symbol, position) => ({ position, symbol })),
        },
      },
      include: wordInclude,
    });
    return ok(toWordDto(word), 201);
  });
}
