/**
 * Shared class names for buttons and form fields, so every page uses the
 * same sizes, colours and focus styles.
 */

const base =
  "pressable inline-flex items-center justify-center gap-2 rounded-full font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export const btn = {
  primary: `${base} bg-accent px-5 py-2.5 text-sm font-bold text-surface hover:bg-accent-strong`,
  secondary: `${base} border border-border bg-surface px-4 py-2 text-sm hover:border-accent hover:bg-highlight`,
  secondarySm: `${base} border border-border bg-surface px-3 py-1.5 text-xs hover:border-accent hover:bg-highlight`,
  dangerSm: `${base} border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40`,
  dangerSolidSm: `${base} bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800`,
};

export const field =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent";
