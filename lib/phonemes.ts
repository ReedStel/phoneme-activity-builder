/**
 * HCE (Harrington, Cox & Evans) Australian English phoneme set, as specified
 * in the course corpus ("HCE Phoneme Word Lists for Wordle-style Puzzle
 * Construction").
 *
 * Each phoneme pairs an HCE/IPA symbol with the English letter equivalence a
 * Speech Pathology student would recognise, plus an example word so hints
 * can read "/θ/ — TH (as in thin)".
 */

export type PhonemeType = "consonant" | "vowel";

export interface Phoneme {
  /** HCE symbol without slashes, e.g. "θ" or "tʃ" */
  ipa: string;
  /** English letter equivalence shown to students, e.g. "TH" */
  label: string;
  /** Example word demonstrating the sound */
  example: string;
  type: PhonemeType;
}

export const PHONEMES: Phoneme[] = [
  // Consonants
  { ipa: "p", label: "P", example: "pond", type: "consonant" },
  { ipa: "t", label: "T", example: "tent", type: "consonant" },
  { ipa: "k", label: "K", example: "kick", type: "consonant" },
  { ipa: "b", label: "B", example: "bed", type: "consonant" },
  { ipa: "d", label: "D", example: "desk", type: "consonant" },
  { ipa: "g", label: "G", example: "gum", type: "consonant" },
  { ipa: "n", label: "N", example: "nose", type: "consonant" },
  { ipa: "m", label: "M", example: "milk", type: "consonant" },
  { ipa: "ŋ", label: "NG", example: "ring", type: "consonant" },
  { ipa: "f", label: "F", example: "fan", type: "consonant" },
  { ipa: "s", label: "S", example: "sun", type: "consonant" },
  { ipa: "θ", label: "TH", example: "thin", type: "consonant" },
  { ipa: "ʃ", label: "SH", example: "ship", type: "consonant" },
  { ipa: "v", label: "V", example: "van", type: "consonant" },
  { ipa: "z", label: "Z", example: "zip", type: "consonant" },
  { ipa: "ð", label: "TH", example: "then", type: "consonant" },
  { ipa: "ʒ", label: "ZH", example: "vision", type: "consonant" },
  { ipa: "l", label: "L", example: "log", type: "consonant" },
  { ipa: "ɹ", label: "R", example: "ring", type: "consonant" },
  { ipa: "w", label: "W", example: "win", type: "consonant" },
  { ipa: "j", label: "Y", example: "yes", type: "consonant" },
  { ipa: "h", label: "H", example: "hat", type: "consonant" },
  { ipa: "tʃ", label: "CH", example: "chin", type: "consonant" },
  { ipa: "dʒ", label: "J", example: "jam", type: "consonant" },
  // Monophthong vowels
  { ipa: "iː", label: "EE", example: "street", type: "vowel" },
  { ipa: "ɪ", label: "I", example: "bid", type: "vowel" },
  { ipa: "e", label: "E", example: "bed", type: "vowel" },
  { ipa: "eː", label: "AIR", example: "square", type: "vowel" },
  { ipa: "æ", label: "A", example: "bad", type: "vowel" },
  { ipa: "ɐ", label: "U", example: "bud", type: "vowel" },
  { ipa: "ɐː", label: "AR", example: "bark", type: "vowel" },
  { ipa: "ɜː", label: "ER", example: "bird", type: "vowel" },
  { ipa: "ʉː", label: "OO", example: "boot", type: "vowel" },
  { ipa: "ɔ", label: "O", example: "log", type: "vowel" },
  { ipa: "oː", label: "OR", example: "fork", type: "vowel" },
  { ipa: "ʊ", label: "OO", example: "book", type: "vowel" },
  // Diphthongs
  { ipa: "æɪ", label: "AY", example: "bait", type: "vowel" },
  { ipa: "ɑe", label: "IGH", example: "bike", type: "vowel" },
  { ipa: "oɪ", label: "OY", example: "boil", type: "vowel" },
  { ipa: "əʉ", label: "OA", example: "boat", type: "vowel" },
  { ipa: "æɔ", label: "OW", example: "cloud", type: "vowel" },
  { ipa: "ɪə", label: "EAR", example: "beard", type: "vowel" },
  { ipa: "ə", label: "A", example: "about", type: "vowel" },
];

/**
 * On-screen keyboard rows, matching the layout given in the course corpus
 * ("Keyboard for wɜːdəl"). Consonant rows first, then vowel rows.
 */
export const KEYBOARD_ROWS: string[][] = [
  ["p", "t", "k"],
  ["b", "d", "g"],
  ["n", "m", "ŋ"],
  ["f", "s", "θ", "ʃ"],
  ["v", "z", "ð", "ʒ"],
  ["l", "ɹ", "w", "j"],
  ["h", "tʃ", "dʒ"],
  ["iː", "ɪ", "e", "eː"],
  ["æ", "ɐ", "ɐː", "ɜː"],
  ["ʉː", "ɔ", "oː", "ʊ"],
  ["æɪ", "ɑe", "oɪ", "əʉ"],
  ["æɔ", "ɪə", "ə"],
];

export const PHONEME_MAP: ReadonlyMap<string, Phoneme> = new Map(
  PHONEMES.map((p) => [p.ipa, p])
);

/** "/θ/ — TH (as in thin)" */
export function hintFor(ipa: string): string {
  const p = PHONEME_MAP.get(ipa);
  if (!p) return `/${ipa}/`;
  return `/${p.ipa}/ — ${p.label} (as in ${p.example})`;
}

/** "/θɪn/" — a word rendered as a single IPA string */
export function ipaWord(phonemes: string[]): string {
  return `/${phonemes.join("")}/`;
}
