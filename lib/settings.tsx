"use client";

/**
 * App-wide user preferences (theme + layout density), persisted in cookies.
 *
 * The root layout reads the cookies on the server so the correct theme class
 * is present in the initial HTML (no flash of the wrong theme), then this
 * provider takes over on the client for live switching.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DENSITY_COOKIE,
  THEME_COOKIE,
  type Density,
  type Theme,
} from "./preferences";

export type { Density, Theme } from "./preferences";

interface Settings {
  theme: Theme;
  density: Density;
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
}

const SettingsContext = createContext<Settings | null>(null);

function writeCookie(name: string, value: string) {
  // One-year persistence; SameSite=Lax is enough for a same-site preference.
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

function resolveThemeClass(theme: Theme): boolean {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return theme === "dark";
}

export function SettingsProvider({
  initialTheme,
  initialDensity,
  children,
}: {
  initialTheme: Theme;
  initialDensity: Density;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [density, setDensityState] = useState<Density>(initialDensity);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    writeCookie(THEME_COOKIE, next);
    document.documentElement.classList.toggle("dark", resolveThemeClass(next));
  }, []);

  const setDensity = useCallback((next: Density) => {
    setDensityState(next);
    writeCookie(DENSITY_COOKIE, next);
    document.documentElement.classList.remove(
      "density-comfortable",
      "density-compact"
    );
    document.documentElement.classList.add(`density-${next}`);
  }, []);

  // Track OS theme changes while "system" is selected.
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.classList.toggle("dark", media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  return (
    <SettingsContext.Provider value={{ theme, density, setTheme, setDensity }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
