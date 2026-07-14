import { hintFor } from "@/lib/phonemes";

/**
 * Renders a phoneme word as a row of chips, each with a hover hint showing
 * its English letter equivalence. Purely presentational.
 */
export function PhonemeWordChips({ phonemes }: { phonemes: string[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1 align-middle">
      {phonemes.map((ipa, i) => (
        <span
          key={`${ipa}-${i}`}
          title={hintFor(ipa)}
          className="cursor-help rounded-md border border-border bg-accent-soft px-2 py-0.5 font-mono text-sm font-semibold"
        >
          /{ipa}/
        </span>
      ))}
    </span>
  );
}
