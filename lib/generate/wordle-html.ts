/**
 * Builds the standalone, single-file phoneme Wordle activity.
 *
 * The output is plain HTML + vanilla JS so it runs from a normal browser
 * with no server or build step — teachers can email it or drop it on a USB.
 */

import { KEYBOARD_ROWS, PHONEMES, type Phoneme } from "../phonemes";
import type { PhonemeWord } from "../words";
import { embedJson, htmlShell, slugify } from "./shared";

export interface WordleConfig {
  title: string;
  word: PhonemeWord;
  attempts: number;
  /** Show mouse-over phonetic-to-English hints on the keyboard */
  showHints: boolean;
}

const WORDLE_CSS = `
  .board { display: grid; gap: 0.375rem; }
  .board-row { display: grid; gap: 0.375rem; grid-auto-flow: column; }
  .cell {
    width: 3.5rem; height: 3.5rem; border: 2px solid var(--border);
    border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;
    font-size: 1.35rem; font-weight: 700; background: var(--surface);
  }
  .cell.filled { border-color: var(--muted); }
  .cell.correct { background: var(--correct); border-color: var(--correct); color: #fff; }
  .cell.present { background: var(--present); border-color: var(--present); color: #fff; }
  .cell.absent  { background: var(--absent);  border-color: var(--absent);  color: #fff; }
  .kb { display: flex; flex-direction: column; gap: 0.35rem; align-items: center; width: 100%; }
  .kb-row { display: flex; flex-wrap: wrap; gap: 0.3rem; justify-content: center; }
  .key {
    min-width: 3rem; min-height: 3rem; padding: 0.25rem 0.4rem;
    border: 1px solid var(--border); border-radius: 0.5rem;
    background: var(--surface); color: var(--fg); cursor: pointer;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-size: 1rem; font-weight: 700; line-height: 1.1;
  }
  .key small { font-weight: 500; font-size: 0.65rem; color: var(--muted); }
  .key:hover { border-color: var(--accent); }
  .key:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .key.correct { background: var(--correct); border-color: var(--correct); color: #fff; }
  .key.correct small, .key.present small, .key.absent small { color: #e2e8f0; }
  .key.present { background: var(--present); border-color: var(--present); color: #fff; }
  .key.absent  { background: var(--absent);  border-color: var(--absent);  color: #fff; }
  .key.action { min-width: 4.5rem; background: var(--accent-soft); color: var(--fg); }
  .reveal { text-align: center; background: var(--surface); border: 1px solid var(--border);
    border-radius: 0.75rem; padding: 1rem; display: none; }
  .reveal.show { display: block; }
  .reveal .ipa { font-size: 1.5rem; font-weight: 700; }
  .reveal table { margin: 0.5rem auto 0; border-collapse: collapse; }
  .reveal td { padding: 0.2rem 0.75rem; border-bottom: 1px solid var(--border); }
`;

