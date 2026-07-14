/**
 * Word lists from the course corpus ("HCE Phoneme Word Lists for
 * Wordle-style Puzzle Construction") — broad HCE transcription, one phoneme
 * per cell. 30 words each of 3, 4 and 5 phonemes; word length is the
 * Wordle difficulty setting.
 *
 * Assessment 1 uses these fixed lists; Assessment 2 will replace them with a
 * database-driven word list, which is why they live in one module.
 */

export interface PhonemeWord {
  /** English spelling shown when the answer is revealed */
  english: string;
  /** The word as an ordered sequence of HCE phoneme symbols */
  phonemes: string[];
}

export const WORDS_3: PhonemeWord[] = [
  { english: "bed", phonemes: ["b", "e", "d"] },
  { english: "bid", phonemes: ["b", "ɪ", "d"] },
  { english: "bad", phonemes: ["b", "æ", "d"] },
  { english: "bud", phonemes: ["b", "ɐ", "d"] },
  { english: "bird", phonemes: ["b", "ɜː", "d"] },
  { english: "bark", phonemes: ["b", "ɐː", "k"] },
  { english: "book", phonemes: ["b", "ʊ", "k"] },
  { english: "boot", phonemes: ["b", "ʉː", "t"] },
  { english: "boat", phonemes: ["b", "əʉ", "t"] },
  { english: "bike", phonemes: ["b", "ɑe", "k"] },
  { english: "bait", phonemes: ["b", "æɪ", "t"] },
  { english: "boil", phonemes: ["b", "oɪ", "l"] },
  { english: "beard", phonemes: ["b", "ɪə", "d"] },
  { english: "choice", phonemes: ["tʃ", "oɪ", "s"] },
  { english: "thin", phonemes: ["θ", "ɪ", "n"] },
  { english: "then", phonemes: ["ð", "e", "n"] },
  { english: "ship", phonemes: ["ʃ", "ɪ", "p"] },
  { english: "chin", phonemes: ["tʃ", "ɪ", "n"] },
  { english: "jam", phonemes: ["dʒ", "æ", "m"] },
  { english: "yes", phonemes: ["j", "e", "s"] },
  { english: "win", phonemes: ["w", "ɪ", "n"] },
  { english: "ring", phonemes: ["ɹ", "ɪ", "ŋ"] },
  { english: "log", phonemes: ["l", "ɔ", "g"] },
  { english: "fan", phonemes: ["f", "æ", "n"] },
  { english: "van", phonemes: ["v", "æ", "n"] },
  { english: "sun", phonemes: ["s", "ɐ", "n"] },
  { english: "zip", phonemes: ["z", "ɪ", "p"] },
  { english: "gum", phonemes: ["g", "ɐ", "m"] },
  { english: "hat", phonemes: ["h", "æ", "t"] },
  { english: "fork", phonemes: ["f", "oː", "k"] },
];

export const WORDS_4: PhonemeWord[] = [
  { english: "stop", phonemes: ["s", "t", "ɔ", "p"] },
  { english: "frog", phonemes: ["f", "ɹ", "ɔ", "g"] },
  { english: "clap", phonemes: ["k", "l", "æ", "p"] },
  { english: "slip", phonemes: ["s", "l", "ɪ", "p"] },
  { english: "drum", phonemes: ["d", "ɹ", "ɐ", "m"] },
  { english: "grin", phonemes: ["g", "ɹ", "ɪ", "n"] },
  { english: "train", phonemes: ["t", "ɹ", "æɪ", "n"] },
  { english: "cloud", phonemes: ["k", "l", "æɔ", "d"] },
  { english: "snake", phonemes: ["s", "n", "æɪ", "k"] },
  { english: "smile", phonemes: ["s", "m", "ɑe", "l"] },
  { english: "milk", phonemes: ["m", "ɪ", "l", "k"] },
  { english: "hand", phonemes: ["h", "æ", "n", "d"] },
  { english: "tent", phonemes: ["t", "e", "n", "t"] },
  { english: "jump", phonemes: ["dʒ", "ɐ", "m", "p"] },
  { english: "lamp", phonemes: ["l", "æ", "m", "p"] },
  { english: "bank", phonemes: ["b", "æ", "ŋ", "k"] },
  { english: "frame", phonemes: ["f", "ɹ", "æɪ", "m"] },
  { english: "cold", phonemes: ["k", "əʉ", "l", "d"] },
  { english: "wind", phonemes: ["w", "ɪ", "n", "d"] },
  { english: "soft", phonemes: ["s", "ɔ", "f", "t"] },
  { english: "gift", phonemes: ["g", "ɪ", "f", "t"] },
  { english: "desk", phonemes: ["d", "e", "s", "k"] },
  { english: "left", phonemes: ["l", "e", "f", "t"] },
  { english: "pond", phonemes: ["p", "ɔ", "n", "d"] },
  { english: "golf", phonemes: ["g", "ɔ", "l", "f"] },
  { english: "silk", phonemes: ["s", "ɪ", "l", "k"] },
  { english: "great", phonemes: ["g", "ɹ", "æɪ", "t"] },
  { english: "crab", phonemes: ["k", "ɹ", "æ", "b"] },
  { english: "plug", phonemes: ["p", "l", "ɐ", "g"] },
  { english: "quiz", phonemes: ["k", "w", "ɪ", "z"] },
];

