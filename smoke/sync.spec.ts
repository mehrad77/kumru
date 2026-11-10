import { isDeepStrictEqual } from "node:util";
import { type Page, expect, test } from "@playwright/test";
import { signIn, signUp } from "./helpers.ts";

// docs/SPECS.md section 11.5: sign up, practise, sign in from a second context, answer on both, both end on one document.
const password = "smoke-password";

async function answerOne(page: Page) {
  await page.goto("/path?tree&skill=sk_hello&only=choice");
  const choice = page.locator(".choice").first();
  await expect(choice).toBeVisible();
  await choice.click();
}

const serverDoc = (page: Page) => page.evaluate(async () => {
  const r = await fetch("/api/doc/progress", { headers: { Authorization: "Bearer " + localStorage.getItem("kumru:session") } });
  return r.json();
});
const localDoc = (page: Page) => page.evaluate(() => {
  const me = JSON.parse(localStorage.getItem("kumru:me") || "{}");
  return JSON.parse(localStorage.getItem("kumru:progress:" + me.id) || "null");
});
const settled = (page: Page) => page.evaluate(() => !localStorage.getItem("kumru:dirty"));

test("two devices on one account end on one document", async ({ browser }) => {
  const user = `smoke${(Date.now() + Math.random()).toString(36).replace(".", "").slice(-8)}`;
  const a = await (await browser.newContext()).newPage();
  await a.goto("/profile?learner");
  await signUp(a, user, password);

  await answerOne(a);
  await expect.poll(async () => (await serverDoc(a)).rev, { timeout: 15_000 }).toBeGreaterThan(0);

  const b = await (await browser.newContext()).newPage();
  await b.goto("/profile?learner");
  await signIn(b, user, password);
  const before = (await serverDoc(b)).rev;
  await answerOne(b);
  // the page saves 1.2 s after the last change; wait for B's save to land on the server
  await expect.poll(async () => (await serverDoc(b)).rev, { timeout: 15_000 }).toBeGreaterThan(before);
  await expect.poll(() => settled(b), { timeout: 15_000 }).toBe(true);

  // A comes back to the front: it pulls, merges, and both copies match the server's
  // pulls are throttled to one per 10 s, so keep nudging until one goes through
  const target = JSON.stringify((await serverDoc(b)).body.conf);
  await expect.poll(async () => {
    await a.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    return JSON.stringify((await localDoc(a))?.conf);
  }, { timeout: 30_000, intervals: [1000] }).toBe(target);
  await expect.poll(() => settled(a), { timeout: 15_000 }).toBe(true);
  // B pulls too, and all three end equal. Read the server each time: a device may save once more after its merge, so a
  // snapshot of the server taken earlier can go stale (CI saw both copies off by one save)
  await expect.poll(async () => {
    for (const p of [a, b]) await p.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    const [server, la, lb] = [(await serverDoc(a)).body.conf, (await localDoc(a))?.conf, (await localDoc(b))?.conf];
    const diff = (x: Record<string, unknown> | undefined) => Object.keys({ ...x, ...server }).filter((k) => !isDeepStrictEqual(x?.[k], server[k])).map((k) => `${k}: ${JSON.stringify(x?.[k])} vs server ${JSON.stringify(server[k])}`);
    return { a: diff(la), b: diff(lb), empty: Object.keys(server).length === 0 };
  }, { timeout: 45_000, intervals: [1000] }).toEqual({ a: [], b: [], empty: false });
});
