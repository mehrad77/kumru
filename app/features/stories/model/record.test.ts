// node --test app/features/stories/model/record.test.ts. Run by `pnpm test`.
import test from "node:test";
import assert from "node:assert/strict";
import { finishRecord, okPicks, quizStars, shuffled } from "./record.ts";

const steps = [
  { who: "maria", tr: "Merhaba" },
  { choice: { id: "seat", options: [{ ok: true }, {}] } },
  { choice: { id: "bread", options: [{}, { ok: true }, {}] } },
];

test("ok picks count the story's own choices answered with ok", () => {
  assert.equal(okPicks(steps, { seat: 0, bread: 1 }), 2);
  assert.equal(okPicks(steps, { seat: 1, bread: 1, fu_bye: 0 }), 1);
  assert.equal(okPicks(steps, {}), 0);
});

test("stars: first-try answers, at least one", () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(quizStars), [1, 1, 2, 3, 3]);
});

test("a reading keeps the best stars, counts reads and takes this reading's picks", () => {
  const a = finishRecord(undefined, { stars: 2, picks: 1, ch: { seat: 0 }, fu: true, now: 10 });
  assert.deepEqual(a, { rec: { done: true, stars: 2, reads: 1, at: 10, picks: 1, ch: { seat: 0 }, fu: true }, first: true });
  const b = finishRecord(a.rec, { stars: 1, picks: 2, ch: { seat: 1 }, fu: false, now: 20 });
  assert.deepEqual(b, { rec: { done: true, stars: 2, reads: 2, at: 20, picks: 2, ch: { seat: 1 }, fu: true }, first: false });
});

test("a shuffle is a fixed permutation per seed", () => {
  const s = shuffled(3, "s1e01:seat:1");
  assert.deepEqual([...s].sort(), [0, 1, 2]);
  assert.deepEqual(shuffled(3, "s1e01:seat:1"), s);
  const seen = new Set(Array.from({ length: 30 }, (_, i) => shuffled(3, "x" + i)[0]));
  assert.ok(seen.size > 1, "the first option is not always the authored first");
});
