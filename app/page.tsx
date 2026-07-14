import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PhonemeWordChips } from "@/components/phonemes/PhonemeWordChips";

const TOOLS = [
  {
    href: "/wordle",
    title: "Wordle Builder",
    description:
      "Choose a phoneme-based target word from the HCE corpus, set the difficulty, play a live preview and download the game as a single HTML file.",
    cta: "Build a Wordle →",
  },
  {
    href: "/wordsearch",
    title: "Word Search Builder",
    description:
      "Generate a phoneme word search from a small word list, preview it, and download it as a playable HTML page.",
    cta: "Build a Word Search →",
  },
] as const;

/** Decorative mini Wordle board — a finished game of /θɪn/ ("thin"). */
function HeroBoard() {
  const rows: { ipa: string; state: "correct" | "present" | "absent" }[][] = [
    [
      { ipa: "ʃ", state: "absent" },
      { ipa: "ɪ", state: "correct" },
      { ipa: "p", state: "absent" },
    ],
    [
      { ipa: "n", state: "present" },
      { ipa: "ɪ", state: "correct" },
      { ipa: "t", state: "absent" },
    ],
    [
      { ipa: "θ", state: "correct" },
      { ipa: "ɪ", state: "correct" },
      { ipa: "n", state: "correct" },
    ],
  ];
  const bg = {
    correct: "bg-tile-correct",
    present: "bg-tile-present",
    absent: "bg-tile-absent",
  } as const;
  return (
    <div aria-hidden="true" className="flex rotate-2 flex-col gap-1.5">
      {rows.map((row, r) => (
        <div key={r} className="flex gap-1.5">
          {row.map((cell, c) => (
            <div
              key={c}
              className={`flex h-14 w-14 items-center justify-center rounded-lg text-lg font-bold text-surface shadow-sm ${bg[cell.state]}`}
            >
              /{cell.ipa}/
            </div>
          ))}
        </div>
      ))}
      <p className="mt-2 text-center font-display text-sm italic text-muted">
        /θɪn/ → &ldquo;thin&rdquo;
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Card>
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold leading-tight">
              Classroom games that speak in{" "}
              <span className="text-accent">phonemes</span>, not spelling
            </h2>
            <p className="mt-3 text-muted">
              Build Wordle and Word Search activities from{" "}
              <strong>phoneme symbols</strong> like{" "}
              <PhonemeWordChips phonemes={["θ", "ɪ", "n"]} /> — hover any symbol
              to see its English letter equivalence. Configure the activity,
              test the live preview, then download a single HTML file your
              students can play in any browser.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/wordle"
                className="pressable rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-surface hover:bg-accent-strong"
              >
                Start with Wordle
              </Link>
              <Link
                href="/about"
                className="pressable rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-semibold hover:border-accent hover:bg-highlight"
              >
                Learn more
              </Link>
            </div>
          </div>
          <HeroBoard />
        </div>
      </Card>

      <div
        className="grid sm:grid-cols-2"
        style={{ gap: "var(--density-gap, 1.5rem)" }}
      >
        {TOOLS.map((tool) => (
          <Card key={tool.href} title={tool.title}>
            <p className="text-sm text-muted">{tool.description}</p>
            <Link
              href={tool.href}
              className="mt-3 inline-block text-sm font-semibold text-accent hover:underline"
            >
              {tool.cta}
            </Link>
          </Card>
        ))}
      </div>

      <Card title="How it works">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Pick an activity type — Wordle or Word Search.</li>
          <li>Choose the phoneme word(s) and difficulty settings.</li>
          <li>Play the live preview to check the activity.</li>
          <li>
            Press <strong>Generate</strong> to download a single playable{" "}
            <code className="rounded bg-accent-soft px-1">.html</code> file for
            the classroom.
          </li>
        </ol>
      </Card>
    </>
  );
}
