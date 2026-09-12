/**
 * Cleans up typed phoneme input and explains mistakes in plain language.
 *
 * Teachers copy transcriptions from the course corpus, other IPA charts and
 * their own notes, so the same sound can arrive written several ways. This
 * module is shared by the API (validation) and the browser (bulk import):
 *
 *  1. It normalises typographic variants of the same symbol: the IPA script
 *     g and the keyboard g, a typed colon and the IPA length mark, the tʃ and
 *     dʒ ligatures, and stray slashes, brackets and stress marks.
 *  2. It splits a typed transcription into phonemes, using spaces when they
 *     are present and otherwise a greedy longest match against the HCE
 *     inventory.
 *  3. It suggests the HCE symbol a teacher probably meant when they type a
 *     common non-HCE (RP or US) symbol or a spelling digraph such as "sh".
 */

import { PHONEME_MAP, PHONEMES } from "./phonemes";

/** Longest symbols first, so tokenising prefers "tʃ" over "t" then "ʃ". */
const SYMBOLS_LONGEST_FIRST = PHONEMES.map((p) => p.ipa).sort(
  (a, b) => b.length - a.length
);

/** Slashes, brackets, stress marks and syllable dots carry no phoneme identity. */
const DECORATION = new RegExp("[/\\[\\]ˈˌ.]", "g");

/** Different ways of writing the same HCE symbol. */
const EQUIVALENTS: [from: string, to: string][] = [
  ["ɡ", "g"], // IPA script g (as printed in the corpus) to the keyboard g
  [":", "ː"], // typed colon to the IPA length mark, so "i:" becomes "iː"
  ["ʧ", "tʃ"], // tʃ ligature to t + ʃ
  ["ʤ", "dʒ"], // dʒ ligature to d + ʒ
];

/**
 * Common non-HCE symbols and spelling digraphs, mapped to the HCE phonemes
 * a teacher most likely meant. Keys are never valid HCE symbols themselves.
 */
const SUGGESTIONS: Record<string, string[]> = {
  // Letters and spelling patterns teachers often type
  r: ["ɹ"],
  y: ["j"],
  c: ["k"],
  q: ["k"],
  a: ["æ", "ɐ"],
  i: ["ɪ", "iː"],
  o: ["ɔ", "oː"],
  u: ["ɐ", "ʊ"],
  sh: ["ʃ"],
  ch: ["tʃ"],
  th: ["θ", "ð"],
  ng: ["ŋ"],
  zh: ["ʒ"],
  ee: ["iː"],
  oo: ["ʉː", "ʊ"],
  ar: ["ɐː"],
  or: ["oː"],
  er: ["ɜː"],
  ay: ["æɪ"],
  ai: ["æɪ"],
  igh: ["ɑe"],
  oy: ["oɪ"],
  oi: ["oɪ"],
  oa: ["əʉ"],
  ow: ["æɔ", "əʉ"],
  ou: ["æɔ"],
  ear: ["ɪə"],
  air: ["eː"],
  // RP and US IPA symbols that HCE writes differently
  ɾ: ["ɹ"],
  ʌ: ["ɐ"],
  ɒ: ["ɔ"],
  ɑ: ["ɐː"],
  ɑː: ["ɐː"],
  ɔː: ["oː"],
  uː: ["ʉː"],
  eɪ: ["æɪ"],
  aɪ: ["ɑe"],
  ɔɪ: ["oɪ"],
  əʊ: ["əʉ"],
  oʊ: ["əʉ"],
  aʊ: ["æɔ"],
  eə: ["eː"],
  ɛə: ["eː"],
  ɛ: ["e"],
  ɜ: ["ɜː"],
  ɚ: ["ə"],
  ɝ: ["ɜː"],
  iə: ["ɪə"],
};

/** Normalise one symbol: Unicode NFC, decoration removed, equivalents applied. */
export function normalizeSymbol(raw: string): string {
  let s = raw.normalize("NFC").replace(DECORATION, "").trim();
  for (const [from, to] of EQUIVALENTS) s = s.split(from).join(to);
  return s;
}

