# Phoneme Activity Builder

**Assessment 1 — Frontend Design and Usability**
Reed Stelfox · Student No. 22813726

A React / Next.js builder that lets Speech Pathology teachers create two
phoneme-based classroom activities — a **Wordle** game and a **Word Search** —
preview them live, and download each one as a **single standalone `.html` file**
that runs in any normal web browser.

> Assessment 1 is frontend only. Word lists are fixed presets; a database and
> dynamic word-list management arrive in later assessments.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Created with `npx create-next-app .` (Next.js App Router, TypeScript,
Tailwind CSS).

## Pages

| Route         | Purpose                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `/`           | Home — introduction and links to the tools                              |
| `/about`      | Project explanation, author details, and the how-to-use video           |
| `/wordle`     | Build, preview, and download the phoneme Wordle                         |
| `/wordsearch` | Build, preview, and download the phoneme Word Search                    |
| `/settings`   | Light/dark/system theme and layout density, persisted in cookies        |

## Key features

- **Phoneme-first interface** — activities are composed from the HCE
  (Harrington, Cox & Evans) Australian English phoneme set specified in the
  course corpus (e.g. /θ/, /ʃ/, /ɹ/, /æɪ/), not standard spelling. The
  on-screen keyboard follows the corpus's row layout, and every phoneme key
  and grid cell has a mouse-over/focus hint showing the phonetic-to-English
  letter equivalence, e.g. `/θ/ — TH (as in thin)`.
- **Live playable previews** — the teacher tests the exact activity students
  will receive before generating it.
- **Single-file HTML output** — the Generate button downloads a dependency-free
  HTML file (inline CSS/JS + embedded config) playable offline in any browser.
  The Word Search grid is seed-generated, so the downloaded puzzle matches the
  preview exactly.
- **Difficulty settings** — Wordle: target-word length (the 90 corpus words
  are grouped as 3, 4 or 5 phonemes), attempts (4–6), hints on/off, preset or
  custom target word. Word Search: grid size (8–12), diagonals on/off,
  reshuffle, hints on/off, and a teacher-facing Show answers toggle.
- **Theme persistence** — theme and density cookies are read **server-side**
  in the root layout, so the first paint is already in the right theme (no
  flash of the wrong mode).
- **Accessibility** — semantic landmarks, `aria-label`s on every phoneme
  control, `role="status"` live regions for game feedback, keyboard support
  (Tab/Enter on keys, physical Enter/Backspace in Wordle), visible focus
  outlines, and 44px-class touch targets.
- **Responsive** — single column with a hamburger menu on mobile; two-column
  builder + sticky preview on desktop; the Word Search grid scrolls inside its
  card on narrow screens.

## Project structure

```
app/                    Routes (App Router)
  layout.tsx            Header/footer shell; reads preference cookies server-side
  page.tsx              Home
  about/ wordle/ wordsearch/ settings/
components/
  layout/               Header, NavBar (hamburger menu), Footer
  phonemes/             PhonemeKey, PhonemeKeyboard, PhonemeWordChips
  wordle/               WordlePreview (playable)
  wordsearch/           WordSearchPreview (playable)
  ui/                   Card, GenerateButton
lib/
  phonemes.ts           HCE phoneme dataset + keyboard layout + hint helpers
  words.ts              90-word HCE corpus lists (replaced by DB in Assessment 2)
  wordle.ts             Wordle scoring logic
  wordsearch.ts         Seeded word-search grid generation
  preferences.ts        Theme/density types + cookie names (server-safe)
  settings.tsx          Client SettingsProvider (cookie persistence)
  generate/             Standalone HTML file builders (wordle, word search)
scripts/
  generate-samples.ts   Dev utility: writes sample outputs to ./samples
                        (npx tsx scripts/generate-samples.ts)
```

## The how-to-use video

Place the recorded walkthrough at `public/how-to-use.mp4`; it is embedded on
the About page.

## GitHub repository

Add the repository link here before submission:
`https://github.com/<username>/phoneme-activity-builder`
