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
