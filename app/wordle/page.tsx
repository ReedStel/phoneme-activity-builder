import type { Metadata } from "next";
import { WordleBuilder } from "@/components/wordle/WordleBuilder";

export const metadata: Metadata = { title: "Wordle Builder | Phoneme Activity Builder" };

export default function WordlePage() {
  return <WordleBuilder />;
}
