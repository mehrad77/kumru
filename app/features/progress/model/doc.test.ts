import assert from "node:assert/strict";
import { test } from "node:test";
import { AT_FIELDS, applyDoc, atSnapshot, buildDoc, stampChanges, weakSummary } from "./doc.ts";

const ctx = { prefDefaults: { lang: "fa", corr: "end", tryIt: true, goal: 20 }, levels: ["A1", "A2", "B1"] };

// a v5 document with every field, including the story fields (`st`), which the app no longer draws but must keep
const DOC = {
  v: 5, conf: { w1: 6, w2: 11 }, confAt: { w1: 100, w2: 200 }, at: { nick: 5, prefs: 7 }, gram: { g_a1_1: 1 },
  stats: { w1: { a: 2, r: 1, t: 100 } }, drill: { n_plural: { r: 3, w: 1 } }, days: { "2026-10-01": 4 }, ex: { quiz: { r: 2, w: 1 }, "q:g_a1_1": { r: 2, w: 1 } },
  log: [{ a: 1 }], nick: "Ada", st: { s_bakkal: { read: 3, quiz: [1, 0, 1] }, extra: "kept" },
  prefs: { lang: "fa", corr: "end", tryIt: true, goal: 30 }, onb: 3, xp: 120, xpDays: { "2026-10-01": 40 }, nd: { A1_1_cp: { at: 1 } },
  tree: { v: 1, sk: { sk_hello: { p: 2 } }, sec: { s1: 1 }, mig: 1 }, cheerSeen: 4, pos: { lv: "A1", u: 3 }, char: { skin: 1 }, profile: { name: { en: "Ada" } }, placed: { lv: "A1" },
};

test("a progress document round-trips untouched, story fields included", () => {
  const f = applyDoc(DOC, ctx);
  assert.deepEqual(buildDoc(f), DOC);
  assert.deepEqual(f.st, DOC.st);
});

test("applying copies: changing the state does not change the document it came from", () => {
  const f = applyDoc(DOC, ctx);
  f.st.s_bakkal.read = 99; f.conf.w1 = 0;
  assert.equal(DOC.st.s_bakkal.read, 3);
  assert.equal(DOC.conf.w1, 6);
});

test("a nickname is only taken when the document has one, a bad position is dropped, the unit is clamped", () => {
  assert.equal("nick" in applyDoc({ v: 5 }, ctx), false);
  assert.equal(applyDoc({ pos: { lv: "C2", u: 1 } }, ctx).pos, null);
  assert.deepEqual(applyDoc({ pos: { lv: "A2", u: 9 } }, ctx).pos, { lv: "A2", u: 6 });
});

test("a document older than v3 keeps its old level and start unit aside and drops them from prefs", () => {
  const f = applyDoc({ v: 2, prefs: { level: "A2", startUnit: 3, talkPlan: 1, lang: "en" } }, ctx);
  assert.deepEqual(f.legacy, { level: "A2", startUnit: 3 });
  assert.equal("level" in f.prefs, false);
  assert.equal(f.mlang, "en");
  assert.equal(f.pv, 2);
});

test("old box levels become confidence scores, and missing per-word times come from the last answer", () => {
  const f = applyDoc({ box: { a: 3 }, stats: { a: { t: 77 } } }, ctx);
  assert.deepEqual(f.conf, { a: 6 });
  assert.deepEqual(f.confAt, { a: 77 });
  assert.deepEqual(f.boxOld, { a: 3 });
});

test("stampChanges stamps the fields and words that changed since the snapshot, and the first call only snapshots", () => {
  const f = applyDoc(DOC, ctx);
  let snap = stampChanges(f, null, 1000);
  assert.deepEqual(f.at, { nick: 5, prefs: 7 });
  f.nick = "Ali"; f.conf.w1 = 8; delete f.conf.w2;
  snap = stampChanges(f, snap, 2000);
  assert.equal(f.at.nick, 2000);
  assert.equal(f.at.prefs, 7);
  assert.equal(f.confAt.w1, 2000);
  assert.equal(f.confAt.w2, 2000);
  assert.deepEqual(snap.conf, { w1: 8 });
  assert.deepEqual(Object.keys(atSnapshot(f).f), [...AT_FIELDS]);
});

test("the hard-words summary lists tried-three-times cards by accuracy and lessons by quiz misses", () => {
  const w = weakSummary({ a: { a: 1, w: 2 }, b: { r: 3 }, c: { w: 1 } }, { "q:l1": { r: 1, w: 2 }, "q:l2": { r: 5, w: 1 }, quiz: { r: 1, w: 9 } }, 42);
  assert.deepEqual(w.cards, [{ id: "a", tries: 3, wrong: 3 }]);
  assert.deepEqual(w.lessons.map((l) => l.id), ["l1", "l2"]);
  assert.equal(w.at, 42);
  assert.equal(w.v, 1);
});