const WORDLE_JS = `
const target = CONFIG.word.phonemes;
const LEN = target.length;
let row = 0, current = [], finished = false;
const keyState = {}; // ipa -> correct | present | absent

const board = document.getElementById("board");
const status = document.getElementById("status");
const reveal = document.getElementById("reveal");

function buildBoard() {
  for (let r = 0; r < CONFIG.attempts; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "board-row";
    rowEl.setAttribute("role", "row");
    for (let c = 0; c < LEN; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.id = "cell-" + r + "-" + c;
      rowEl.appendChild(cell);
    }
    board.appendChild(rowEl);
  }
}

function renderCurrent() {
  for (let c = 0; c < LEN; c++) {
    const cell = document.getElementById("cell-" + row + "-" + c);
    cell.textContent = current[c] ? "/" + current[c] + "/" : "";
    cell.classList.toggle("filled", Boolean(current[c]));
  }
}

// Standard Wordle two-pass scoring so duplicate phonemes are handled fairly.
function score(guess) {
  const result = Array(LEN).fill("absent");
  const remaining = {};
  target.forEach((p, i) => {
    if (guess[i] === p) result[i] = "correct";
    else remaining[p] = (remaining[p] || 0) + 1;
  });
  guess.forEach((p, i) => {
    if (result[i] === "correct") return;
    if (remaining[p] > 0) { result[i] = "present"; remaining[p]--; }
  });
  return result;
}

const RANK = { absent: 0, present: 1, correct: 2 };

function submit() {
  if (finished) return;
  if (current.length < LEN) {
    status.textContent = "Add " + (LEN - current.length) + " more phoneme(s) before checking.";
    return;
  }
  const result = score(current);
  result.forEach((state, c) => {
    document.getElementById("cell-" + row + "-" + c).classList.add(state);
    const p = current[c];
    if (!keyState[p] || RANK[state] > RANK[keyState[p]]) keyState[p] = state;
    const key = document.querySelector('[data-ipa="' + p + '"]');
    if (key) { key.classList.remove("correct", "present", "absent"); key.classList.add(keyState[p]); }
  });
  if (result.every((s) => s === "correct")) return win();
  row++;
  current = [];
  if (row >= CONFIG.attempts) return lose();
  status.textContent = "Not quite — attempt " + (row + 1) + " of " + CONFIG.attempts + ".";
}

function equivalenceRows() {
  return CONFIG.word.phonemes.map((ipa) => {
    const info = CONFIG.keyboard.find((k) => k.ipa === ipa);
    return "<tr><td>/" + ipa + "/</td><td>" + (info ? info.label + " (as in " + info.example + ")" : "") + "</td></tr>";
  }).join("");
}

function showReveal(heading) {
  reveal.innerHTML = "<div>" + heading + "</div>" +
    '<div class="ipa">/' + CONFIG.word.phonemes.join("") + '/ = \\u201C' + CONFIG.word.english + '\\u201D</div>' +
    "<table><tbody>" + equivalenceRows() + "</tbody></table>";
  reveal.classList.add("show");
}

function win() {
  finished = true;
  status.textContent = "Correct! Well done!";
  status.className = "status win";
  showReveal("You solved it! The phoneme word was:");
}

function lose() {
  finished = true;
  status.textContent = "Out of attempts — here is the answer.";
  status.className = "status lose";
  showReveal("The phoneme word was:");
}

function press(ipa) {
  if (finished || current.length >= LEN) return;
  current.push(ipa);
  renderCurrent();
  status.textContent = "";
}

function backspace() {
  if (finished || current.length === 0) return;
  current.pop();
  renderCurrent();
}

function buildKeyboard() {
  const kb = document.getElementById("keyboard");
  // Keyboard rows follow the HCE layout from the course corpus.
  CONFIG.keyboardRows.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    row.forEach((ipa) => {
      const k = CONFIG.keyboard.find((p) => p.ipa === ipa);
      if (!k) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "key" + (CONFIG.showHints ? " hintable" : "");
      btn.dataset.ipa = k.ipa;
      const hint = "/" + k.ipa + "/ \\u2014 " + k.label + " (as in " + k.example + ")";
      if (CONFIG.showHints) {
        btn.dataset.hint = hint;
        btn.title = hint;
      }
      btn.setAttribute("aria-label", hint);
      btn.innerHTML = "/" + k.ipa + "/<small>" + k.label + "</small>";
      btn.addEventListener("click", () => press(k.ipa));
      rowEl.appendChild(btn);
    });
    kb.appendChild(rowEl);
  });

  const actions = document.createElement("div");
  actions.className = "kb-row";
  const del = document.createElement("button");
  del.type = "button"; del.className = "key action"; del.textContent = "Delete";
  del.addEventListener("click", backspace);
  const enter = document.createElement("button");
  enter.type = "button"; enter.className = "key action"; enter.textContent = "Check";
  enter.addEventListener("click", submit);
  actions.append(del, enter);
  kb.appendChild(actions);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submit();
  if (e.key === "Backspace") backspace();
});

buildBoard();
buildKeyboard();
`;

export function buildWordleHtml(config: WordleConfig): string {
  const keyboard = PHONEMES.map((p: Phoneme) => ({
    ipa: p.ipa,
    label: p.label,
    example: p.example,
    type: p.type,
  }));

  return htmlShell({
    title: config.title,
    subtitle: `Guess the hidden phoneme word in ${config.attempts} attempts. Tap the phoneme keys, then press Check.`,
    css: WORDLE_CSS,
    bodyMain: `
<div id="board" class="board" role="grid" aria-label="Guess board"></div>
<p id="status" class="status" role="status" aria-live="polite"></p>
<div id="reveal" class="reveal"></div>
<div id="keyboard" class="kb" aria-label="Phoneme keyboard"></div>`,
    configJson: embedJson({ ...config, keyboard, keyboardRows: KEYBOARD_ROWS }),
    script: WORDLE_JS,
    credit:
      "Phoneme Wordle — generated with the Phoneme Activity Builder · Reed Stelfox · 22813726",
  });
}

export function wordleFilename(config: WordleConfig): string {
  const slug = slugify(config.title);
  return slug.endsWith("wordle") ? `${slug}.html` : `${slug}-wordle.html`;
}
