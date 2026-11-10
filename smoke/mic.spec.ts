import { type Page, expect, test } from "@playwright/test";
import { signUp, uid } from "./helpers.ts";

// docs/stories/STORIES_STAGE.md §7: the microphone on a card never stands in the way of a tap. Headless Chromium has no speech
// service, so the page gets a stand-in: a Chrome brand (voice.ts hides the microphone in browsers without a service), the
// microphone not blocked, and a recogniser that either hears nothing or never ends.
async function withMic(page: Page, mode: "silent" | "stuck") {
  await page.addInitScript((mode) => {
    Object.defineProperty(Navigator.prototype, "userAgentData", { get: () => ({ brands: [{ brand: "Google Chrome", version: "152" }] }), configurable: true });
    if (navigator.permissions) navigator.permissions.query = (async () => ({ state: "prompt", addEventListener() {} })) as unknown as Permissions["query"];
    class Fake {
      onstart?: () => void; onerror?: (e: { error: string }) => void; onend?: () => void;
      start() {
        setTimeout(() => this.onstart?.(), 30);
        if (mode === "silent") setTimeout(() => { this.onerror?.({ error: "no-speech" }); this.onend?.(); }, 400);
      }
      stop() { this.onend?.(); }
      abort() { this.onend?.(); }
    }
    Object.assign(window, { SpeechRecognition: Fake, webkitSpeechRecognition: Fake });
  }, mode);
}

/** Signed up, in s1e01, at its first choice (the reply to "Hoş geldin"), with the microphone under the options. */
async function atFirstChoice(page: Page) {
  await page.goto("/profile?learner");
  await signUp(page, `mic${uid()}`);
  await page.goto("/stories/s1e01?stories");
  const foot = page.locator(".st-foot");
  await expect(foot).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 60 && !(await foot.locator(".st-choose").count()); i++)
    await foot.getByRole("button", { name: "Devam" }).click({ timeout: 3_000 }).catch(() => undefined);
  await expect(foot.locator(".st-choose .st-mic")).toBeVisible();
  return foot;
}

test("after the microphone hears nothing, tapping an option still picks it", async ({ page }) => {
  test.setTimeout(120_000);
  await withMic(page, "silent");
  const foot = await atFirstChoice(page);
  await foot.locator(".st-mic").click();
  await expect(foot.locator(".st-heard")).toContainText("tap your answer");
  const opt = foot.locator(".st-opt").first();
  const text = (await opt.locator("[lang=tr]").textContent())!;
  await opt.click();
  await expect(page.locator(".st-log")).toContainText(text, { timeout: 15_000 });
});

test("tapping an option while the microphone listens picks it, and stops the microphone", async ({ page }) => {
  test.setTimeout(120_000);
  await withMic(page, "stuck");
  const foot = await atFirstChoice(page);
  await foot.locator(".st-mic").click();
  await expect(foot.locator(".st-mic")).toHaveAttribute("aria-pressed", "true");
  const opt = foot.locator(".st-opt").first();
  const text = (await opt.locator("[lang=tr]").textContent())!;
  await opt.click();
  await expect(page.locator(".st-log")).toContainText(text, { timeout: 15_000 });
  await expect(foot.locator(".st-choose")).toHaveCount(0);
});
