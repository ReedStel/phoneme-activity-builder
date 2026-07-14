import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "About — Phoneme Activity Builder" };

export default function AboutPage() {
  return (
    <>
      <Card title="About this project">
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            The <strong>Phoneme Activity Builder</strong> is a web application
            for Speech Pathology <em>students and teachers</em> (not clients).
            It lets a teacher build two kinds of phoneme-based classroom
            activities — a <strong>Wordle</strong> game and a{" "}
            <strong>Word Search</strong> — where the playing pieces are phoneme
            symbols (such as /θ/, /ʃ/, /tʃ/) rather than ordinary letters.
          </p>
          <p>
            Each builder produces a <strong>single standalone HTML file</strong>{" "}
            that runs in any normal web browser with no installation, so
            activities can be shared by email, USB or a learning management
            system.
          </p>
          <p>
            <strong>Assessment 1 is frontend only.</strong> The word lists are
            fixed presets at this stage; a database and dynamic word-list
            management will be introduced in later assessments, and the
            component structure has been designed so those features can slot in
            without reworking the interface.
          </p>
        </div>
      </Card>

      <div
        className="grid sm:grid-cols-2"
        style={{ gap: "var(--density-gap, 1.5rem)" }}
      >
        <Card title="The Wordle tool">
          <p className="text-sm text-muted">
            The teacher picks one phoneme-based target word (or composes a
            custom one on the phoneme keyboard), sets the number of attempts
            and hint options, then previews the playable game. Students guess
            the word phoneme-by-phoneme with Wordle-style colour feedback, and
            the English spelling equivalence is revealed when they solve it.
          </p>
        </Card>
        <Card title="The Word Search tool">
          <p className="text-sm text-muted">
            The Word Search is generated from a small fixed list of five
            phoneme words. The teacher chooses the grid size and whether
            diagonal placements are allowed, can reshuffle the layout, then
            downloads the puzzle. Hovering any phoneme in the grid shows its
            English letter equivalence as a hint.
          </p>
        </Card>
      </div>

      <Card title="Author">
        <p className="text-sm">
          <strong>Reed Stelfox</strong> · Student No.{" "}
          <span className="font-mono">22813726</span>
        </p>
      </Card>

      <Card title="How to use this website (video)">
        <p className="mb-3 text-sm text-muted">
          A short walkthrough of the builder — choosing an activity,
          configuring it, previewing, and generating the HTML file.
        </p>
        {/* Place the recorded walkthrough at public/how-to-use.mp4 */}
        <video
          controls
          preload="metadata"
          className="w-full max-w-2xl rounded-lg border border-border"
          aria-label="Video walkthrough of the Phoneme Activity Builder"
        >
          <source src="/how-to-use.mp4" type="video/mp4" />
          Your browser does not support embedded video. The walkthrough video
          is available at <code>/how-to-use.mp4</code>.
        </video>
      </Card>
    </>
  );
}
