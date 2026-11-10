// The service worker keeps a file only when it is the file (swcache.ts): the Worker's single-page fallback answers an older
// build's chunk with index.html and status 200, which used to be cached as that chunk and break the onboarding for good.
import assert from "node:assert/strict";
import { test } from "node:test";
import { isFile } from "./swcache.ts";

const res = (status: number, type: string | null) => ({ ok: status >= 200 && status < 300, headers: { get: (n: string) => (n.toLowerCase() === "content-type" ? type : null) } });

test("an older build's chunk answered with the page is not a file", () => {
  assert.equal(isFile("/assets/Onboarding-C4TYhgN8.js", res(200, "text/html; charset=utf-8")), false);
  assert.equal(isFile("/assets/builder-2ij29dTY.js", res(200, "TEXT/HTML")), false);
  assert.equal(isFile("/data/cards.1234abcd.json", res(200, "text/html")), false);
});

test("real files are kept", () => {
  assert.equal(isFile("/assets/Onboarding-C4TYhgN8.js", res(200, "text/javascript")), true);
  assert.equal(isFile("/assets/Onboarding-CBf0c4pD.css", res(200, "text/css")), true);
  assert.equal(isFile("/sounds/ding.mp3", res(200, "audio/mpeg")), true);
  assert.equal(isFile("/thumbs/s1e01.webp", res(200, null)), true);
});

test("the page is the page", () => {
  assert.equal(isFile("/", res(200, "text/html")), true);
  assert.equal(isFile("/index.html", res(200, "text/html")), true);
});

test("errors are never kept", () => {
  assert.equal(isFile("/assets/x.js", res(404, "text/plain")), false);
  assert.equal(isFile("/", res(500, "text/html")), false);
});
