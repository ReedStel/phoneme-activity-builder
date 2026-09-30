/**
 * Turns the JMeter result files into one readable table.
 *
 *   node load-tests/summarise.mjs
 *
 * Reads every load-tests/results/run-<users>.csv and prints a markdown table
 * of samples, error rate, average and 95th percentile response time, and
 * throughput, so the numbers in the report come from the raw results rather
 * than from a screenshot.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const DIR = "load-tests/results";

/** JMeter quotes any field containing a comma, so split with that in mind. */
function splitCsv(line) {
  const out = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      out.push(field);
      field = "";
    } else {
      field += c;
    }
  }
  out.push(field);
  return out;
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function summarise(file) {
  const users = Number(file.match(/\d+/)[0]);
  const lines = readFileSync(`${DIR}/${file}`, "utf8").trim().split(/\r?\n/);
  if (lines.length < 2) return { users, samples: 0 };
  const header = splitCsv(lines.shift());
  const iStart = header.indexOf("timeStamp");
  const iElapsed = header.indexOf("elapsed");
  const iSuccess = header.indexOf("success");
  const iLabel = header.indexOf("label");

  const elapsed = [];
  const byLabel = new Map();
  let errors = 0;
  let first = Infinity;
  let last = 0;

  for (const line of lines) {
    const cells = splitCsv(line);
    const ms = Number(cells[iElapsed]);
    const start = Number(cells[iStart]);
    if (!Number.isFinite(ms) || !Number.isFinite(start)) continue;
    elapsed.push(ms);
    first = Math.min(first, start);
    last = Math.max(last, start + ms);
    if (cells[iSuccess] !== "true") errors++;
    const label = cells[iLabel] ?? "unknown";
    const bucket = byLabel.get(label) ?? { n: 0, total: 0, errors: 0 };
    bucket.n++;
    bucket.total += ms;
    if (cells[iSuccess] !== "true") bucket.errors++;
    byLabel.set(label, bucket);
  }

  const sorted = [...elapsed].sort((a, b) => a - b);
  const seconds = Math.max((last - first) / 1000, 0.001);
  return {
    users,
    samples: elapsed.length,
    errorRate: elapsed.length ? (errors / elapsed.length) * 100 : 0,
    average: elapsed.reduce((a, b) => a + b, 0) / (elapsed.length || 1),
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1] ?? 0,
    throughput: elapsed.length / seconds,
    byLabel,
  };
}

const files = existsSync(DIR)
  ? readdirSync(DIR)
      .filter((f) => /^run-\d+\.csv$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
  : [];

if (!files.length) {
  console.error(`No result files in ${DIR}. Run load-tests/run-load-tests.sh first.`);
  process.exit(1);
}

const rows = files.map(summarise).filter((r) => r.samples > 0);
const table = [
  "| Users | Samples | Error rate | Average | 95th percentile | Slowest | Throughput |",
  "| ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ...rows.map(
    (r) =>
      `| ${r.users.toLocaleString("en-AU")} | ${r.samples.toLocaleString("en-AU")} | ${r.errorRate.toFixed(1)}% | ` +
      `${Math.round(r.average)} ms | ${Math.round(r.p95)} ms | ${Math.round(r.max)} ms | ` +
      `${r.throughput.toFixed(1)} req/s |`
  ),
].join("\n");

console.log(table);

const perEndpoint = rows.length
  ? [
      "",
      `Per request at ${rows[rows.length - 1].users.toLocaleString("en-AU")} users:`,
      "",
      "| Request | Samples | Average | Errors |",
      "| --- | ---: | ---: | ---: |",
      ...[...rows[rows.length - 1].byLabel.entries()].map(
        ([label, b]) =>
          `| ${label} | ${b.n.toLocaleString("en-AU")} | ${Math.round(b.total / b.n)} ms | ${b.errors.toLocaleString("en-AU")} |`
      ),
    ].join("\n")
  : "";

writeFileSync(`${DIR}/summary.md`, `${table}\n${perEndpoint}\n`);
console.log(`\nWritten to ${DIR}/summary.md`);
