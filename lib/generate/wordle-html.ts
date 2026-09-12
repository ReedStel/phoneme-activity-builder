/**
 * Builds the standalone, single-file phoneme Wordle activity.
 *
 * The output is plain HTML and vanilla JS, so it runs in any browser with
 * no server or build step: teachers can email it or copy it to a USB stick.
 * When an activity has several words, students play them in order as
 * rounds and see how many they solved at the end.
 */

import { KEYBOARD_ROWS, PHONEMES } from "../phonemes";
import type { PhonemeWord } from "../words";
import { embedJson, htmlShell, slugify } from "./shared";

export interface WordleConfig {
  title: string;
  /** One or more words, played in order as separate rounds */
  words: PhonemeWord[];
  /** Guesses allowed for each word */
  attempts: number;
  /** Show mouse-over phonetic-to-English hints on the keyboard */
  showHints: boolean;
  /** Difficulty label chosen by the teacher, shown in the subtitle */
  difficulty?: string;
}

const WORDLE_CSS = `
  [hidden] { display: none !important; }
  .progress { margin: 0; font-weight: 600; color: var(--muted); text-align: center; }
  .board { display: grid; gap: 0.375rem; }
  .board-row { display: grid; gap: 0.375rem; grid-auto-flow: column; }
  .cell {
    width: 3.5rem; height: 3.5rem; border: 2px solid var(--border);
    border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;
    font-size: 1.35rem; font-weight: 700; background: var(--surface);
  }
  @media (max-width: 420px) { .cell { width: 2.9rem; height: 2.9rem; font-size: 1.1rem; } }
  .cell.filled { border-color: var(--muted); }
  .cell.correct { background: var(--correct); border-color: var(--correct); color: #fff; }
  .cell.present { background: var(--present); border-color: var(--present); color: #fff; }
  .cell.absent  { background: var(--absent);  border-color: var(--absent);  color: #fff; }
  .kb { display: flex; flex-direction: column; gap: 0.35rem; align-items: center; width: 100%; }
  .kb-row { display: flex; flex-wrap: wrap; gap: 0.3rem; justify-content: center; }
  .key {
    min-width: 3rem; min-height: 3rem; padding: 0.25rem 0.4rem;
    border: 1px solid var(--border); border-radius: 0.5rem;
    background: var(--surface); color: var(--fg);
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
  .next-btn { border: none; border-radius: 999px; background: var(--accent); color: var(--bg);
    padding: 0.65rem 1.5rem; font-size: 0.95rem; font-weight: 700; }
  .next-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
`;

