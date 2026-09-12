import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "About | Phoneme Activity Builder" };

const STACK: [string, string][] = [
  ["Next.js 16 and React 19", "The pages, components and API route handlers, in one project created with create-next-app."],
  ["Prisma ORM", "A typed database client and versioned schema migrations."],
  ["SQLite", "A single-file database, so the whole app runs in one Docker container."],
  ["zod", "Validates every request before anything is stored."],
  ["Docker", "A multi-stage image that migrates and seeds the database the first time it starts."],
];

const TOOLS: [string, string][] = [
  [
    "Word Lists",
    "Create lists, then add, edit and delete words with the phoneme keyboard or a bulk paste. Phonemes are checked against the HCE inventory, and common mistakes get a “did you mean” suggestion.",
  ],
  [
    "Wordle",
    "Choose one or more words from a list and a difficulty. Students guess each word phoneme by phoneme with colour feedback, and the English spelling is revealed when they solve it.",
  ],
  [
    "Word Search",
    "Hide words from any list in a phoneme grid. Grid size and diagonals set the difficulty, and hovering a phoneme shows its English letter equivalence.",
  ],
];

export default function AboutPage() {
  return (
    <>
      <Card title="About this project">
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            The <strong className="text-foreground">Phoneme Activity Builder</strong> is a web application for
            Speech Pathology <em>students and teachers</em> (not clients). Teachers build two kinds of classroom
            activity, a <strong>Wordle</strong> game and a <strong>Word Search</strong>, where the playing pieces
            are phoneme symbols from the HCE Australian English set (such as /θ/, /ʃ/ and /tʃ/) rather than
            ordinary letters.
          </p>
          <p>
            Every activity is generated as a <strong>single standalone HTML file</strong> that runs in any normal
            web browser with no installation, so it can be shared by email, USB or the learning management system.
          </p>
        </div>
      </Card>

      <Card title="Where the project is up to">
        <ol className="space-y-2 text-sm leading-relaxed text-muted">
          <li>
            <strong className="text-foreground">Assessment 1: frontend.</strong> The interface, the phoneme keyboard
            with hover hints, playable previews and HTML generation, working from fixed word lists.
          </li>
          <li>
            <strong className="text-foreground">Assessment 2: backend and database (this version).</strong> Word
            lists, words and activity settings are stored in a database and managed through an API. Teachers can
            create, edit and delete their own content and keep several saved activities, and the HTML files are
            generated on the server from stored data. The app runs in a Docker container.
          </li>
          <li>
            <strong className="text-foreground">Later assessments.</strong> Automated testing, reliability and
            deployment.
          </li>
        </ol>
      </Card>

      <div className="grid md:grid-cols-3" style={{ gap: "var(--density-gap, 1.5rem)" }}>
        {TOOLS.map(([title, text]) => (
          <Card key={title} title={title}>
            <p className="text-sm text-muted">{text}</p>
          </Card>
        ))}
      </div>

      <Card title="How the backend works">
        <p className="text-sm leading-relaxed text-muted">
          The browser never talks to the database directly. Pages call API routes under{" "}
          <code className="rounded bg-accent-soft px-1">/api</code>, which validate the request, read or write the
          database through Prisma, and send back JSON. Each phoneme is stored as its own row, so multi-character
          symbols such as /tʃ/ and /əʉ/ keep their identity. A{" "}
          <code className="rounded bg-accent-soft px-1">/health</code> endpoint reports whether the server and
          database are up.
        </p>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          {STACK.map(([term, desc]) => (
            <div key={term} className="contents">
              <dt className="font-semibold">{term}</dt>
              <dd className="text-muted">{desc}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Author">
        <p className="text-sm">
          <strong>Reed Stelfox</strong> · Student No. <span className="font-mono">22813726</span>
        </p>
      </Card>

      <Card title="How to use this website (video)">
        <p className="mb-3 text-sm text-muted">
          A walkthrough of the builder: managing word lists, building and saving activities, and generating the
          HTML files.
        </p>
        {/* The recorded walkthrough lives at public/how-to-use.mp4 (kept out of the public repository). */}
        <video
          controls
          preload="metadata"
          className="w-full max-w-2xl rounded-lg border border-border"
          aria-label="Video walkthrough of the Phoneme Activity Builder"
        >
          <source src="/how-to-use.mp4" type="video/mp4" />
          Your browser does not support embedded video. The walkthrough is available at{" "}
          <code>/how-to-use.mp4</code>.
        </video>
      </Card>
    </>
  );
}
