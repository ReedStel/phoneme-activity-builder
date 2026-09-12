import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PhonemeWordChips } from "@/components/phonemes/PhonemeWordChips";

const TOOLS = [
  {
    href: "/word-lists",
    title: "Word Lists",
    description:
      "Create, edit and delete phoneme word lists, or start from the 90-word HCE corpus that comes with the app. Everything is saved to the database.",
    cta: "Manage word lists →",
  },
  {
    href: "/wordle",
    title: "Wordle Builder",
    description:
      "Pick one or more words from a list, set the difficulty, test the game, and save it. Students play the words in order.",
    cta: "Build a Wordle →",
  },
  {
    href: "/wordsearch",
    title: "Word Search Builder",
    description:
      "Hide words from any list in a phoneme grid, choose the size and whether diagonals are allowed, then save and download it.",
    cta: "Build a Word Search →",
  },
] as const;

const STEPS = [
  "Build a word list on the Word Lists page, or use the HCE corpus lists that come with the app.",
  "Open the Wordle or Word Search builder and choose words from a list.",
  "Pick a difficulty and play the live preview.",
  "Save the activity. It is stored in the database, so you can load, edit or delete it later.",
  "Press Generate. The server builds a single playable .html file from the saved activity.",
];

/** Decorative mini Wordle board: a finished game of /θɪn/ ("thin"). */
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
      <p className="mt-2 text-center font-display text-sm italic text-muted">/θɪn/ → &ldquo;thin&rdquo;</p>
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
              Classroom games that speak in <span className="text-accent">phonemes</span>, not spelling
            </h2>
            <p className="mt-3 text-muted">
              Build Wordle and Word Search activities from <strong>phoneme symbols</strong> like{" "}
              <PhonemeWordChips phonemes={["θ", "ɪ", "n"]} />. Hover any symbol to see its English letter
              equivalence. Keep your word lists and activities in the database, test them live, then generate a
              single HTML file your students can play in any browser.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/wordle"
                className="pressable rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-surface hover:bg-accent-strong"
              >
                Start with Wordle
              </Link>
              <Link
                href="/word-lists"
                className="pressable rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-semibold hover:border-accent hover:bg-highlight"
              >
                Manage word lists
              </Link>
            </div>
          </div>
          <HeroBoard />
        </div>
      </Card>

      <div className="grid md:grid-cols-3" style={{ gap: "var(--density-gap, 1.5rem)" }}>
        {TOOLS.map((tool) => (
          <Card key={tool.href} title={tool.title}>
            <p className="text-sm text-muted">{tool.description}</p>
            <Link href={tool.href} className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
              {tool.cta}
            </Link>
          </Card>
        ))}
      </div>

      <Card title="How it works">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Card>
    </>
  );
}
