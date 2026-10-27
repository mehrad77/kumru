// Writes data/days.json, the A1 calendar Sahne's story check reads ($SAHNE_CONTENT/days.json: the calendar and recycle
// rules), from the *Days* table of docs/stories/STORIES_A1.md (id, date, week, kind; the year is 2026, the A1 term,
// docs/stories/STORIES_CALENDAR.md). The table is the one source: change it there, then run this.
// node scripts/kumru_days.mjs [--check]   (--check fails when data/days.json is stale; in `pnpm check`)
import { readFileSync, writeFileSync } from "node:fs";

const SRC = new URL("../docs/stories/STORIES_A1.md", import.meta.url);
const OUT = new URL("../data/days.json", import.meta.url);
const MONTHS = { Sep: "09", Oct: "10", Nov: "11", Dec: "12", Jan: "01", Feb: "02", Mar: "03" };

export function daysText() {
  const days = {};
  for (const m of readFileSync(SRC, "utf8").matchAll(/^\| (s1e\d\d) \| \w{3} (\d{1,2}) (\w{3}) \| (\d) \| (episode|special) \|/gm)) {
    if (!MONTHS[m[3]]) throw new Error(`STORIES_A1.md: ${m[1]} has an unknown month ${m[3]}`);
    days[m[1]] = { date: `2026-${MONTHS[m[3]]}-${m[2].padStart(2, "0")}`, kind: m[5], week: Number(m[4]) };
  }
  if (!Object.keys(days).length) throw new Error("STORIES_A1.md: no rows in the Days table");
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
