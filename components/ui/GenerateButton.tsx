"use client";

import { useState } from "react";

/**
 * The shared "Generate" call-to-action. Runs the supplied builder, triggers
 * the download, and confirms success to the user (and screen readers).
 */
export function GenerateButton({
  onGenerate,
  label = "Generate & download HTML",
}: {
  onGenerate: () => string; // returns the downloaded filename
  label?: string;
}) {
  const [downloaded, setDownloaded] = useState<string | null>(null);

  const handleClick = () => {
    const filename = onGenerate();
    setDownloaded(filename);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="pressable inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-surface shadow-sm hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16" />
        </svg>
        {label}
      </button>
      <p role="status" aria-live="polite" className="text-sm text-muted">
        {downloaded
          ? `Downloaded "${downloaded}" — open it in any web browser to play.`
          : "Downloads a single playable .html file."}
      </p>
    </div>
  );
}
