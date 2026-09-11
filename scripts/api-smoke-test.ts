/**
 * End-to-end API smoke test.
 *
 * Exercises every CRUD path plus the validation and error-handling rules
 * against a running server, and prints a pass/fail line for each case.
 *
 * Usage:  npm run dev      (in one terminal)
 *         npm run test:api (in another)
 *
 * Override the target with BASE_URL, e.g. when testing the Docker container:
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
    console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function req(
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; json: any; text: string }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON response (e.g. generated HTML) */
  }
  return { status: res.status, json, text };
}

async function main() {
  console.log(`\nAPI smoke test against ${BASE}\n`);

  // ---- Health -------------------------------------------------------------
  console.log("Health check");
  const health = await req("GET", "/health");
  check("GET /health returns 200", health.status === 200, `got ${health.status}`);
  check("health reports database ok", health.json?.database === "ok");

  // ---- Reference data -----------------------------------------------------
  console.log("\nPhoneme inventory");
  const phonemes = await req("GET", "/api/phonemes");
  check("GET /api/phonemes returns 200", phonemes.status === 200);
  check("inventory holds the 43 HCE phonemes", phonemes.json?.length === 43, `got ${phonemes.json?.length}`);
  check(
    "multi-character phonemes are stored intact",
    phonemes.json?.some((p: any) => p.symbol === "tʃ") &&
      phonemes.json?.some((p: any) => p.symbol === "əʉ")
  );

  // ---- Create a word list -------------------------------------------------
  console.log("\nWord list CRUD");
  const created = await req("POST", "/api/word-lists", {
    name: "Smoke test list",
    description: "Created by the API smoke test",
    words: [{ english: "chin", phonemes: ["tʃ", "ɪ", "n"] }],
  });
  check("POST /api/word-lists returns 201", created.status === 201, `got ${created.status}`);
  const listId = created.json?.id;
  check("new list has an id", typeof listId === "number");
  check("initial word was stored with its phonemes", created.json?.words?.[0]?.phonemes?.join("") === "tʃɪn");

  const read = await req("GET", `/api/word-lists/${listId}`);
  check("GET /api/word-lists/:id returns the list", read.status === 200 && read.json?.id === listId);

  const renamed = await req("PATCH", `/api/word-lists/${listId}`, { name: "Renamed list" });
  check("PATCH renames the list", renamed.status === 200 && renamed.json?.name === "Renamed list");

  // ---- Word CRUD ----------------------------------------------------------
  console.log("\nWord CRUD");
  const addWord = await req("POST", `/api/word-lists/${listId}/words`, {
    english: "boat",
    phonemes: ["b", "əʉ", "t"],
  });
  check("POST adds a word with a 2-char phoneme", addWord.status === 201, `got ${addWord.status}`);
  const wordId = addWord.json?.id;
  check("stored phonemes round-trip exactly", addWord.json?.phonemes?.join("") === "bəʉt", addWord.json?.phonemes?.join(""));

  const updated = await req("PATCH", `/api/words/${wordId}`, {
    english: "bait",
    phonemes: ["b", "æɪ", "t"],
  });
  check("PATCH updates spelling and phonemes", updated.status === 200 && updated.json?.english === "bait");
  check("phoneme sequence was replaced", updated.json?.phonemes?.join("") === "bæɪt", updated.json?.phonemes?.join(""));

  const readWord = await req("GET", `/api/words/${wordId}`);
  check("GET /api/words/:id reflects the update", readWord.json?.english === "bait");

  const deleted = await req("DELETE", `/api/words/${wordId}`);
  check("DELETE removes the word", deleted.status === 200);
  const gone = await req("GET", `/api/words/${wordId}`);
  check("deleted word now returns 404", gone.status === 404, `got ${gone.status}`);

  // ---- Validation and error handling --------------------------------------
  console.log("\nValidation and error handling");
  const unknownPhoneme = await req("POST", `/api/word-lists/${listId}/words`, {
    english: "oops",
    phonemes: ["b", "ZZ", "t"],
  });
  check("unknown phoneme is rejected with 400", unknownPhoneme.status === 400, `got ${unknownPhoneme.status}`);
  check(
    "error names the offending symbol",
    JSON.stringify(unknownPhoneme.json?.details ?? "").includes("ZZ")
  );

  const badEnglish = await req("POST", `/api/word-lists/${listId}/words`, {
    english: "12!!",
    phonemes: ["b"],
  });
  check("invalid English spelling is rejected", badEnglish.status === 400);

  const emptyPhonemes = await req("POST", `/api/word-lists/${listId}/words`, {
    english: "empty",
    phonemes: [],
  });
  check("empty phoneme list is rejected", emptyPhonemes.status === 400);

  const malformed = await fetch(`${BASE}/api/word-lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not json",
  });
  check("malformed JSON is rejected with 400", malformed.status === 400, `got ${malformed.status}`);

  const badId = await req("GET", "/api/words/abc");
  check("non-numeric id is rejected with 400", badId.status === 400, `got ${badId.status}`);

  const missing = await req("GET", "/api/word-lists/999999");
  check("missing record returns 404", missing.status === 404, `got ${missing.status}`);

  // ---- Activity configs ---------------------------------------------------
  console.log("\nActivity configuration CRUD");
  const listAfter = await req("GET", `/api/word-lists/${listId}`);
  const targetId = listAfter.json?.words?.[0]?.id;

  const wordle = await req("POST", "/api/activities", {
    title: "Smoke test wordle",
    type: "WORDLE",
    wordListId: listId,
    targetWordId: targetId,
    attempts: 5,
  });
  check("POST creates a Wordle activity", wordle.status === 201, `got ${wordle.status}`);
  const wordleId = wordle.json?.id;

  const noTarget = await req("POST", "/api/activities", {
    title: "Invalid wordle",
    type: "WORDLE",
    wordListId: listId,
  });
  check("Wordle without a target word is rejected", noTarget.status === 400);

  const search = await req("POST", "/api/activities", {
    title: "Smoke test word search",
    type: "WORDSEARCH",
    wordListId: listId,
    gridSize: 10,
  });
  check("POST creates a Word Search activity", search.status === 201, `got ${search.status}`);
  const searchId = search.json?.id;

  const patched = await req("PATCH", `/api/activities/${wordleId}`, { attempts: 6 });
  check("PATCH updates activity settings", patched.status === 200 && patched.json?.attempts === 6);

  // ---- Generation from stored data ---------------------------------------
  console.log("\nHTML generation from database data");
  const genWordle = await req("GET", `/api/activities/${wordleId}/generate?inline=1`);
  check("Wordle generate returns 200", genWordle.status === 200, `got ${genWordle.status}`);
  check("output is a standalone HTML document", genWordle.text.startsWith("<!DOCTYPE html>"));
  check("output embeds the stored target word", genWordle.text.includes('"english":"chin"'));
  check("output reflects the saved attempts setting", genWordle.text.includes('"attempts":6'));

  const genSearch = await req("GET", `/api/activities/${searchId}/generate?inline=1`);
  check("Word Search generate returns 200", genSearch.status === 200);
  check("word search output is standalone HTML", genSearch.text.startsWith("<!DOCTYPE html>"));

  // ---- Cleanup ------------------------------------------------------------
  console.log("\nCleanup");
  const delList = await req("DELETE", `/api/word-lists/${listId}`);
  check("DELETE removes the list", delList.status === 200);
  const cascade = await req("GET", `/api/activities/${wordleId}`);
  check("activities cascade-delete with their list", cascade.status === 404, `got ${cascade.status}`);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\nSmoke test could not run:", err.message);
  console.error("Is the dev server running on " + BASE + "?");
  process.exit(1);
});