export function isHcePhoneme(symbol: string): boolean {
  return PHONEME_MAP.has(symbol);
}

/**
 * Split a typed transcription into phonemes.
 *
 * "tʃ ɪ n" and "tʃ, ɪ, n" split on the separators. "tʃɪn" or "/tʃɪn/" is
 * split by greedy longest match, giving tʃ + ɪ + n. Unknown characters
 * become tokens of their own so validation can report them by name.
 */
export function tokenizePhonemes(input: string): string[] {
  const cleaned = normalizeSymbol(input);
  if (!cleaned) return [];
  if (/[\s,]/.test(cleaned)) {
    return cleaned.split(/[\s,]+/).filter(Boolean);
  }
  const tokens: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const match = SYMBOLS_LONGEST_FIRST.find((sym) => cleaned.startsWith(sym, i));
    if (match) {
      tokens.push(match);
      i += match.length;
      continue;
    }
    const ch = String.fromCodePoint(cleaned.codePointAt(i)!);
    tokens.push(ch);
    i += ch.length;
  }
  return tokens;
}

function joinWithOr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}

/** A clear, teacher-friendly explanation of why a symbol was rejected. */
export function describeUnknownPhoneme(symbol: string): string {
  const options = SUGGESTIONS[symbol] ?? SUGGESTIONS[symbol.toLowerCase()];
  if (options?.length) {
    const described = options.map((s) => {
      const p = PHONEME_MAP.get(s);
      return p ? `/${s}/ (as in ${p.example})` : `/${s}/`;
    });
    return `"${symbol}" is not an HCE phoneme. Did you mean ${joinWithOr(described)}?`;
  }
  return `"${symbol}" is not an HCE phoneme. Use the phoneme keyboard, or see /api/phonemes for the full list.`;
}

export interface ParsedWord {
  english: string;
  phonemes: string[];
}

export interface ParseProblem {
  line: number;
  message: string;
}

const ENGLISH = /^[a-z][a-z' -]*$/i;

/** Split "english<sep>phonemes", falling back to "first word, then phonemes". */
function splitLine(line: string): { english: string; rest: string } | null {
  for (const sep of ["\t", "=", ",", ":"]) {
    const at = line.indexOf(sep);
    if (at > 0) {
      const english = line.slice(0, at).trim();
      const rest = line.slice(at + 1).trim();
      if (rest && ENGLISH.test(english)) return { english, rest };
    }
  }
  const m = line.match(/^(\S+)\s+(.+)$/);
  return m ? { english: m[1], rest: m[2] } : null;
}

/**
 * Parse pasted text with one word per line, for example:
 *
 *   chin: tʃ ɪ n
 *   boat = b əʉ t
 *   jam, dʒ æ m        (a spreadsheet row with a tab also works)
 *   frog f ɹ ɔ g       (no separator: the first word is the spelling)
 *
 * Blank lines and lines starting with # are skipped. Structural problems
 * are reported per line here; symbol validity is checked by the server.
 */
export function parseWordLines(text: string): {
  words: ParsedWord[];
  problems: ParseProblem[];
} {
  const words: ParsedWord[] = [];
  const problems: ParseProblem[] = [];

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    const lineNo = index + 1;
    if (!line || line.startsWith("#")) return;

    const parts = splitLine(line);
    if (!parts) {
      problems.push({
        line: lineNo,
        message: `Line ${lineNo}: add the phonemes after the word, for example "chin: tʃ ɪ n".`,
      });
      return;
    }
    if (!ENGLISH.test(parts.english)) {
      problems.push({
        line: lineNo,
        message: `Line ${lineNo}: "${parts.english}" is not an English spelling. Start the line with the word, for example "chin: tʃ ɪ n".`,
      });
      return;
    }
    const phonemes = tokenizePhonemes(parts.rest);
    if (phonemes.length === 0) {
      problems.push({ line: lineNo, message: `Line ${lineNo}: no phonemes found for "${parts.english}".` });
      return;
    }
    words.push({ english: parts.english.toLowerCase(), phonemes });
  });

  return { words, problems };
}
