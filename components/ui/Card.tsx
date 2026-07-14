import type { ReactNode } from "react";

/** Consistent surface for every panel; padding follows the density setting. */
export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.04)] ${className}`}
      style={{ padding: "var(--density-pad, 1.5rem)" }}
    >
      {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}
