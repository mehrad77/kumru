import { expect, test } from "@playwright/test";
import { signUp } from "./helpers.ts";

const mine = (page: import("@playwright/test").Page) => page.evaluate(() => {
  const me = JSON.parse(localStorage.getItem("kumru:me") || "{}");
  return localStorage.getItem("kumru:progress:" + me.id)?.length ?? 0;
});

test("without an account only the sign-in gate shows", async ({ page }) => {
  await page.goto("/?fresh");
  await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  // the app behind the gate is inert: no keyboard or screen-reader way into it
  expect(await page.evaluate(() => !!document.querySelector("#tabs")?.closest("[inert]"))).toBe(true);
});

test("the page boots on the static host and a lesson answer is saved on the device", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/path?fresh&learner&tree&skill=sk_hello&only=choice");
  await signUp(page, `page${Date.now().toString(36).slice(-6)}`);
  const choice = page.locator(".choice").first();
  await expect(choice).toBeVisible();
  const before = await mine(page);
  await choice.click();
  await expect.poll(() => mine(page)).not.toBe(before);
  expect(errors).toEqual([]);
});

test("the API answers health and the invite paths serve the page", async ({ request }) => {
  const h = await request.get("/api/health");
  expect(h.ok()).toBe(true);
  expect((await h.json()).ok).toBe(true);
  const f = await request.get("/f/ABC234");
  expect(f.status()).toBe(200);
  expect(await f.text()).toContain("<title>Kumru");
});
