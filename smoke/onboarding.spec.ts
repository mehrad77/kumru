import { expect, test } from "@playwright/test";
import { signUp } from "./helpers.ts";

// a new account walks the full onboarding: class 504 is offered and joined, the reminder is skipped
test("a new account joins class 504 in onboarding", async ({ page }) => {
  await page.goto("/?fresh");
  await signUp(page, `onb${Date.now().toString(36).slice(-6)}`);
  const primary = page.locator(".onb-foot .btn.primary");
  const step = async (heading: string) => { await expect(page.locator(".onb h1")).toHaveText(heading); };
  await expect(page.getByRole("dialog", { name: "Welcome" })).toBeVisible();
  await step("Hoş geldin!"); await primary.click();       // name
  await step("Sen nasılsın?"); await primary.click();     // avatar
  await step("Biraz anlat!"); await primary.click();      // about you
  await step("Ne kadar Türkçe biliyorsun?");
  await page.getByText("Brand new", { exact: true }).click();
  await primary.click();                                  // self-report (no quiz)
  await step("Başlangıç noktan"); await primary.click();  // start here
  await step("Günlük hedef"); await primary.click();      // daily goal
  await expect(page.getByRole("heading", { name: "Join a class?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Class 506" })).toBeVisible();
  await page.getByRole("button", { name: "Class 504" }).click();
  await expect(page.getByRole("heading", { name: "Daily reminder" })).toBeVisible();
  await page.locator(".onb-foot").getByRole("button", { name: /Not now|Continue/ }).click();
  await page.getByRole("button", { name: "Look around first" }).click();
  await expect(page.getByRole("dialog", { name: "Welcome" })).toHaveCount(0);
  const classes = await page.evaluate(async () => {
    const r = await fetch("/api/classes", { headers: { Authorization: "Bearer " + localStorage.getItem("kumru:session") } });
    return (await r.json()).classes.map((c: { name: string }) => c.name);
  });
  expect(classes).toEqual(["504"]);
});
