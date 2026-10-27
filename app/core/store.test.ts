import assert from "node:assert/strict";
import { test } from "node:test";
import { effect } from "@preact/signals-core";
import { PREF_DEFAULTS, createState } from "./store.ts";

test("a moved field reads and writes like a plain property and drives its signal", () => {
  const { S, signals } = createState();
  assert.equal(S.tab, "path");
  S.tab = "friends";
  assert.equal(S.tab, "friends");
  assert.equal(signals.tab.value, "friends");
  signals.tab.value = "profile";
  assert.equal(S.tab, "profile");
});

test("an effect that reads a moved field runs again when code assigns it", () => {
  const { S, signals } = createState();
  const seen: string[] = [];
  const stop = effect(() => { seen.push(signals.tab.value); });
  S.tab = "stories";
  S.tab = "lab";
  stop();
  S.tab = "people";
  assert.deepEqual(seen, ["path", "stories", "lab"]);
});

test("preferences start from the defaults, and a field that is not moved is a plain property", () => {
  const { S } = createState();
  assert.deepEqual({ ...S.prefs }, { ...PREF_DEFAULTS, lang: "none" });
  assert.equal(S.session, null);
  assert.ok(S.cards instanceof Map);
  S.conf = { a: 1 };
  assert.deepEqual(S.conf, { a: 1 });
});

test("the moved fields are enumerable, so spreading the state copies them; dynamic keys work", () => {
  const { S } = createState();
  const copy = { ...S };
  assert.equal(copy.tab, "path");
  assert.equal(copy.canEdit, false);
  S["dynamic"] = 1;
  assert.equal(S["dynamic"], 1);
});

test("two states do not share signals", () => {
  const a = createState(), b = createState();
  a.S.canEdit = true;
  assert.equal(b.S.canEdit, false);
});
