/**
 * Builds the standalone, single-file phoneme Word Search activity.
 *
 * The exact grid shown in the builder preview is embedded (via the shared
 * seed-generated grid), so what the teacher previews is what students play.
 */

import { PHONEME_MAP } from "../phonemes";
import type { PhonemeWord } from "../words";
import type { WordSearchGrid } from "../wordsearch";
import { embedJson, htmlShell, slugify } from "./shared";

export interface WordSearchConfig {
  title: string;
  words: PhonemeWord[];
  gridSize: number;
  allowDiagonals: boolean;
  showHints: boolean;
  seed: number;
}

const WS_CSS = `
  .grid-wrap { max-width: 100%; overflow-x: auto; padding-bottom: 0.25rem; }
  .ws-grid { display: grid; gap: 0.25rem; width: max-content; }
  .ws-cell {
    width: 2.6rem; height: 2.6rem; border: 1px solid var(--border);
    border-radius: 0.375rem; background: var(--surface); color: var(--fg);
    font-size: 0.95rem; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  @media (max-width: 480px) { .ws-cell { width: 2.1rem; height: 2.1rem; font-size: 0.8rem; } }
  .ws-cell:hover { border-color: var(--accent); }
  .ws-cell:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
  .ws-cell.sel { background: var(--accent-soft); border-color: var(--accent); }
  .ws-cell.found { background: var(--found); color: var(--found-fg); border-color: var(--found-fg); }
  .ws-cell.sol { background: var(--accent-soft); border-color: var(--present); }
  .answers-btn {
    border: 1px solid var(--border); border-radius: 0.5rem; background: var(--surface);
    color: var(--fg); padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 600; cursor: pointer;
  }
  .answers-btn:hover { border-color: var(--accent); }
  .word-list { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; list-style: none; padding: 0; margin: 0; }
  .word-list li {
    border: 1px solid var(--border); border-radius: 999px; padding: 0.35rem 0.9rem;
    background: var(--surface); font-weight: 600;
  }
  .word-list li.found { background: var(--found); color: var(--found-fg); text-decoration: line-through; }
  .word-list li .eng { font-weight: 500; }
  .help { color: var(--muted); font-size: 0.85rem; text-align: center; margin: 0; }
`;

