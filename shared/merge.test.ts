// node --test shared/merge.test.ts: one case per row of docs/SPECS.md section 9.5, the named scenarios, and
// the algebra every merge must keep (commutative, idempotent).
import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeProgress as m } from "./progress.ts";
import { mergeTutor } from "./tutor.ts";

const base = (over = {}) => ({ v: 5, conf: {}, confAt: {}, stats: {}, drill: {}, ex: {}, gram: {}, days: {}, xpDays: {}, xp: 0,
  log: [], st: {}, nd: {}, onb: 3, cheerSeen: 0, at: {}, ...over });

/** Both orders give the same document, and merging a result with itself changes nothing. */
function both(a, b) {
  const ab = m(a, b), ba = m(b, a);
  assert.deepEqual(ab, ba, "merge is commutative");
  assert.deepEqual(m(ab, ab), ab, "merge is idempotent");
  return ab;
}

test("conf: per card, the side with the later confAt (a wrong answer is not undone by a max)", () => {
  const a = base({ conf: { w: 9 }, confAt: { w: 100 } });
  const b = base({ conf: { w: 6 }, confAt: { w: 200 } });
  const r = both(a, b);
  assert.equal(r.conf.w, 6);
  assert.equal(r.confAt.w, 200);
});

test("conf: a later drop to zero removes the card", () => {
  const r = both(base({ conf: { w: 2 }, confAt: { w: 1 } }), base({ conf: {}, confAt: { w: 5 } }));
  assert.equal(r.conf.w, undefined);
});

test("stats: the record with the later t, times shown as max", () => {
  const r = both(base({ stats: { w: { r: 3, t: 10, v: 7, l: 1 } } }), base({ stats: { w: { r: 1, w: 1, t: 20, v: 2, l: 0 } } }));
  assert.deepEqual(r.stats.w, { r: 1, w: 1, t: 20, v: 7, l: 0 });
});

test("drill and ex: max of r and of w per key", () => {
  const r = both(base({ drill: { d1: { r: 3, w: 1 } }, ex: { choice: { r: 5, w: 0 } } }),
    base({ drill: { d1: { r: 2, w: 4 } }, ex: { choice: { r: 1, w: 2 }, "q:g_a1_1_soru": { r: 1, w: 1 } } }));
  assert.deepEqual(r.drill.d1, { r: 3, w: 4 });
  assert.deepEqual(r.ex.choice, { r: 5, w: 2 });
  assert.deepEqual(r.ex["q:g_a1_1_soru"], { r: 1, w: 1 });
});

test("gram: union", () => {
  assert.deepEqual(both(base({ gram: { g1: 1 } }), base({ gram: { g2: 1 } })).gram, { g1: 1, g2: 1 });
});

test("days and xpDays: per day max; xp is at least their sum", () => {
  const r = both(base({ days: { "2026-10-05": 4 }, xpDays: { "2026-10-05": 30 }, xp: 30 }),
    base({ days: { "2026-10-05": 2, "2026-10-06": 5 }, xpDays: { "2026-10-06": 25 }, xp: 25 }));
  assert.deepEqual(r.days, { "2026-10-05": 4, "2026-10-06": 5 });
  assert.equal(r.xp, 55);
  assert.equal(both(base({ xp: 900 }), base({ xp: 10 })).xp, 900);
});

test("log: union by (d, q, min), sorted, last 30", () => {
  const e = (d, q) => ({ d, q, min: 3, acc: 0.8 });
  const many = Array.from({ length: 40 }, (_, i) => e(`2026-09-${String(i % 28 + 1).padStart(2, "0")}`, i));
  const r = both(base({ log: [e("2026-10-01", 5), ...many.slice(0, 20)] }), base({ log: [e("2026-10-01", 5), ...many.slice(20)] }));
  assert.equal(r.log.length, 30);
  assert.equal(r.log.at(-1).d, "2026-10-01");
});

test("st: done wins, stars and reads max, picks from the later at", () => {
  const r = both(base({ st: { s1: { done: true, stars: 2, reads: 1, at: 10, picks: ["a"] } } }),
    base({ st: { s1: { stars: 3, reads: 4, at: 20, picks: ["b"] } } }));
  assert.deepEqual(r.st.s1, { done: true, stars: 3, reads: 4, at: 20, picks: ["b"] });
});

test("nd: stars and n max, at later", () => {
  const r = both(base({ nd: { A1_1_cp: { stars: 3, at: 5 } } }), base({ nd: { A1_1_cp: { stars: 1, n: 2, at: 9 } } }));
  assert.deepEqual(r.nd.A1_1_cp, { stars: 3, n: 2, at: 9 });
});

test("tree: higher l wins, else later at; tests union; mig either", () => {
  const r = both(base({ tree: { v: 1, sk: { sk_a: { l: 2, at: 1 }, sk_b: { l: 1, at: 5 } }, sec: { s01: { at: 1 } }, mig: 1, tests: [{ from: 1, to: 2 }] } }),
    base({ tree: { v: 1, sk: { sk_a: { l: 1, at: 9 }, sk_b: { l: 1, at: 7 } }, sec: { s01: { at: 3, how: "cp" } }, tests: [{ from: 2, to: 3 }] } }));
  assert.equal(r.tree.sk.sk_a.l, 2);
  assert.equal(r.tree.sk.sk_b.at, 7);
  assert.equal(r.tree.sec.s01.how, "cp");
  assert.equal(r.tree.mig, 1);
  assert.equal(r.tree.tests.length, 2);
});

