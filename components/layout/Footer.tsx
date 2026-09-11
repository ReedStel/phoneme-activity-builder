import { HealthBadge } from "@/components/ui/HealthBadge";

/** Site footer: author identification (required on every page) and live API status. */
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 px-4 py-4 text-center text-sm text-muted sm:flex-row sm:justify-between">
        <p>
          Made by <span className="font-semibold text-foreground">Reed Stelfox</span>{" "}
          · Student No. <span className="font-mono">22813726</span>
        </p>
        <HealthBadge />
      </div>
    </footer>
  );
}
