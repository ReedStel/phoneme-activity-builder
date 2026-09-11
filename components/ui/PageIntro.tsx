import type { ReactNode } from "react";

/** Page heading with a one-line explanation of what the page is for. */
export function PageIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">{children}</p>
    </div>
  );
}
