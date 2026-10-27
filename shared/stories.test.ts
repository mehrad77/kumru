// node --test shared/stories.test.ts. Run by `pnpm test`.
import test from "node:test";
import assert from "node:assert/strict";
import { istanbulDay, isReadable, isReleased, nextForYou, visibleStories } from "./stories.ts";

const LAUNCH = { 1: "2026-11-16", 2: "2026-12-07" };
const S = [
  { id: "s1e01", season: 1, releaseDate: "2026-09-07" },
  { id: "s1e02", season: 1, releaseDate: "2026-09-08" },
  { id: "s1e03", season: 1, releaseDate: "2026-09-09", draft: true },
  { id: "s2e01", season: 2, releaseDate: "2026-12-07" },
  { id: "s2e02", season: 2, releaseDate: "2026-12-08" },
];

test("istanbulDay is UTC+3", () => {
  assert.equal(istanbulDay(Date.UTC(2026, 10, 15, 20, 59)), "2026-11-15");
  assert.equal(istanbulDay(Date.UTC(2026, 10, 15, 21, 0)), "2026-11-16", "00:00 in Istanbul is 21:00 UTC the day before");
});

test("nothing before a season's launch; the whole archive on launch day; never a draft", () => {
  assert.deepEqual(visibleStories(S, "2026-11-15", LAUNCH).map((s) => s.id), []);
  assert.deepEqual(visibleStories(S, "2026-11-16", LAUNCH).map((s) => s.id), ["s1e01", "s1e02"]);
  assert.ok(!isReleased(S[2], "2027-01-01", LAUNCH));
});

test("a daily season releases one story a day from its launch", () => {
  assert.deepEqual(visibleStories(S, "2026-12-07", LAUNCH).map((s) => s.id), ["s1e01", "s1e02", "s2e01"]);
  assert.deepEqual(visibleStories(S, "2026-12-08", LAUNCH).map((s) => s.id), ["s1e01", "s1e02", "s2e01", "s2e02"]);
  assert.deepEqual(visibleStories(S, "2026-12-08", { 1: "2026-11-16" }).map((s) => s.id), ["s1e01", "s1e02"], "an unlaunched season stays shut");
});

test("Next for you is the first unfinished story in release order", () => {
  const v = visibleStories(S, "2026-12-08", LAUNCH);
  assert.equal(nextForYou(v, (id) => id === "s1e01")?.id, "s1e02");
  assert.equal(nextForYou(v, () => true), null);
});

test("a story opens once every story before it is finished", () => {
  const v = visibleStories(S, "2026-12-08", LAUNCH);
  const done = (id: string) => id === "s1e01";
  assert.equal(isReadable(v, "s1e01", done), true, "a finished story stays open");
  assert.equal(isReadable(v, "s1e02", done), true, "the first unfinished story is open");
  assert.equal(isReadable(v, "s2e01", done), false, "the one after it waits");
  assert.equal(isReadable(v, "s9e99", done), false, "a story that is not out never opens");
});
