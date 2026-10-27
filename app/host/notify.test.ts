// Tapping a reminder (notify.ts, sw.ts) after the move from the old YaKerim domain to turk.shab.boo.
import assert from "node:assert/strict";
import { test } from "node:test";
import { clickTarget } from "./notify.ts";

const URL_NOW = "https://turk.shab.boo/";   // worker/features/reminders/cron.ts reminderPayload().url
const OLD = "https://old-site.example";   // the retired YaKerim origin (the handler only compares origins)

/** The notificationclick handler the retired YaKerim site's worker keeps running in browsers, as it was shipped. */
function oldWorker(dataUrl: string | undefined, selfOrigin: string, windows: string[]): { focus: number } | { open: string } {
  const at = windows.findIndex((w) => new URL(w).origin === selfOrigin);
  return at >= 0 ? { focus: at } : { open: dataUrl || "/" };
}

test("the old YaKerim worker opens the new site from today's absolute reminder URL", () => {
  assert.deepEqual(oldWorker(URL_NOW, OLD, []), { open: "https://turk.shab.boo/" });
  // its one limit: an old-domain window left open is focused instead (the site is gone, so it shows an error)
  assert.deepEqual(oldWorker(URL_NOW, OLD, [OLD]), { focus: 0 });
});

test("the current worker focuses an open window of the reminder's site, else opens its URL", () => {
  const self = "https://turk.shab.boo/sw.js";
  assert.deepEqual(clickTarget(URL_NOW, self, ["https://example.com/", "https://turk.shab.boo/path"]), { focus: 1 });
  assert.deepEqual(clickTarget(URL_NOW, self, ["https://example.com/"]), { open: "https://turk.shab.boo/" });
  assert.deepEqual(clickTarget(undefined, self, []), { open: "https://turk.shab.boo/" });
  assert.deepEqual(clickTarget("/stories", "http://localhost:8787/sw.js", []), { open: "http://localhost:8787/stories" });
});