export const WORDS_5: PhonemeWord[] = [
  { english: "stamp", phonemes: ["s", "t", "æ", "m", "p"] },
  { english: "plant", phonemes: ["p", "l", "æ", "n", "t"] },
  { english: "blank", phonemes: ["b", "l", "æ", "ŋ", "k"] },
  { english: "grand", phonemes: ["g", "ɹ", "æ", "n", "d"] },
  { english: "clamp", phonemes: ["k", "l", "æ", "m", "p"] },
  { english: "twist", phonemes: ["t", "w", "ɪ", "s", "t"] },
  { english: "trust", phonemes: ["t", "ɹ", "ɐ", "s", "t"] },
  { english: "drink", phonemes: ["d", "ɹ", "ɪ", "ŋ", "k"] },
  { english: "brisk", phonemes: ["b", "ɹ", "ɪ", "s", "k"] },
  { english: "shrimp", phonemes: ["ʃ", "ɹ", "ɪ", "m", "p"] },
  { english: "scrap", phonemes: ["s", "k", "ɹ", "æ", "p"] },
  { english: "scribe", phonemes: ["s", "k", "ɹ", "ɑe", "b"] },
  { english: "scream", phonemes: ["s", "k", "ɹ", "iː", "m"] },
  { english: "splash", phonemes: ["s", "p", "l", "æ", "ʃ"] },
  { english: "spring", phonemes: ["s", "p", "ɹ", "ɪ", "ŋ"] },
  { english: "strap", phonemes: ["s", "t", "ɹ", "æ", "p"] },
  { english: "street", phonemes: ["s", "t", "ɹ", "iː", "t"] },
  { english: "scrub", phonemes: ["s", "k", "ɹ", "ɐ", "b"] },
  { english: "flask", phonemes: ["f", "l", "ɐː", "s", "k"] },
  { english: "clasp", phonemes: ["k", "l", "ɐː", "s", "p"] },
  { english: "cleft", phonemes: ["k", "l", "e", "f", "t"] },
  { english: "glint", phonemes: ["g", "l", "ɪ", "n", "t"] },
  { english: "blend", phonemes: ["b", "l", "e", "n", "d"] },
  { english: "strain", phonemes: ["s", "t", "ɹ", "æɪ", "n"] },
  { english: "thrust", phonemes: ["θ", "ɹ", "ɐ", "s", "t"] },
  { english: "sprawl", phonemes: ["s", "p", "ɹ", "oː", "l"] },
  { english: "scrawl", phonemes: ["s", "k", "ɹ", "oː", "l"] },
  { english: "sprig", phonemes: ["s", "p", "ɹ", "ɪ", "g"] },
  { english: "sprout", phonemes: ["s", "p", "ɹ", "æɔ", "t"] },
  { english: "smoked", phonemes: ["s", "m", "əʉ", "k", "t"] },
];

/** Wordle target-word presets grouped by difficulty (phoneme count). */
export const WORDLE_GROUPS: { label: string; words: PhonemeWord[] }[] = [
  { label: "3 phonemes (easier)", words: WORDS_3 },
  { label: "4 phonemes", words: WORDS_4 },
  { label: "5 phonemes (harder)", words: WORDS_5 },
];

/** Flat list used to look a preset up by its English spelling. */
export const ALL_WORDS: PhonemeWord[] = [...WORDS_3, ...WORDS_4, ...WORDS_5];

/**
 * Fixed small word list used to generate the Word Search activity,
 * mirroring the example puzzle provided with the assessment.
 */
export const WORDSEARCH_WORDS: PhonemeWord[] = [
  ALL_WORDS.find((w) => w.english === "chin")!,
  ALL_WORDS.find((w) => w.english === "jam")!,
  ALL_WORDS.find((w) => w.english === "bad")!,
  ALL_WORDS.find((w) => w.english === "log")!,
  ALL_WORDS.find((w) => w.english === "ring")!,
];
