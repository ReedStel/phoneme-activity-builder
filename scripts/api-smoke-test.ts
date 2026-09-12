/**
 * End-to-end API smoke test.
 *
 * Exercises every CRUD path plus the validation and error-handling rules
 * against a running server, and prints a pass or fail line for each case.
 * It creates its own word list and deletes it at the end, so it leaves the
 * teacher's data untouched.
 *
 * Usage:  npm run dev          (in one terminal)
 *         npm run test:api     (in another)
 *
 * Test the Docker container instead by pointing it at the container:
 *         BASE_URL=http://localhost:3000 npm run test:api
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? `  (${detail})` : ""}`);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function req(
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; json: any; text: string }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Not JSON (for example the generated HTML file).
  }
  return { status: res.status, json, text };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const details = (r: { json: { details?: string[] } | null }) => JSON.stringify(r.json?.details ?? []);

async function main() {
  console.log(`\nAPI smoke test against ${BASE}\n`);

  console.log("Health check");
  const health = await req("GET", "/health");
  check("GET /health returns 200 OK", health.status === 200, `got ${health.status}`);
  check("health reports the database is ok", health.json?.database === "ok");

  console.log("\nPhoneme inventory");
  const phonemes = await req("GET", "/api/phonemes");
  check("GET /api/phonemes returns 200", phonemes.status === 200);
  check("inventory holds the 43 HCE phonemes", phonemes.json?.length === 43, `got ${phonemes.json?.length}`);
  check(
    "multi-character phonemes are stored intact",
    phonemes.json?.some((p: { symbol: string }) => p.symbol === "tʃ") &&
      phonemes.json?.some((p: { symbol: string }) => p.symbol === "əʉ")
  );

  console.log("\nWord list CRUD");
  const created = await req("POST", "/api/word-lists", {
    name: "Smoke test list",
    description: "Created by the API smoke test",
    words: [{ english: "chin", phonemes: ["tʃ", "ɪ", "n"] }],
  });
  check("POST /api/word-lists creates a list (201)", created.status === 201, `got ${created.status}`);
  const listId: number = created.json?.id;
  const chinId: number = created.json?.words?.[0]?.id;
  check("initial word stored with its phonemes", created.json?.words?.[0]?.phonemes?.join("") === "tʃɪn");

  const read = await req("GET", `/api/word-lists/${listId}`);
  check("GET /api/word-lists/:id returns the list", read.status === 200 && read.json?.id === listId);

  const renamed = await req("PATCH", `/api/word-lists/${listId}`, { name: "Renamed smoke list" });
  check("PATCH renames the list", renamed.status === 200 && renamed.json?.name === "Renamed smoke list");

  const blankName = await req("PATCH", `/api/word-lists/${listId}`, { name: "   " });
  check("blank list name is rejected (400)", blankName.status === 400, `got ${blankName.status}`);

  console.log("\nWord CRUD");
  const addWord = await req("POST", `/api/word-lists/${listId}/words`, {
    english: "boat",
    phonemes: ["b", "əʉ", "t"],
  });
  check("POST adds a word with a two-character phoneme (201)", addWord.status === 201, `got ${addWord.status}`);
  const wordId: number = addWord.json?.id;
  check("stored phonemes round-trip exactly", addWord.json?.phonemes?.join("") === "bəʉt");

  const updated = await req("PATCH", `/api/words/${wordId}`, { english: "bait", phonemes: ["b", "æɪ", "t"] });
  check("PATCH updates spelling and phonemes", updated.status === 200 && updated.json?.english === "bait");
  check("phoneme sequence was replaced", updated.json?.phonemes?.join("") === "bæɪt");

  const readWord = await req("GET", `/api/words/${wordId}`);
  check("GET /api/words/:id reflects the update", readWord.json?.english === "bait");

  const dupAdd = await req("POST", `/api/word-lists/${listId}/words`, { english: "chin", phonemes: ["tʃ", "ɪ", "n"] });
  check("adding a spelling already in the list is rejected (409)", dupAdd.status === 409, `got ${dupAdd.status}`);

  const dupRename = await req("PATCH", `/api/words/${wordId}`, { english: "chin" });
  check("renaming to an existing spelling is rejected (409)", dupRename.status === 409, `got ${dupRename.status}`);

  const deleted = await req("DELETE", `/api/words/${wordId}`);
  check("DELETE removes the word", deleted.status === 200);
  const gone = await req("GET", `/api/words/${wordId}`);
  check("deleted word now returns 404", gone.status === 404, `got ${gone.status}`);

  console.log("\nPhoneme clean-up and validation");
  const scriptG = await req("POST", `/api/word-lists/${listId}/words`, { english: "fog", phonemes: ["f", "ɔ", "ɡ"] });
  check("IPA script g is normalised to the keyboard g", scriptG.json?.phonemes?.join("") === "fɔg", scriptG.json?.phonemes?.join(""));
  const colon = await req("POST", `/api/word-lists/${listId}/words`, { english: "see", phonemes: ["s", "i:"] });
  check("a typed colon becomes the IPA length mark", colon.json?.phonemes?.join("") === "siː", colon.json?.phonemes?.join(""));

  const unknown = await req("POST", `/api/word-lists/${listId}/words`, { english: "oops", phonemes: ["b", "ZZ", "t"] });
  check("unknown phoneme is rejected (400)", unknown.status === 400, `got ${unknown.status}`);
  check("error names the offending symbol", details(unknown).includes("ZZ"));

  const rPhoneme = await req("POST", `/api/word-lists/${listId}/words`, { english: "rat", phonemes: ["r", "æ", "t"] });
  check("non-HCE 'r' is rejected with a 'Did you mean /ɹ/' hint", rPhoneme.status === 400 && details(rPhoneme).includes("/ɹ/"));

  const badEnglish = await req("POST", `/api/word-lists/${listId}/words`, { english: "12!!", phonemes: ["b"] });
  check("invalid English spelling is rejected (400)", badEnglish.status === 400);

  const emptyPhonemes = await req("POST", `/api/word-lists/${listId}/words`, { english: "empty", phonemes: [] });
  check("empty phoneme list is rejected (400)", emptyPhonemes.status === 400);

  const stringPhonemes = await req("POST", `/api/word-lists/${listId}/words`, { english: "text", phonemes: "t e k s t" });
  check("phonemes sent as a string instead of a list are rejected (400)", stringPhonemes.status === 400);

  const malformed = await fetch(`${BASE}/api/word-lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not json",
  });
  check("malformed JSON is rejected (400)", malformed.status === 400, `got ${malformed.status}`);

  const badId = await req("GET", "/api/words/abc");
  check("non-numeric id is rejected (400)", badId.status === 400, `got ${badId.status}`);

  const missing = await req("GET", "/api/word-lists/999999");
  check("missing record returns 404", missing.status === 404, `got ${missing.status}`);

  console.log("\nBulk import");
  const bulk = await req("POST", `/api/word-lists/${listId}/words`, {
    words: [
      { english: "jam", phonemes: ["dʒ", "æ", "m"] },
      { english: "ring", phonemes: ["ɹ", "ɪ", "ŋ"] },
      { english: "ship", phonemes: ["ʃ", "ɪ", "p"] },
    ],
  });
  check("bulk import creates several words (201)", bulk.status === 201 && bulk.json?.created === 3, `got ${bulk.status}`);

  const badBulk = await req("POST", `/api/word-lists/${listId}/words`, {
    words: [
      { english: "win", phonemes: ["w", "ɪ", "n"] },
      { english: "rug", phonemes: ["r", "ɐ", "g"] },
    ],
  });
  check("bulk import with one bad word is rejected (400)", badBulk.status === 400, `got ${badBulk.status}`);
  check("the error says which word was wrong", details(badBulk).includes("Word 2"));
  const afterBad = await req("GET", `/api/word-lists/${listId}`);
  check(
    "bulk import is all-or-nothing (the good word was not stored)",
    !afterBad.json?.words?.some((w: { english: string }) => w.english === "win")
  );

  const byEnglish = (english: string): number =>
    afterBad.json?.words?.find((w: { english: string; id: number }) => w.english === english)?.id;
  const shipId = byEnglish("ship");
  const jamId = byEnglish("jam");
  const ringId = byEnglish("ring");
  const fogId = byEnglish("fog");

  console.log("\nActivity configuration CRUD");
  const wordle = await req("POST", "/api/activities", {
    title: "Smoke test wordle",
    type: "WORDLE",
    difficulty: "easy",
    wordListId: listId,
    wordIds: [chinId, shipId],
    attempts: 5,
  });
  check("POST creates a two-word Wordle (201)", wordle.status === 201, `got ${wordle.status} ${details(wordle)}`);
  const wordleId: number = wordle.json?.id;
  check("activity keeps the chosen word order", wordle.json?.words?.map((w: { english: string }) => w.english).join(",") === "chin,ship");

  const noWords = await req("POST", "/api/activities", { title: "No words", type: "WORDLE", wordListId: listId, wordIds: [] });
  check("activity with no words is rejected (400)", noWords.status === 400);

  const tooFew = await req("POST", "/api/activities", {
    title: "Too few",
    type: "WORDSEARCH",
    wordListId: listId,
    wordIds: [chinId, shipId],
  });
  check("Word Search with fewer than 3 words is rejected (400)", tooFew.status === 400);

  const lists = await req("GET", "/api/word-lists");
  const otherList = lists.json?.find((l: { id: number; wordCount: number }) => l.id !== listId && l.wordCount > 0);
  const otherListFull = otherList ? await req("GET", `/api/word-lists/${otherList.id}`) : null;
  const foreignWordId: number | undefined = otherListFull?.json?.words?.[0]?.id;
  const foreign = await req("POST", "/api/activities", {
    title: "Foreign word",
    type: "WORDLE",
    wordListId: listId,
    wordIds: [chinId, foreignWordId],
  });
  check("a word from a different list is rejected (400)", foreign.status === 400, `got ${foreign.status}`);

  const search = await req("POST", "/api/activities", {
    title: "Smoke test word search",
    type: "WORDSEARCH",
    wordListId: listId,
    wordIds: [chinId, jamId, ringId, fogId],
    gridSize: 8,
  });
  check("POST creates a Word Search (201)", search.status === 201, `got ${search.status} ${details(search)}`);
  const searchId: number = search.json?.id;

  const patched = await req("PATCH", `/api/activities/${wordleId}`, { attempts: 6, wordIds: [shipId, chinId] });
  check("PATCH updates settings", patched.status === 200 && patched.json?.attempts === 6);
  check("PATCH reorders the words", patched.json?.words?.[0]?.english === "ship");

  const onlyWordles = await req("GET", "/api/activities?type=WORDLE");
  check(
    "GET ?type=WORDLE filters by activity type",
    onlyWordles.json?.some((a: { id: number }) => a.id === wordleId) &&
      !onlyWordles.json?.some((a: { id: number }) => a.id === searchId)
  );
  const badType = await req("GET", "/api/activities?type=CROSSWORD");
  check("unknown activity type filter is rejected (400)", badType.status === 400);

  console.log("\nHTML generation from database data");
  const genWordle = await req("GET", `/api/activities/${wordleId}/generate?inline=1`);
  check("Wordle generate returns 200", genWordle.status === 200, `got ${genWordle.status}`);
  check("output is a standalone HTML document", genWordle.text.startsWith("<!DOCTYPE html>"));
  check(
    "output embeds every stored word in order",
    genWordle.text.indexOf('"english":"ship"') > -1 &&
      genWordle.text.indexOf('"english":"ship"') < genWordle.text.indexOf('"english":"chin"')
  );
  check("output reflects the saved attempts setting", genWordle.text.includes('"attempts":6'));

  const download = await fetch(`${BASE}/api/activities/${wordleId}/generate`);
  check(
    "generate sends the file as a download",
    (download.headers.get("content-disposition") ?? "").includes("attachment")
  );

  const genSearch = await req("GET", `/api/activities/${searchId}/generate?inline=1`);
  check("Word Search generate returns 200", genSearch.status === 200, `got ${genSearch.status}`);

  await req("DELETE", `/api/words/${fogId}`);
  await req("DELETE", `/api/words/${jamId}`);
  const shrunk = await req("GET", `/api/activities/${searchId}/generate?inline=1`);
  check(
    "deleting words from a saved Word Search gives a clear error, not a crash",
    shrunk.status === 400 && details(shrunk).includes("needs 3 to 12 words"),
    `got ${shrunk.status}`
  );

  console.log("\nCleanup");
  const delList = await req("DELETE", `/api/word-lists/${listId}`);
  check("DELETE removes the list", delList.status === 200);
  const cascade = await req("GET", `/api/activities/${wordleId}`);
  check("activities are deleted with their list", cascade.status === 404, `got ${cascade.status}`);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\nSmoke test could not run:", err.message);
  console.error(`Is the server running on ${BASE}?`);
  process.exit(1);
});
