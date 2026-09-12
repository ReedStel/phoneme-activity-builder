"use client";

import { useEffect, useState } from "react";

type State = "checking" | "ok" | "down";

/**
 * Live status of the backend, read from the /health endpoint. Clicking it
 * opens the raw health response.
 */
export function HealthBadge() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let cancelled = false;
    fetch("/health", { cache: "no-store" })
      .then((res) => {
        if (!cancelled) setState(res.ok ? "ok" : "down");
      })
      .catch(() => {
        if (!cancelled) setState("down");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const label =
    state === "ok"
      ? "API and database online"
      : state === "down"
        ? "API or database offline"
        : "Checking API status…";
  const dot = state === "ok" ? "bg-tile-correct" : state === "down" ? "bg-red-600" : "bg-tile-absent";

  return (
    <a
      href="/health"
      target="_blank"
      rel="noreferrer"
      title="Open the /health endpoint"
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 hover:bg-highlight hover:text-foreground"
    >
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dot}`} />
      <span>{label}</span>
    </a>
  );
}
