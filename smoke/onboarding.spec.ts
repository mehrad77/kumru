import { expect, test } from "@playwright/test";
import { signUp, walkOnboarding } from "./helpers.ts";

// a new account walks the full onboarding (language, name, the character, hometown): class 504 is offered and joined, the reminder
// is skipped; no level or path step
test("a new account joins class 504 in onboarding", async ({ page }) => {
  await page.goto("/?fresh");
  await signUp(page, `onb${Date.now().toString(36).slice(-6)}`);
  await walkOnboarding(page, { klass: "504" });
  const classes = await page.evaluate(async () => {
    const r = await fetch("/api/classes", { headers: { Authorization: "Bearer " + localStorage.getItem("kumru:session") } });
    return (await r.json()).classes.map((c: { name: string }) => c.name);
  });
  expect(classes).toEqual(["504"]);
});
