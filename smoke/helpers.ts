import { type Page, expect } from "@playwright/test";

/**
 * True once the session is stored. Signing up or in reloads the page, and an evaluate that runs
 * during the reload throws "Execution context was destroyed"; that counts as "not yet", not a failure.
 */
/** A short id for usernames, unique per call, so repeated and retried tests never collide. */
export const uid = () => Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 4);

const hasSession = (page: Page) =>
  page.evaluate(() => !!localStorage.getItem("kumru:session")).catch(() => false);

/** Create an account through the sign-in gate (nobody uses the app signed out) and wait for the reload. */
export async function signUp(page: Page, username: string, password = "smoke-password") {
  await page.getByRole("button", { name: "Create account" }).click();
  const form = page.getByRole("dialog", { name: "Create an account" });
  await form.locator("input[autocomplete=username]").fill(username);
  await form.locator("input[type=password]").fill(password);
  await form.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Your recovery code")).toBeVisible();
  // the recovery sheet can't be dismissed until the box is ticked; Escape and the backdrop do nothing before that
  await page.keyboard.press("Escape");
  await expect(page.getByText("Your recovery code")).toBeVisible();
  await page.getByLabel("I've saved it").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect.poll(() => hasSession(page)).toBe(true);
  await expect(page.getByRole("button", { name: "Create account" })).toHaveCount(0);
}

export async function signIn(page: Page, username: string, password = "smoke-password") {
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Sign in" });
  await form.locator("input[autocomplete=username]").fill(username);
  await form.locator("input[type=password]").fill(password);
  await form.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect.poll(() => hasSession(page)).toBe(true);
}

/**
 * Walk a new learner's onboarding (app/features/onboarding, `full` mode) in English: the language, the name, the five character
 * steps of the builder (each saves the character), the hometown left empty, the class (`klass`, or none), the reminder skipped,
 * and the cast's "Look around first". The flow is gone afterwards.
 */
export async function walkOnboarding(page: Page, o: { klass?: string } = {}) {
  const next = page.locator(".onb-foot .onb-nav .btn.primary");
  const step = async (heading: string) => { await expect(page.locator(".onb h1")).toHaveText(heading); };
  await expect(page.getByRole("dialog", { name: "Welcome" })).toBeVisible();
  await step("Hoş geldin!");
  await page.getByRole("radio", { name: "English" }).click();
  await next.click();                                           // language
  await step("Adın ne?"); await next.click();                   // name
  for (const sec of ["Body", "Face", "Hair", "Clothes", "Extras"]) {
    await expect(page.locator(".onb-sec")).toHaveText(sec);
    await expect(page.locator(".av-builder .sahne-bld")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".sahne-bld-moods")).toHaveCount(0);  // no emotion strip
    await next.click();                                         // the last is "Looks like me!"
  }
  await step("Nerelisin?"); await next.click();                 // hometown, left empty
  await step("Sınıfın var mı?");
  await expect(page.getByRole("button", { name: "Class 506" })).toBeVisible();
  if (o.klass) await page.getByRole("button", { name: "Class " + o.klass }).click();
  else await next.click();
  await step("Hatırlatıcı");
  await page.locator(".onb-foot").getByRole("button", { name: /^(Not now|Next)$/ }).click();
  await page.getByRole("button", { name: "Look around first" }).click();
  await expect(page.getByRole("dialog", { name: "Welcome" })).toHaveCount(0);
}
