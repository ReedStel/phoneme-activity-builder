import type { Metadata } from "next";
import { WordListManager } from "@/components/wordlists/WordListManager";

export const metadata: Metadata = { title: "Word Lists | Phoneme Activity Builder" };

/** /word-lists, optionally /word-lists?list=3 to open a specific list. */
export default async function WordListsPage({
  searchParams,
}: {
  searchParams: Promise<{ list?: string }>;
}) {
  const { list } = await searchParams;
  const id = Number(list);
  return <WordListManager initialListId={Number.isInteger(id) && id > 0 ? id : undefined} />;
}
