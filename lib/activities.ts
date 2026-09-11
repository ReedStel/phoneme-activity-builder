/**
 * Shared helpers for the activity-configuration routes: the Prisma include
 * shape, the JSON serializer, and referential checks that go beyond what a
 * schema validator can express (does the list exist, does the target word
 * belong to it).
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { ApiError } from "./api";

export const activityInclude = {
  wordList: { select: { id: true, name: true, _count: { select: { words: true } } } },
  targetWord: { include: { phonemes: { orderBy: { position: "asc" as const } } } },
} satisfies Prisma.ActivityConfigInclude;

export type ActivityRow = Prisma.ActivityConfigGetPayload<{ include: typeof activityInclude }>;

export function serializeActivity(a: ActivityRow) {
  return {
    id: a.id,
    title: a.title,
    type: a.type as "WORDLE" | "WORDSEARCH",
    difficulty: a.difficulty,
    wordListId: a.wordListId,
    wordListName: a.wordList.name,
    wordCount: a.wordList._count.words,
    targetWordId: a.targetWordId,
    targetWord: a.targetWord
      ? {
          id: a.targetWord.id,
          english: a.targetWord.english,
          phonemes: a.targetWord.phonemes.map((p) => p.symbol),
        }
      : null,
    attempts: a.attempts,
    gridSize: a.gridSize,
    allowDiagonals: a.allowDiagonals,
    showHints: a.showHints,
    seed: a.seed,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export type ActivityDto = ReturnType<typeof serializeActivity>;

/**
 * Ensure the referenced word list exists and has words and, for a Wordle,
 * that the target word exists and belongs to that list.
 */
export async function validateActivityRefs(
  wordListId: number,
  targetWordId: number | null | undefined,
  type: string
): Promise<void> {
  const list = await prisma.wordList.findUnique({
    where: { id: wordListId },
    include: { _count: { select: { words: true } } },
  });
  if (!list) throw new ApiError(400, `Word list ${wordListId} does not exist`);
  if (list._count.words === 0) throw new ApiError(400, "The chosen word list has no words yet");

  if (type === "WORDLE") {
    if (!targetWordId) throw new ApiError(400, "A Wordle activity needs a targetWordId");
    const word = await prisma.word.findUnique({ where: { id: targetWordId } });
    if (!word) throw new ApiError(400, `Target word ${targetWordId} does not exist`);
    if (word.wordListId !== wordListId) {
      throw new ApiError(400, "The target word must belong to the chosen word list");
    }
  }
}