const WORDLE_JS = `
const WORDS = CONFIG.words;
const RANK = { absent: 0, present: 1, correct: 2 };

let round = 0;
let solved = 0;
let target = [];
let LEN = 0;
let row = 0;
let current = [];
let finished = false;
const keyState = {}; // ipa -> correct | present | absent

const board = document.getElementById("board");
const status = document.getElementById("status");
const reveal = document.getElementById("reveal");
const progress = document.getElementById("progress");
const nextBtn = document.getElementById("next");

function escapeText(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

function buildBoard() {
  board.innerHTML = "";
  for (let r = 0; r < CONFIG.attempts; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "board-row";
    rowEl.setAttribute("role", "row");
    for (let c = 0; c < LEN; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.setAttribute("role", "gridcell");
      cell.id = "cell-" + r + "-" + c;
      rowEl.appendChild(cell);
    }
    board.appendChild(rowEl);
  }
}

function resetKeyboard() {
  Object.keys(keyState).forEach((k) => delete keyState[k]);
  document.querySelectorAll(".key[data-ipa]").forEach((k) => k.classList.remove("correct", "present", "absent"));
}

function startRound() {
  target = WORDS[round].phonemes;
  LEN = target.length;
  row = 0;
  current = [];
  finished = false;
  resetKeyboard();
  buildBoard();
  reveal.classList.remove("show");
  reveal.innerHTML = "";
  status.textContent = "";
  status.className = "status";
  nextBtn.hidden = true;
  progress.textContent =
    (WORDS.length > 1 ? "Word " + (round + 1) + " of " + WORDS.length + " \\u00B7 " : "") + LEN + " phonemes";
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

function submit() {
  if (finished) {
    if (!nextBtn.hidden) nextRound();
    return;
  }
  if (current.length < LEN) {
    status.textContent = "Add " + (LEN - current.length) + " more phoneme(s) before checking.";
    return;
  }
  const result = score(current);
  result.forEach((state, c) => {
    document.getElementById("cell-" + row + "-" + c).classList.add(state);
    const p = current[c];
    if (!keyState[p] || RANK[state] > RANK[keyState[p]]) keyState[p] = state;
    const key = document.querySelector('.key[data-ipa="' + p + '"]');
    if (key) { key.classList.remove("correct", "present", "absent"); key.classList.add(keyState[p]); }
  });
  if (result.every((s) => s === "correct")) return finishRound(true);
  row++;
  current = [];
  if (row >= CONFIG.attempts) return finishRound(false);
  status.textContent = "Not quite. Attempt " + (row + 1) + " of " + CONFIG.attempts + ".";
}

function equivalenceRows(word) {
  return word.phonemes.map((ipa) => {
    const info = CONFIG.keyboard.find((k) => k.ipa === ipa);
    return "<tr><td>/" + ipa + "/</td><td>" + (info ? info.label + " (as in " + info.example + ")" : "") + "</td></tr>";
  }).join("");
}

function showReveal(heading) {
  const word = WORDS[round];
  reveal.innerHTML = "<div>" + heading + "</div>" +
    '<div class="ipa">/' + word.phonemes.join("") + '/ = \\u201C' + escapeText(word.english) + '\\u201D</div>' +
    "<table><tbody>" + equivalenceRows(word) + "</tbody></table>";
  reveal.classList.add("show");
}

function finishRound(won) {
  finished = true;
  if (won) solved++;
  status.textContent = won ? "Correct! Well done!" : "Out of attempts. Here is the answer.";
  status.className = "status " + (won ? "win" : "lose");
  showReveal(won ? "You solved it! The phoneme word was:" : "The phoneme word was:");
  if (round < WORDS.length - 1) {
    nextBtn.hidden = false;
    nextBtn.focus();
  } else if (WORDS.length > 1) {
    progress.textContent = "All done! You solved " + solved + " of " + WORDS.length + " words.";
  }
}

function nextRound() {
  round++;
  startRound();
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
  CONFIG.keyboardRows.forEach((keys) => {
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    keys.forEach((ipa) => {
      const k = CONFIG.keyboard.find((p) => p.ipa === ipa);
      if (!k) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "key" + (CONFIG.showHints ? " hintable" : "");
      btn.dataset.ipa = k.ipa;
      const hint = "/" + k.ipa + "/: " + k.label + " (as in " + k.example + ")";
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

nextBtn.addEventListener("click", nextRound);

// Enter checks the guess and Backspace deletes. Enter is taken over so a
// focused phoneme key is not pressed as well; the Next, Delete and Check
// buttons keep their normal behaviour.
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (e.target.closest && e.target.closest("#next, .key.action")) return;
    e.preventDefault();
    submit();
  } else if (e.key === "Backspace") {
    e.preventDefault();
    backspace();
  }
});

buildKeyboard();
startRound();
`;

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildWordleHtml(config: WordleConfig): string {
  const keyboard = PHONEMES.map((p) => ({
    ipa: p.ipa,
    label: p.label,
    example: p.example,
    type: p.type,
  }));
  const count = config.words.length;
  const level = config.difficulty ? `${capitalise(config.difficulty)} level. ` : "";
  const task =
    count > 1
      ? `Guess each of the ${count} hidden phoneme words in ${config.attempts} attempts.`
      : `Guess the hidden phoneme word in ${config.attempts} attempts.`;

  return htmlShell({
    title: config.title,
    subtitle: `${level}${task} Tap the phoneme keys, then press Check.`,
    css: WORDLE_CSS,
    bodyMain: `
<p id="progress" class="progress" aria-live="polite"></p>
<div id="board" class="board" role="grid" aria-label="Guess board"></div>
<p id="status" class="status" role="status" aria-live="polite"></p>
<div id="reveal" class="reveal" aria-live="polite"></div>
<button id="next" type="button" class="next-btn" hidden>Next word</button>
<div id="keyboard" class="kb" aria-label="Phoneme keyboard"></div>`,
    configJson: embedJson({
      title: config.title,
      words: config.words,
      attempts: config.attempts,
      showHints: config.showHints,
      keyboard,
      keyboardRows: KEYBOARD_ROWS,
    }),
    script: WORDLE_JS,
    credit: "Phoneme Wordle · made with the Phoneme Activity Builder · Reed Stelfox · 22813726",
  });
}

export function wordleFilename(config: Pick<WordleConfig, "title">): string {
  const slug = slugify(config.title);
  return slug.endsWith("wordle") ? `${slug}.html` : `${slug}-wordle.html`;
}
