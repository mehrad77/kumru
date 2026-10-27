import assert from "node:assert/strict";
import { test } from "node:test";
import { onPhase, resetBoot, runPhase } from "./boot.ts";

test("a phase runs its handlers once, in order, and a failing handler does not stop the rest", () => {
  resetBoot();
  const seen: string[] = [];
  const warn = console.warn; console.warn = () => {};
  onPhase("identity", () => seen.push("a"));
  onPhase("identity", () => { throw new Error("x"); });
  onPhase("identity", () => seen.push("b"));
  runPhase("identity");
  runPhase("identity");
  console.warn = warn;
  assert.deepEqual(seen, ["a", "b"]);
});

test("a handler added after its phase has run runs at once", () => {
  resetBoot();
  runPhase("gated");
  let ran = false;
  onPhase("gated", () => { ran = true; });
  assert.equal(ran, true);
});
