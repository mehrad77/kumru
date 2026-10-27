import assert from "node:assert/strict";
import { test } from "node:test";
import { S } from "../../core/store.ts";
import { addXp, applyProgress, bumpConf, bumpDay, confBand, confMove, curIdx, inLab, isSkippedUnit, levelDist, myLevel, progressDoc, recordCard, recordEx, retrying, todayKey, unitDone } from "./api.ts";
import { rev, touch } from "./state.ts";

const fresh = () => { applyProgress({ v: 5 }); S.session = null; S.db = null; };

test("outside the Lab XP and the active day count (XP itself opens the day, the answer adds one)", () => {
  fresh();
  addXp(2); bumpDay();
  const k = todayKey();
  assert.deepEqual([S.xp, S.xpDays[k], S.days[k]], [2, 2, 2]);
});

test("in the Lab neither XP nor the active day moves", () => {
  fresh();
  S.session = { lab: true };
  addXp(5); bumpDay();
  assert.deepEqual([inLab(), S.xp, S.xpDays, S.days], [true, 0, {}, {}]);
  S.session = { lab: false };
  addXp(1);
  assert.equal(S.xp, 1);
});

test("a retry records nothing and moves no confidence, but a claim still counts", () => {
  fresh();
  S.session = { cur: { retry: true } };
  assert.equal(retrying(), true);
  recordCard("w1", "r"); recordEx("quiz", true, "l1"); bumpConf("w1", "right");
  assert.deepEqual([S.stats, S.ex, S.conf], [{}, {}, {}]);
  bumpConf("w1", "claim");
  assert.equal(S.conf.w1, 10);
  assert.deepEqual(confMove.w1, { from: 0, to: 10 });
  assert.equal(confBand("w1"), "confident");
});

test("recording an answer counts it, stamps the card and bumps rev", () => {
  fresh();
  const before = rev.value;
  recordCard("w2", "a");
  recordEx("quiz", false, "l2");
  assert.equal(S.stats.w2.a, 1);
  assert.equal(S.stats.w2.l, 0);
  assert.deepEqual(S.ex["q:l2"], { r: 0, w: 1 });
  assert.ok(rev.value > before);
  touch();
});

test("where the learner stands: level, current unit, finished and skipped units", () => {
  fresh();
  assert.equal(myLevel(), "A1");
  S.pos = { lv: "A2", u: 2 };
  S.nd = { A1_1_cp: { at: 1 } };
  assert.deepEqual([myLevel(), curIdx(), unitDone("A1", 1), unitDone("A1", 2)], ["A2", 7, true, false]);
  assert.deepEqual([isSkippedUnit("A1", 1), isSkippedUnit("A1", 2), isSkippedUnit("A2", 3)], [false, true, false]);
  assert.deepEqual([levelDist("A2"), levelDist("A1"), levelDist("B1")], [0, 1, 2]);
});

test("the document built after applying one keeps the story fields (the story progress is not drawn any more but not dropped)", () => {
  applyProgress({ v: 5, st: { s1: { read: 2 } }, nick: "Ada" });
  assert.deepEqual(progressDoc().st, { s1: { read: 2 } });
  assert.equal(progressDoc().nick, "Ada");
});