const WS_JS = `
const found = new Set();
let start = null;
const gridEl = document.getElementById("grid");
const status = document.getElementById("status");
gridEl.style.gridTemplateColumns = "repeat(" + CONFIG.gridSize + ", auto)";

function hintText(ipa) {
  const h = CONFIG.hints[ipa];
  return h ? "/" + ipa + "/ \\u2014 " + h : "/" + ipa + "/";
}

function buildGrid() {
  CONFIG.grid.forEach((rowArr, r) => {
    rowArr.forEach((ipa, c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ws-cell" + (CONFIG.showHints ? " hintable" : "");
      btn.dataset.r = r; btn.dataset.c = c;
      btn.textContent = ipa;
      const hint = hintText(ipa);
      if (CONFIG.showHints) { btn.dataset.hint = hint; btn.title = hint; }
      btn.setAttribute("aria-label", "Row " + (r + 1) + ", column " + (c + 1) + ": " + hint);
      btn.addEventListener("click", () => onCell(r, c, btn));
      gridEl.appendChild(btn);
    });
  });
}

function cellEl(r, c) {
  return gridEl.querySelector('[data-r="' + r + '"][data-c="' + c + '"]');
}

// Selection model: click the first phoneme of a word, then the last one.
function onCell(r, c, btn) {
  if (!start) {
    start = [r, c];
    btn.classList.add("sel");
    status.textContent = "Now click the LAST phoneme of the word.";
    return;
  }
  const path = straightPath(start, [r, c]);
  clearSelection();
  start = null;
  if (!path) {
    status.textContent = "Selections must be in a straight line — try again.";
    return;
  }
  checkPath(path);
}

function clearSelection() {
  gridEl.querySelectorAll(".sel").forEach((el) => el.classList.remove("sel"));
}

function straightPath(a, b) {
  const dr = Math.sign(b[0] - a[0]);
  const dc = Math.sign(b[1] - a[1]);
  const len = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) + 1;
  const straight =
    (dr === 0 || dc === 0 || Math.abs(b[0] - a[0]) === Math.abs(b[1] - a[1]));
  if (!straight) return null;
  const path = [];
  for (let i = 0; i < len; i++) path.push([a[0] + dr * i, a[1] + dc * i]);
  return path;
}

function samePath(a, b) {
  return a.length === b.length && a.every((cell, i) => cell[0] === b[i][0] && cell[1] === b[i][1]);
}

function checkPath(path) {
  const reversed = [...path].reverse();
  for (const placement of CONFIG.placements) {
    if (found.has(placement.word.english)) continue;
    if (samePath(path, placement.cells) || samePath(reversed, placement.cells)) {
      markFound(placement);
      return;
    }
  }
  status.textContent = "That is not one of the hidden words — keep looking!";
}

function markFound(placement) {
  found.add(placement.word.english);
  placement.cells.forEach(([r, c]) => cellEl(r, c).classList.add("found"));
  const li = document.getElementById("word-" + placement.word.english);
  li.classList.add("found");
  li.innerHTML = "/" + placement.word.phonemes.join("") + '/ <span class="eng">= \\u201C' + placement.word.english + '\\u201D</span>';
  if (found.size === CONFIG.placements.length) {
    status.textContent = "Fantastic! You found all " + CONFIG.placements.length + " phoneme words!";
    status.className = "status win";
  } else {
    status.textContent = "Found /" + placement.word.phonemes.join("") + "/ (\\u201C" + placement.word.english + "\\u201D). " +
      (CONFIG.placements.length - found.size) + " to go.";
  }
}

function buildWordList() {
  const list = document.getElementById("words");
  CONFIG.placements.forEach((p) => {
    const li = document.createElement("li");
    li.id = "word-" + p.word.english;
    li.textContent = "/" + p.word.phonemes.join("") + "/";
    list.appendChild(li);
  });
}

// Teacher aid: toggle a highlight over every placed word.
let answersShown = false;
document.getElementById("answers").addEventListener("click", (e) => {
  answersShown = !answersShown;
  e.target.textContent = answersShown ? "Hide answers" : "Show answers";
  e.target.setAttribute("aria-pressed", String(answersShown));
  CONFIG.placements.forEach((p) => {
    p.cells.forEach(([r, c]) => cellEl(r, c).classList.toggle("sol", answersShown));
  });
});

buildGrid();
buildWordList();
`;

export function buildWordSearchHtml(
  config: WordSearchConfig,
  generated: WordSearchGrid
): string {
  // Only ship the hints actually used on this grid.
  const hints: Record<string, string> = {};
  for (const row of generated.grid) {
    for (const ipa of row) {
      const p = PHONEME_MAP.get(ipa);
      if (p) hints[ipa] = `${p.label} (as in ${p.example})`;
    }
  }

  return htmlShell({
    title: config.title,
    subtitle:
      "Find every phoneme word hidden in the grid. Click the first phoneme of a word, then the last one.",
    css: WS_CSS,
    bodyMain: `
<ul id="words" class="word-list" aria-label="Words to find"></ul>
<div class="grid-wrap"><div id="grid" class="ws-grid" role="grid" aria-label="Word search grid"></div></div>
<p id="status" class="status" role="status" aria-live="polite"></p>
<button id="answers" type="button" class="answers-btn" aria-pressed="false">Show answers</button>
<p class="help">Hover over any phoneme to see its English letter equivalence.</p>`,
    configJson: embedJson({
      gridSize: generated.size,
      grid: generated.grid,
      placements: generated.placements,
      showHints: config.showHints,
      hints,
    }),
    script: WS_JS,
    credit:
      "Phoneme Word Search — generated with the Phoneme Activity Builder · Reed Stelfox · 22813726",
  });
}

export function wordSearchFilename(config: WordSearchConfig): string {
  const slug = slugify(config.title);
  return slug.endsWith("word-search")
    ? `${slug}.html`
    : `${slug}-word-search.html`;
}
