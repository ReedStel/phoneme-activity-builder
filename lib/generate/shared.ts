/**
 * Shared helpers for building the standalone HTML activity files.
 *
 * The generated file must run from a plain `file://` open in any browser,
 * so everything (CSS, JS, config) is inlined and there are no dependencies.
 */

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** JSON that is safe to embed inside a <script> element. */
export function embedJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "activity"
  );
}

/** Trigger a browser download of a generated HTML string. */
export function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Base stylesheet shared by both generated activities. Uses
 * prefers-color-scheme so the standalone file adapts to the player's OS.
 */
export const BASE_CSS = `
  :root {
    --bg: #faf6ef; --surface: #fffdf8; --fg: #201c17; --muted: #5d564c;
    --border: #e5dccb; --accent: #0f766e; --accent-soft: #e3efec;
    --correct: #2e7d32; --present: #b45309; --absent: #8a8178;
    --found: #cde8cf; --found-fg: #1d4d20;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #16130f; --surface: #1f1b15; --fg: #ede7dc; --muted: #a89f91;
      --border: #3b342a; --accent: #4fd1c5; --accent-soft: #12332f;
      --correct: #3f9d46; --present: #cf7a1d; --absent: #57504a;
      --found: #1d4d20; --found-fg: #cde8cf;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--fg);
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    display: flex; flex-direction: column; align-items: center;
    min-height: 100vh; padding: 1rem;
  }
  header { text-align: center; margin-bottom: 1rem; }
  h1 { font-size: 1.6rem; margin: 0 0 0.25rem; font-family: Georgia, "Times New Roman", serif; letter-spacing: -0.01em; }
  .subtitle { color: var(--muted); margin: 0; font-size: 0.95rem; }
  main { display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%; max-width: 40rem; }
  footer { margin-top: auto; padding-top: 1.5rem; color: var(--muted); font-size: 0.8rem; text-align: center; }
  .status { min-height: 1.5rem; font-weight: 600; text-align: center; }
  .status.win { color: var(--correct); }
  .status.lose { color: var(--present); }
  button { font-family: inherit; cursor: pointer; }
  @media (prefers-reduced-motion: no-preference) {
    button { transition: transform 120ms ease, background-color 150ms ease, border-color 150ms ease; }
    button:active { transform: translateY(1px); }
  }
  .hintable { position: relative; }
  .hintable:hover::after, .hintable:focus-visible::after {
    content: attr(data-hint);
    position: absolute; left: 50%; bottom: calc(100% + 6px); transform: translateX(-50%);
    background: var(--fg); color: var(--bg);
    padding: 0.3rem 0.55rem; border-radius: 0.375rem;
    font-size: 0.78rem; white-space: nowrap; pointer-events: none; z-index: 10;
  }
`;

export function htmlShell(opts: {
  title: string;
  subtitle: string;
  css: string;
  bodyMain: string;
  configJson: string;
  script: string;
  credit: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<style>${BASE_CSS}${opts.css}</style>
</head>
<body>
<header>
  <h1>${escapeHtml(opts.title)}</h1>
  <p class="subtitle">${escapeHtml(opts.subtitle)}</p>
</header>
<main>
${opts.bodyMain}
</main>
<footer>${escapeHtml(opts.credit)}</footer>
<script>
const CONFIG = ${opts.configJson};
${opts.script}
</script>
</body>
</html>`;
}
