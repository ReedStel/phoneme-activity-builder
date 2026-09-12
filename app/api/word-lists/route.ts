import { prisma } from "@/lib/db";
import { handle, ok, parseBody } from "@/lib/api";
import { wordInclude, toWordDto } from "@/lib/serialize";
import { wordListInputSchema } from "@/lib/validation";
import { assertKnownPhonemes, assertUniqueSpellings } from "@/lib/word-rules";

/** GET /api/word-lists - every list with its word and activity counts. */
export function GET() {
  return handle(async () => {
    const lists = await prisma.wordList.findMany({
      orderBy: { id: "asc" },
      include: { _count: { select: { words: true, activities: true } } },
    });
    return ok(
      lists.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
        wordCount: l._count.words,
        activityCount: l._count.activities,
        updatedAt: l.updatedAt.toISOString(),
      }))
    );
  });
}

/** POST /api/word-lists - create a list, optionally with initial words. */
export function POST(req: Request) {
  return handle(async () => {
    const input = await parseBody(req, wordListInputSchema);
    const words = input.words ?? [];
    await assertUniqueSpellings(null, words);
    await assertKnownPhonemes(words);

    const list = await prisma.wordList.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        words: {
          create: words.map((w) => ({
            english: w.english,
            phonemes: {
              create: w.phonemes.map((symbol, position) => ({ position, symbol })),
            },
          })),
        },
      },
      include: { words: { include: wordInclude, orderBy: { id: "asc" } } },
    });
    return ok(
      {
        id: list.id,
        name: list.name,
        description: list.description,
        words: list.words.map(toWordDto),
      },
      201
    );
  });
}
