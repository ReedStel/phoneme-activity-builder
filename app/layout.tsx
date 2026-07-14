import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Fraunces, Nunito_Sans } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SettingsProvider } from "@/lib/settings";
import {
  DENSITY_COOKIE,
  THEME_COOKIE,
  isDensity,
  isTheme,
  type Density,
  type Theme,
} from "@/lib/preferences";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  axes: ["SOFT", "WONK", "opsz"],
});
const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Phoneme Activity Builder",
  description:
    "Assessment 1 — a frontend builder for phoneme-based Wordle and Word Search classroom activities for Speech Pathology teaching.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read preferences server-side so the first paint already has the right
  // theme — no flash of the wrong mode.
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const densityCookie = cookieStore.get(DENSITY_COOKIE)?.value;
  const theme: Theme = isTheme(themeCookie) ? themeCookie : "system";
  const density: Density = isDensity(densityCookie)
    ? densityCookie
    : "comfortable";

  const htmlClasses = [
    theme === "dark" ? "dark" : "",
    `density-${density}`,
    fraunces.variable,
    nunitoSans.variable,
    "h-full antialiased",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang="en" className={htmlClasses} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans">
        {/* When the preference is "system", the dark class must be applied
            before hydration to avoid a flash of the wrong theme. */}
        {theme === "system" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `if (matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.classList.add("dark");`,
            }}
          />
        )}
        <SettingsProvider initialTheme={theme} initialDensity={density}>
          <Header />
          <main
            className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6"
            style={{ gap: "var(--density-gap, 1.5rem)" }}
          >
            {children}
          </main>
          <Footer />
        </SettingsProvider>
      </body>
    </html>
  );
}
