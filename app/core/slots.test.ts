import assert from "node:assert/strict";
import { test } from "node:test";
import { addSlotFills, slot } from "./slots.ts";

test("a slot's fills come back in order, across features", () => {
  const load = () => Promise.reject(new Error("not drawn in a unit test"));
  addSlotFills({ profileCards: [{ order: 30, load }, { order: 10, load }] });
  addSlotFills({ profileCards: [{ order: 20, load }] });
  assert.deepEqual(slot("profileCards").map((f) => f.order), [10, 20, 30]);
  assert.deepEqual(slot("pathBanners"), []);
});
