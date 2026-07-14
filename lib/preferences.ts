/**
 * Preference types and cookie names shared by the server layout (which reads
 * the cookies for the initial render) and the client SettingsProvider (which
 * writes them). Kept free of "use client" so server components get real
 * values, not client references.
 */

export type Theme = "light" | "dark" | "system";
export type Density = "comfortable" | "compact";

export const THEME_COOKIE = "pab-theme";
export const DENSITY_COOKIE = "pab-density";

export function isTheme(v: string | undefined): v is Theme {
  return v === "light" || v === "dark" || v === "system";
}

export function isDensity(v: string | undefined): v is Density {
  return v === "comfortable" || v === "compact";
}