test("pos: the later at.pos; a tie goes to the further place", () => {
  assert.deepEqual(both(base({ pos: { lv: "A2", u: 1 }, at: { pos: 10 } }), base({ pos: { lv: "A1", u: 6 }, at: { pos: 20 } })).pos, { lv: "A1", u: 6 });
  assert.deepEqual(both(base({ pos: { lv: "A2", u: 1 }, at: { pos: 10 } }), base({ pos: { lv: "A1", u: 6 }, at: { pos: 10 } })).pos, { lv: "A2", u: 1 });
});

test("placed, onb, cheerSeen: the later or larger", () => {
  const r = both(base({ placed: { lv: "A1", u: 2, at: 5 }, onb: 2, cheerSeen: 9 }), base({ placed: { lv: "A1", u: 4, at: 8 }, onb: 3, cheerSeen: 3 }));
  assert.equal(r.placed.u, 4);
  assert.equal(r.onb, 3);
  assert.equal(r.cheerSeen, 9);
});

test("nick, char, profile, prefs: the side with the later at.<field>", () => {
  const r = both(base({ nick: "Old", prefs: { lang: "fa" }, at: { nick: 1, prefs: 50 } }), base({ nick: "New", prefs: { lang: "en" }, at: { nick: 9, prefs: 5 } }));
  assert.equal(r.nick, "New");
  assert.deepEqual(r.prefs, { lang: "fa" });
  assert.deepEqual(r.at, { nick: 9, prefs: 50 });
});

test("v: max, at least 5", () => {
  assert.equal(both(base({ v: 4 }), base({ v: 5 })).v, 5);
});

test("scenario: a stale overnight tab does not erase the morning on another phone", () => {
  const night = base({ conf: { w1: 3, w2: 3 }, confAt: { w1: 100, w2: 100 }, xpDays: { "2026-10-05": 40 }, xp: 40, gram: { g1: 1 } });
  const morning = base({ ...night, conf: { w1: 8, w2: 3, w3: 2 }, confAt: { w1: 900, w2: 100, w3: 950 },
    xpDays: { "2026-10-05": 40, "2026-10-06": 30 }, xp: 70, gram: { g1: 1, g2: 1 } });
  const staleAnswer = base({ ...night, conf: { w1: 3, w2: 5 }, confAt: { w1: 100, w2: 1000 } });
  const r = both(morning, staleAnswer);
  assert.deepEqual(r.conf, { w1: 8, w2: 5, w3: 2 });
  assert.equal(r.xp, 70);
  assert.deepEqual(r.gram, { g1: 1, g2: 1 });
});

test("scenario: offline answers, then reconnect", () => {
  const server = base({ conf: { a: 4 }, confAt: { a: 10 }, days: { "2026-10-06": 3 } });
  const offline = base({ conf: { a: 4, b: 2 }, confAt: { a: 10, b: 20 }, days: { "2026-10-06": 7 } });
  const r = both(server, offline);
  assert.deepEqual(r.conf, { a: 4, b: 2 });
  assert.equal(r.days["2026-10-06"], 7);
});

test("scenario: claim on A, wrong on B", () => {
  const a = base({ conf: { w: 10 }, confAt: { w: 100 } });   // "I already know this" (+5)
  const b = base({ conf: { w: 2 }, confAt: { w: 200 } });    // later wrong answer (-3) on the other phone
  assert.equal(both(a, b).conf.w, 2);
});

test("scenario: prefs changed on A, answer on B", () => {
  const a = base({ prefs: { lang: "en", goal: 30 }, at: { prefs: 500 } });
  const b = base({ prefs: { lang: "fa", goal: 20 }, at: { prefs: 100 }, conf: { w: 3 }, confAt: { w: 600 } });
  const r = both(a, b);
  assert.deepEqual(r.prefs, { lang: "en", goal: 30 });
  assert.equal(r.conf.w, 3);
});

test("a missing side returns a copy of the other", () => {
  const a = base({ xp: 5 });
  assert.deepEqual(m(a, null), a);
  assert.notEqual(m(a, null), a);
  assert.deepEqual(m(undefined, a), a);
});

test("tutor: mistakes union by orig (later at), counters max, done wins", () => {
  const a = { mistakes: [{ orig: "Ben gitti", fixed: "Ben gittim", at: 5, n: 1 }], tries: { g1: { n: 3, ok: 1 } }, talk: { sc01: { done: true, stars: 2, at: 1 } } };
  const b = { mistakes: [{ orig: "ben gitti ", fixed: "Ben gittim.", at: 9, n: 0 }, { orig: "X", at: 1 }], tries: { g1: { n: 1, ok: 1 } }, talk: { sc01: { stars: 3, at: 4 } } };
  const r = mergeTutor(a, b);
  assert.deepEqual(r, mergeTutor(b, a));
  assert.equal(r.mistakes.length, 2);
  assert.equal(r.mistakes[0].fixed, "Ben gittim.");
  assert.equal(r.mistakes[0].n, 1);
  assert.deepEqual(r.tries.g1, { n: 3, ok: 1 });
  assert.deepEqual(r.talk.sc01, { done: true, stars: 3, at: 4 });
});
