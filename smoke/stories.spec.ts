import { expect, test } from "@playwright/test";
import { signUp, uid } from "./helpers.ts";

// ROADMAP.md M8's exit: a new learner builds a character in onboarding, sees it in the app bar, and plays s1e01 to the end
// (the dev server builds with drafts, and ?stories opens the stories before the launch); s1e02 stays shut until then; the reading
// is recorded in `st`.
test("a new account builds a character and plays s1e01 to the end", async ({ page }) => {
  test.setTimeout(300_000);           // CI draws the stage in software, several times slower than a laptop
  await page.goto("/?fresh&stories");
  await signUp(page, `st${uid()}`);
  const primary = page.locator(".onb-foot .btn.primary");
  const step = async (heading: string) => { await expect(page.locator(".onb h1")).toHaveText(heading); };
  await step("Hoş geldin!"); await primary.click();
  await step("Sen nasılsın?");
  await expect(page.locator(".av-builder .sahne-bld")).toBeVisible({ timeout: 20_000 });
  await primary.click();                                  // "Looks like me!": the builder's character is saved
  await step("Biraz anlat!"); await primary.click();
  await step("Ne kadar Türkçe biliyorsun?");
  await page.getByText("Brand new", { exact: true }).click();
  await primary.click();
  await step("Başlangıç noktan"); await primary.click();
  await step("Günlük hedef"); await primary.click();
  await expect(page.getByRole("heading", { name: "Join a class?" })).toBeVisible();
  await page.getByRole("button", { name: "Class 504" }).click();
  await expect(page.getByRole("heading", { name: "Daily reminder" })).toBeVisible();
  await page.locator(".onb-foot").getByRole("button", { name: /Not now|Continue/ }).click();
  await page.getByRole("button", { name: "Look around first" }).click();
  await expect(page.getByRole("dialog", { name: "Welcome" })).toHaveCount(0);
  // the character is a Sahne document, drawn in the app bar
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith("kumru:progress:"))!)!).char?.v)).toBe(1);
  await expect(page.locator("#userchip .chr.sahne")).toBeVisible({ timeout: 20_000 });

  // the stories open in order: s1e02 waits for s1e01, and says so
  await page.goto("/stories/s1e02");
  await expect(page.locator("#toast")).toContainText("first", { timeout: 30_000 });
  await expect(page.locator(".st-page")).toHaveCount(0);

  await page.goto("/stories/s1e01");
  await expect(page.locator(".st-foot")).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 200; i++) {
    const foot = page.locator(".st-foot");
    if (await foot.locator(".st-end").count()) break;
    const next = foot.getByRole("button", { name: /^(Next question|Finish)$/ });
    if (await next.count()) { await next.click(); continue; }
    const quiz = foot.locator(".st-quiz button.st-opt:not([disabled])");
    // a wrong answer is disabled here so the next try takes another option
    if (await foot.locator(".st-quiz").count()) { await quiz.first().evaluate((b: HTMLButtonElement) => { b.click(); b.disabled = true; }); continue; }
    const say = foot.getByRole("button", { name: "Söyle" });
    if (await say.count()) { await say.click(); continue; }
    if (await foot.locator(".st-opt").count()) { await foot.locator(".st-opt").first().click(); continue; }
    // Devam stays one button while a cue plays and when it ends; a footer redrawn meanwhile (a reply card) is read again next turn
    await foot.getByRole("button", { name: "Devam" }).click({ timeout: 5_000 }).catch(() => undefined);
  }
  await expect(page.locator(".st-end")).toBeVisible();
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith("kumru:progress:"))!)!).st?.s1e01);
  expect(st).toMatchObject({ done: true, reads: 1 });
  expect(st.stars).toBeGreaterThanOrEqual(1);
});
