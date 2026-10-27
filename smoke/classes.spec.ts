import { expect, test } from "@playwright/test";
import { signUp } from "./helpers.ts";

// a teacher starts a class, and deleting it takes Manage class, a confirmation and the class name typed
test("deleting a class asks first and needs its name", async ({ page }) => {
  await page.goto("/friends?fresh&learner");
  await signUp(page, `cls${Date.now().toString(36).slice(-6)}`);
  await page.getByRole("button", { name: "Start a class" }).click();
  await page.getByLabel(/Class name/).fill("Smoke Class");
  await page.getByRole("button", { name: "Create class" }).click();
  await expect(page.locator(".cl-page .cl-title")).toHaveText("Smoke Class");
  await expect(page).toHaveURL(/\/c\/[0-9A-Z]{6}/);
  // no delete button on the page itself, only under Manage class
  await expect(page.locator(".cl-page").getByRole("button", { name: /^Delete/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Manage class" }).click();
  await page.getByRole("button", { name: /Delete this class/ }).click();
  const confirm = page.getByRole("button", { name: "Delete class", exact: true });
  await expect(confirm).toBeDisabled();
  await page.getByPlaceholder("Smoke Class").fill("smoke");
  await expect(confirm).toBeDisabled();
  await page.getByPlaceholder("Smoke Class").fill("Smoke Class");
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.locator(".cl-page")).toHaveCount(0);
  await expect(page).toHaveURL(/\/friends/);
});
