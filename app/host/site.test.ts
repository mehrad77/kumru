// app/host/site.ts: shared links name kumru.shab.boo on both public addresses, and the page's own origin elsewhere.
import assert from "node:assert/strict";
import { test } from "node:test";

async function originOn(href: string): Promise<string> {
  const u = new URL(href);
  (globalThis as { location?: unknown }).location = { hostname: u.hostname, origin: u.origin };
  const { shareOrigin } = await import("./site.ts");
  return shareOrigin();
}

test("links shared from either address name kumru.shab.boo", async () => {
  assert.equal(await originOn("https://turk.shab.boo/@nur"), "https://kumru.shab.boo");
  assert.equal(await originOn("https://kumru.shab.boo/path"), "https://kumru.shab.boo");
});

test("on localhost a link keeps the page's origin", async () => {
  assert.equal(await originOn("http://localhost:8787/"), "http://localhost:8787");
});
