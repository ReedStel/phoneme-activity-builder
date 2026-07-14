/** Site footer with author identification, required on every page. */
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 px-4 py-4 text-center text-sm text-muted sm:flex-row sm:justify-between">
        <p>
          Made by <span className="font-semibold text-foreground">Reed Stelfox</span>{" "}
          · Student No. <span className="font-mono">22813726</span>
        </p>
        <p>Phoneme Activity Builder · Assessment 1 (frontend only)</p>
      </div>
    </footer>
  );
}
