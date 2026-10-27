import { expect, test } from "@playwright/test";
import { signUp, uid } from "./helpers.ts";

// docs/SPECS.md section 14, phase 3: an invite link follows after signup.

test("a friend link follows the inviter after the invitee signs up", async ({ browser }) => {
  const stamp = uid();
  const a = await (await browser.newContext()).newPage();
  await a.goto("/profile?learner");
  await signUp(a, `inv${stamp}a`, "invite-password");
  await a.goto("/friends");
  const code = a.locator(".fr-fcode");
  await expect(code).toHaveText(/^[2-9A-Z]{6}$/, { timeout: 20_000 });
  const friendCode = (await code.textContent())!;

  const b = await (await browser.newContext()).newPage();
  await b.goto(`/f/${friendCode}?learner`);
  await expect(b).toHaveURL(/\/friends(\?|$)/);
  await b.goto("/profile?learner");
  await signUp(b, `inv${stamp}b`, "invite-password");
  // the invite lands on Friends by itself; leaving by reload would drop the follow still waiting to be saved
  await expect(b.locator(".fr-sheet, .toast").first()).toBeVisible({ timeout: 20_000 }).catch(() => {});
  await b.getByRole("tab", { name: "Friends" }).click();
  await expect(b.getByText(/You now follow|Following|Friends/).first()).toBeVisible({ timeout: 20_000 });

  // A sees B among its followers
  await expect.poll(() => a.evaluate(async () => {
    const week = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); const w1 = new Date(d.getFullYear(), 0, 4);
      return d.getFullYear() + "-W" + String(1 + Math.round(((+d - +w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7)).padStart(2, "0"); })();
    const r = await fetch("/api/friends?week=" + week, { headers: { Authorization: "Bearer " + localStorage.getItem("kumru:session") } });
    return (await r.json()).followers.length;
  }), { timeout: 20_000 }).toBe(1);
});

test("a /@username link opens that learner's sheet after the visitor signs up", async ({ browser }) => {
  const stamp = uid();
  const nameA = `lnk${stamp}a`;
  const a = await (await browser.newContext()).newPage();
  await a.goto("/profile?learner");
  await signUp(a, nameA, "invite-password");
  await a.goto("/friends");
  await expect(a.locator(".fr-link")).toHaveText(new RegExp(`/@${nameA}$`));
  await expect(a.locator(".fr-fcode")).toHaveText(/^[2-9A-Z]{6}$/, { timeout: 20_000 });   // the profile is saved

  const b = await (await browser.newContext()).newPage();
  await b.goto(`/@${nameA}?learner`);
  await expect(b).toHaveURL(/\/friends(\?|$)/);
  await signUp(b, `lnk${stamp}b`, "invite-password");
  const sheet = b.locator(".fr-sheet");
  await expect(sheet).toBeVisible({ timeout: 20_000 });
  await expect(sheet.getByRole("button", { name: /Follow/ })).toBeVisible();
});
