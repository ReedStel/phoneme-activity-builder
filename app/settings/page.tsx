"use client";

import { Card } from "@/components/ui/Card";
import {
  useSettings,
  type Density,
  type Theme,
} from "@/lib/settings";

const THEME_OPTIONS: { value: Theme; label: string; description: string }[] = [
  { value: "light", label: "Light", description: "Bright interface" },
  { value: "dark", label: "Dark", description: "Low-glare interface" },
  {
    value: "system",
    label: "System",
    description: "Follow the device preference",
  },
];

const DENSITY_OPTIONS: { value: Density; label: string; description: string }[] =
  [
    {
      value: "comfortable",
      label: "Comfortable",
      description: "More whitespace (default)",
    },
    {
      value: "compact",
      label: "Compact",
      description: "Tighter spacing, more on screen",
    },
  ];

export default function SettingsPage() {
  const { theme, density, setTheme, setDensity } = useSettings();

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="mt-1 text-sm text-muted">
          Preferences are stored in cookies, so they persist the next time you
          open the builder.
        </p>
      </div>

      <Card title="Theme">
        <div
          role="radiogroup"
          aria-label="Colour theme"
          className="flex flex-wrap gap-3"
        >
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={theme === option.value}
              onClick={() => setTheme(option.value)}
              className={`min-w-36 rounded-xl border p-4 text-left transition-colors ${
                theme === option.value
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-surface hover:border-accent"
              }`}
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="block text-xs text-muted">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Layout density">
        <div
          role="radiogroup"
          aria-label="Layout density"
          className="flex flex-wrap gap-3"
        >
          {DENSITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={density === option.value}
              onClick={() => setDensity(option.value)}
              className={`min-w-36 rounded-xl border p-4 text-left transition-colors ${
                density === option.value
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-surface hover:border-accent"
              }`}
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="block text-xs text-muted">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="About these settings">
        <p className="text-sm text-muted">
          The theme and density are saved as cookies (<code>pab-theme</code>,{" "}
          <code>pab-density</code>) and applied on the server during the first
          page render, so there is no flash of the wrong theme when the site
          loads.
        </p>
      </Card>
    </>
  );
}
