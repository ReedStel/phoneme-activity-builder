import type { Metadata } from "next";
import { WordSearchBuilder } from "@/components/wordsearch/WordSearchBuilder";

export const metadata: Metadata = { title: "Word Search Builder | Phoneme Activity Builder" };

export default function WordSearchPage() {
  return <WordSearchBuilder />;
}
