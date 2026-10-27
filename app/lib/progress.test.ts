import assert from "node:assert/strict";
import { test } from "node:test";
import { boxToConf, cardGood, cardTries, confAdd, confBand, dayKey, isWeakStats, weekKey, xpInWeek } from "./progress.ts";

test("dayKey is the local date", () => {
  assert.equal(dayKey(new Date(2026, 9, 7, 23, 59)), "2026-10-07");
  assert.equal(dayKey(new Date(2026, 0, 1)), "2026-01-01");
});

test("weekKey is the ISO week, Monday to Sunday, and crosses the year", () => {
  assert.equal(weekKey(new Date(2026, 9, 5)), "2026-W41");
  assert.equal(weekKey(new Date(2026, 9, 11, 23)), "2026-W41");
  assert.equal(weekKey(new Date(2026, 9, 12)), "2026-W42");
  assert.equal(weekKey(new Date(2026, 0, 1)), "2026-W01");
  assert.equal(weekKey(new Date(2027, 0, 1)), "2026-W53");
  assert.match(weekKey(), /^\d{4}-W\d\d$/);
});

test("xpInWeek adds the days of one week", () => {
  const days = { "2026-10-05": 10, "2026-10-11": 5, "2026-10-12": 100, "2026-10-04": 1 };
  assert.equal(xpInWeek("2026-W41", days), 15);
  assert.equal(xpInWeek("2026-W42", days), 100);
  assert.equal(xpInWeek("2026-W40", {}), 0);
});

// Word confidence. Ported from scripts/kumru_onb.test.cjs.
const eq = (got: unknown, want: unknown, msg: string) => assert.equal(JSON.stringify(got), JSON.stringify(want), msg);

test("word confidence scores", () => {
  /* confidence scores: +2 right, +3 easy, -3 wrong, +5 claim, clamped to 0..15 */
  eq([confAdd(0,"right"),confAdd(5,"easy"),confAdd(2,"wrong"),confAdd(0,"claim")],[2,8,0,10],"conf steps: a claim lifts to confident");
  eq([confAdd(14,"right"),confAdd(13,"claim"),confAdd(undefined,"wrong")],[15,13,0],"conf clamps; a claim never lowers a score");
  eq(confAdd(5,"slip"),4,"a match-pairs slip costs 1");
  eq([confAdd(0,"near"),confAdd(14,"near"),confAdd(15,"near")],[1,15,15],"a forgiven typo slip adds 1");
  eq(confAdd(confAdd(confAdd(0,"claim"),"wrong"),"wrong"),4,"two misses bring a claim back below known");
  eq(confAdd(confAdd(0,"claim"),"wrong"),7,"one miss leaves a claim known");
  eq(boxToConf({a:0,b:1,c:3,d:5,e:9}),{b:2,c:6,d:10,e:10},"box levels become scores; level 3+ stays known");
});

test("answer counters and bands", () => {
  eq([cardTries({ a: 1, g: 2, e: 1, r: 3, w: 1 }), cardGood({ g: 2, e: 1, r: 3, w: 1 }), cardTries(undefined)], [8, 6, 0], "tries and good answers");
  eq([isWeakStats({ r: 1, w: 3 }), isWeakStats({ r: 3, w: 1 }), isWeakStats({ r: 3, l: 0 }), isWeakStats(undefined)], [true, false, true, false], "weak: the last answer wrong or under two in three good");
  eq([confBand(10, null), confBand(5, null), confBand(0, { r: 1 }), confBand(0, null), confBand(0, { v: 1 })], ["confident", "known", "learning", "new", "learning"], "bands");
});
