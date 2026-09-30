"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const SESSION_KEY = "pab-session-id";
const MAX_DWELL_MS = 6 * 60 * 60 * 1000;

/** A random id per browser tab, so repeat views can be grouped. Not a person. */
function sessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return "no-storage";
  }
}

/**
 * Measures how long each page stays visible and reports it once, when the
 * page is hidden, closed or navigated away from. sendBeacon is used so the
 * report still arrives when the tab is closing.
 *
 * This is what feeds "average time on page" on the dashboard. Only the path,
 * a random per-tab id and a duration are sent.
 */
export function PageTimer() {
  const pathname = usePathname();
  // Set inside the effect, not here: reading the clock during render is
  // impure and React can re-render at any time.
  const visibleSince = useRef(0);
  const accumulated = useRef(0);
  const sent = useRef(false);

  useEffect(() => {
    visibleSince.current = Date.now();
    accumulated.current = 0;
    sent.current = false;

    const flush = () => {
      if (sent.current) return;
      const open =
        document.visibilityState === "visible" ? Date.now() - visibleSince.current : 0;
      const dwellMs = Math.min(accumulated.current + open, MAX_DWELL_MS);
      if (dwellMs < 500) return; // ignore instant bounces and prefetches
      sent.current = true;
      const body = JSON.stringify({ path: pathname, sessionId: sessionId(), dwellMs });
      try {
        navigator.sendBeacon?.(
          "/api/metrics/page-view",
          new Blob([body], { type: "application/json" })
        );
      } catch {
        // Metrics must never interrupt the page.
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        accumulated.current += Date.now() - visibleSince.current;
        flush();
      } else {
        visibleSince.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      flush(); // the route changed
    };
  }, [pathname]);

  return null;
}
