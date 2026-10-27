import assert from "node:assert/strict";
import { test } from "node:test";
import { bytesLabel, relTime } from "./format.ts";

const H = 36e5;

test("relTime", () => {
  const now = 1_000_000 * H;
  assert.equal(relTime(now - 10 * 60e3, now), "just now");
  assert.equal(relTime(now - 5 * H, now), "5 h ago");
  assert.equal(relTime(now - 47 * H, now), "47 h ago");
  assert.equal(relTime(now - 72 * H, now), "3 days ago");
});

test("bytesLabel", () => {
  assert.equal(bytesLabel(512), "512 B");
  assert.equal(bytesLabel(40_000), "40 KB");
  assert.equal(bytesLabel(1_250_000), "1.3 MB");
});
