import assert from "node:assert/strict";
import { test } from "node:test";
import { PATH_TAB, TABS, TAB_PATH, parseRoute } from "./route.ts";

test("a unit route gives the reference, upper-cased, and lands on the Path", () => {
  assert.equal(parseRoute("/unit/A1_3", "").unit, "A1_3");
  assert.equal(parseRoute("/unit/a2_6/", "").unit, "A2_6");
  assert.equal(parseRoute("/unit/A1_3", "").tab, "path");
});

test("these are not unit routes", () => {
  for (const bad of ["/unit/", "/unit/A1", "/unit/A1_7", "/unit/A1_0", "/unit/A1_3/x", "/unit/C1_1", "/units/A1_3", "/path"]) {
    assert.equal(parseRoute(bad, "").unit, undefined, bad);
  }
});

test("every tab has a path and the path gives the tab back", () => {
  for (const t of TABS) {
    assert.equal(parseRoute(TAB_PATH[t], "").tab, t);
    assert.equal(PATH_TAB[TAB_PATH[t]], t);
  }
  assert.equal(parseRoute("/owner/", "").tab, "people");
  assert.equal(parseRoute("/nowhere", "").tab, undefined);
});

test("old #links still land somewhere", () => {
  assert.equal(parseRoute("/", "#settings").tab, "profile");
  assert.equal(parseRoute("/", "#grammar").tab, "path");
  assert.equal(parseRoute("/", "#friends").tab, "friends");
  assert.equal(parseRoute("/", "#card=u~abc~1").card, "u~abc~1");
  assert.equal(parseRoute("/", "#onb").onb, true);
  assert.equal(parseRoute("/", "#kerim").kerim, true);
  assert.equal(parseRoute("/", "#unknown").tab, undefined);
});

test("a lesson, a story, a card and the dev screens open on the right tab", () => {
  assert.deepEqual(parseRoute("/lesson/g_a1_4_iyelik"), { lesson: "g_a1_4_iyelik", tab: "path" });
  assert.deepEqual(parseRoute("/stories/s1"), { story: "s1", tab: "stories" });
  assert.deepEqual(parseRoute("/card/yk-1"), { card: "yk-1", tab: null });
  assert.deepEqual(parseRoute("/onboarding"), { onb: true, tab: null });
  assert.deepEqual(parseRoute("/connect/yeni/"), { connect: "yeni" });
});
