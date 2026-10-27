// node --test app/lib/char.test.ts (Node 24 strips the types). Run by `pnpm test`.
import test from "node:test";
import assert from "node:assert/strict";
import { CHAR_MAX_BYTES, charBytes, charKind, charStorable, isLegacyChar, legacyChar } from "./char.ts";
import { AVATAR_MAX_BYTES, isAvatarDoc, isLegacyChar as sahneLegacy } from "../../sahne/packages/sahne/src/avatar/normalize.ts";

const DOC = { v: 1, kit: "sahne-kit@1", body: { build: "adult", height: 0.5, shape: "average" }, skin: "skin_07" };
const LEGACY = { skin: 2, hair: 3, hairC: 1, beard: 0, top: 0, wear: 1, acc: 0, shirt: 4 };

test("charKind: none, legacy, avatar, bad", () => {
  for (const c of [null, undefined, {}]) assert.equal(charKind(c), "none");
  assert.equal(charKind(LEGACY), "legacy");
  assert.equal(charKind({ skin: 1 }), "legacy");
  assert.equal(charKind(DOC), "avatar");
  for (const c of ["x", 3, [], [1], { skin: 1.5 }, { skin: "1" }, { skin: 1, extra: 2 }, { v: 2, kit: "k", body: {} },
    { v: 1, kit: "k" }, { v: 1, kit: 7, body: {} }, { v: 1, kit: "k".repeat(41), body: {} }, { v: 1, kit: "k", body: [] }]) {
    assert.equal(charKind(c), "bad", JSON.stringify(c));
  }
});

test("isLegacyChar and the avatar shape agree with sahne", () => {
  const samples: unknown[] = [null, {}, LEGACY, { skin: 1 }, { skin: -1 }, { skin: 1.5 }, { skin: 1, v: 1 }, { foo: 1 }, DOC,
    { v: 1, kit: "k", body: {} }, { v: 1, kit: "k" }, [], "x"];
  for (const c of samples) {
    assert.equal(isLegacyChar(c), sahneLegacy(c), "legacy " + JSON.stringify(c));
    assert.equal(charKind(c) === "avatar", isAvatarDoc(c), "avatar " + JSON.stringify(c));
  }
  assert.equal(CHAR_MAX_BYTES, AVATAR_MAX_BYTES);
});

test("legacyChar keeps known slots as whole numbers from 0", () => {
  assert.deepEqual(legacyChar(LEGACY), LEGACY);
  assert.deepEqual(legacyChar(null), { skin: 0, hair: 0, hairC: 0, beard: 0, top: 0, wear: 0, acc: 0, shirt: 0 });
  const odd = legacyChar({ skin: -2, hair: 1.5, hairC: "3", top: 5, foo: 9 });
  assert.deepEqual(odd, { skin: 0, hair: 0, hairC: 0, beard: 0, top: 5, wear: 0, acc: 0, shirt: 0 });
});

test("charBytes and charStorable", () => {
  assert.equal(charBytes(null), 4);
  assert.equal(charBytes({ a: "ş" }), 10);
  const loop: Record<string, unknown> = {};
  loop.self = loop;
  assert.equal(charBytes(loop), Infinity);
  assert.ok(charStorable(null));
  assert.ok(charStorable(LEGACY));
  assert.ok(charStorable(DOC));
  assert.ok(!charStorable({ skin: "x" }));
  const big = { ...DOC, pad: "x".repeat(CHAR_MAX_BYTES) };
  assert.equal(charKind(big), "avatar");
  assert.ok(!charStorable(big));
  assert.ok(!charStorable(DOC, 20), "a stricter host limit");
  assert.ok(charStorable(DOC, 10 ** 6), "never above CHAR_MAX_BYTES");
});
