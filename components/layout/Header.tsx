import { NavBar } from "./NavBar";

/** Speech-bubble logo mark holding a phoneme — the app's identity. */
function LogoMark() {
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 38 38"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M19 3C10.2 3 3 9.4 3 17.3c0 4.6 2.4 8.7 6.2 11.3-.3 2.2-1.2 4.2-2.7 5.8 2.9-.3 5.6-1.4 7.8-3.1 1.5.4 3.1.6 4.7.6 8.8 0 16-6.4 16-14.6S27.8 3 19 3Z"
        fill="var(--accent)"
      />
      <text
        x="19"
        y="23"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill="var(--surface)"
        fontFamily="Georgia, serif"
      >
        θ
      </text>
    </svg>
  );
}

/** Site header: assessment title plus the navigation bar. */
export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <h1 className="text-xl font-bold leading-tight">
              Phoneme Activity Builder
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Assessment 1 · Frontend Design &amp; Usability
            </p>
          </div>
        </div>
        <NavBar />
      </div>
    </header>
  );
}
