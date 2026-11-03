// Writes data/days.json, the release calendar in the shape Sahne's story check read before the seasons carried it
// ($SAHNE_CONTENT/days.json: the calendar and recycle rules), from each season's `calendar` in data/seasons/s<n>.json
// (id → date, kind, week; edited in backstage, `pnpm backstage`). The seasons are the one source: while days.json is
// written beside them, Sahne warns when it differs. Change a date in the season, then run this.
// node scripts/kumru_days.mjs [--check]   (--check fails when data/days.json is stale; in `pnpm check`)
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const SEASONS = new URL("../data/seasons/", import.meta.url);
const OUT = new URL("../data/days.json", import.meta.url);

export function daysText() {
  const days = {};
  for (const f of readdirSync(SEASONS).filter((f) => /^s\d+\.json$/.test(f)).sort()) {
    const { calendar = {} } = JSON.parse(readFileSync(new URL(f, SEASONS), "utf8"));
    for (const [id, { date, kind, week }] of Object.entries(calendar)) {
      if (days[id]) throw new Error(`data/seasons/${f}: ${id} is in another season's calendar too`);
      days[id] = { date, kind, week };
    }
  }
  if (!Object.keys(days).length) throw new Error("data/seasons/: no season has a calendar");
  return JSON.stringify(Object.fromEntries(Object.keys(days).sort().map((k) => [k, days[k]])), null, 2) + "\n";
}

const want = daysText();
if (process.argv.includes("--check")) {
  let have = "";
  try { have = readFileSync(OUT, "utf8"); } catch { /* missing */ }
  if (have !== want) { console.error("data/days.json is stale: run node scripts/kumru_days.mjs"); process.exit(1); }
  console.log(`data/days.json is up to date (${Object.keys(JSON.parse(want)).length} days)`);
} else {
  writeFileSync(OUT, want);
  console.log(`wrote data/days.json (${Object.keys(JSON.parse(want)).length} days)`);
}
