import { prisma } from "@/lib/db";
import { ApiError, handle, ok, parseId, readJson, validate } from "@/lib/api";
import { wordInclude, toWordDto } from "@/lib/serialize";
import { MAX_WORDS_PER_LIST, wordBatchSchema, wordInputSchema } from "@/lib/validation";
import { assertKnownPhonemes, assertUniqueSpellings } from "@/lib/word-rules";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/word-lists/:id/words
 *
 * Add one word:      { "english": "chin", "phonemes": ["tʃ", "ɪ", "n"] }
 * Or bulk import:    { "words": [ { ... }, { ... } ] }
 *
 * A bulk import is all-or-nothing: if any word is invalid, nothing is
 * stored and every problem is reported, numbered by word.
 */
export function POST(req: Request, { params }: Ctx) {
  return handle(async () => {
    const listId = parseId((await params).id);
    const raw = await readJson(req);
    const isBatch = typeof raw === "object" && raw !== null && "words" in raw;
    const words = isBatch ? validate(raw, wordBatchSchema).words : [validate(raw, wordInputSchema)];

    const list = await prisma.wordList.findUnique({
      where: { id: listId },
      include: { _count: { select: { words: true } } },
    });
    if (!list) throw new ApiError(404, `Word list ${listId} not found`);

    const room = MAX_WORDS_PER_LIST - list._count.words;
    if (words.length > room) {
      throw new ApiError(
        400,
        `A list can hold ${MAX_WORDS_PER_LIST} words. This one has ${list._count.words}, so at most ${Math.max(room, 0)} more can be added.`
      );
    }
    await assertUniqueSpellings(listId, words);
    await assertKnownPhonemes(words);

    const created = await prisma.$transaction(
      words.map((w) =>
        prisma.word.create({
          data: {
            english: w.english,
            wordListId: listId,
            phonemes: {
              create: w.phonemes.map((symbol, position) => ({ position, symbol })),
            },
          },
          include: wordInclude,
        })
      )
    );
    const dtos = created.map(toWordDto);
    return ok(isBatch ? { created: dtos.length, words: dtos } : dtos[0], 201);
  });
}
