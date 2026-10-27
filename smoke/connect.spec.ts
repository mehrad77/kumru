import { createHash, randomBytes } from "node:crypto";
import { type Page, expect, test } from "@playwright/test";
import { signUp, uid } from "./helpers.ts";

// docs/SPECS_API.md section 11a, docs/AUTH.md: the reader's /connect/yeni link (code + PKCE + state) goes through the gate, asks, and
// returns with a one-time code in the fragment; the reader trades it for a token, which then reads the notebook cross-origin.
// The reader (localhost:4330, in .dev.vars) is stubbed.

const READER = "http://localhost:4330";
const RETURN = `${READER}/ayarlar/`;
const b64url = (b: Buffer) => b.toString("base64url");

/** What the reader makes on Connect: state, verifier, and the challenge of the verifier. */
function pkce() {
  const verifier = b64url(randomBytes(32));
  return { verifier, state: b64url(randomBytes(32)), challenge: b64url(createHash("sha256").update(verifier).digest()) };
}
const connectUrl = (p: { state: string; challenge: string }, ret = RETURN) =>
  `/connect/yeni?return=${encodeURIComponent(ret)}&state=${p.state}&code_challenge=${p.challenge}&code_challenge_method=S256`;
const stubReader = (page: Page) =>
  page.route(`${READER}/**`, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>reader</title>" }));
const fragment = (page: Page) => new URLSearchParams(new URL(page.url()).hash.slice(1));
const consent = (page: Page) => page.getByRole("dialog", { name: "Connect Notebook" });

test("connecting Notebook: gate, consent, code in the fragment, exchange, notebook", async ({ page }) => {
  await stubReader(page);
  const p = pkce();
  await page.goto(connectUrl(p));
  // the gate says who is asking and offers the way back (with state, as denied)
  await expect(page.getByText("Notebook wants to sync your notes.")).toBeVisible();
  await expect(page.getByRole("link", { name: "← Back to Notebook" })).toHaveAttribute("href", `${RETURN}#yk_error=denied&state=${p.state}`);
  const username = `con${uid()}`;
  await signUp(page, username, "connect-password");
  const sheet = consent(page);
  await expect(sheet.getByText("Defter, notlarını bu hesapla eşitlesin mi?")).toBeVisible({ timeout: 20_000 });
  await expect(sheet.getByText(`@${username}`)).toBeVisible();
  await sheet.getByRole("button", { name: "İzin ver · Allow" }).click();
  await page.waitForURL(new RegExp(`^${READER}/ayarlar/#yk_code=[A-Za-z0-9_-]{43}&state=${p.state}$`));
  const code = fragment(page).get("yk_code")!;
  expect(page.url()).not.toContain("yk=");

  // the reader's own calls, with its Origin (sent from Node: Chrome would not let the stubbed page reach a loopback port)
  const body = { code, verifier: p.verifier, return: RETURN, label: "Smoke · Chrome" };
  const wrong = await page.request.post("/api/yeni/token", { headers: { Origin: READER }, data: { ...body, verifier: b64url(randomBytes(32)) } });
  expect(wrong.status()).toBe(400);
  expect(await wrong.json()).toEqual({ error: "invalid_grant" });   // the code is spent even by a wrong verifier
  expect((await page.request.post("/api/yeni/token", { headers: { Origin: READER }, data: body })).status()).toBe(400);

  // a second connection, this time done right
  const again = pkce();
  await page.goto(connectUrl(again));
  await consent(page).getByRole("button", { name: "İzin ver · Allow" }).click();
  await page.waitForURL(new RegExp(`#yk_code=[A-Za-z0-9_-]{43}&state=${again.state}$`));
  const ex = await page.request.post("/api/yeni/token", { headers: { Origin: READER },
    data: { code: fragment(page).get("yk_code"), verifier: again.verifier, return: RETURN, label: "Smoke · Chrome" } });
  expect(ex.status()).toBe(200);
  expect(ex.headers()["access-control-allow-origin"]).toBe(READER);
  const { token, username: who } = await ex.json();
  expect(who).toBe(username);

  const h = { Authorization: "Bearer " + token, Origin: READER };
  const g = await page.request.get("/api/yeni/doc", { headers: h });
  expect(g.status()).toBe(200);
  expect(await g.json()).toEqual({ rev: 0, doc: null });
  const put = await page.request.put("/api/yeni/doc", { headers: h, data: { baseRev: 0, doc: { v: 1 } } });
  expect(await put.json()).toEqual({ rev: 1 });
});

test("a link that is not the reader's, or is incomplete, gets an error and no redirect", async ({ page }) => {
  await stubReader(page);
  await page.goto("/profile");
  await signUp(page, `cox${uid()}`, "connect-password");
  const p = pkce();
  await page.goto(connectUrl(p, "https://evil.example/"));
  await expect(page.getByText("This link doesn't come from Notebook")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Bu bağlantı Defter'den gelmiyor")).toBeVisible();
  expect(new URL(page.url()).origin).not.toBe("https://evil.example");
  await page.goto(`/connect/yeni?return=${encodeURIComponent(RETURN)}`);   // no state, no challenge
  await expect(page.getByText("This connect link is incomplete or out of date")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Tamam · OK" }).click();
  await expect(consent(page)).toHaveCount(0);
  expect(new URL(page.url()).origin).not.toBe(READER);
});

test("Cancel, the X and Escape all go back to the reader as denied, with the state", async ({ page }) => {
  await stubReader(page);
  await page.goto("/profile");
  await signUp(page, `cox${uid()}`, "connect-password");
  const ways: [string, () => Promise<void>][] = [
    ["Cancel", () => consent(page).getByRole("button", { name: "Vazgeç · Cancel" }).click()],
    ["the X", () => consent(page).getByRole("button", { name: "Close" }).click()],
    ["Escape", () => page.keyboard.press("Escape")],
  ];
  for (const [, close] of ways) {
    const p = pkce();
    await page.goto(connectUrl(p));
    await expect(consent(page).getByRole("button", { name: "İzin ver · Allow" })).toBeVisible({ timeout: 20_000 });
    await close();
    await page.waitForURL(`${RETURN}#yk_error=denied&state=${p.state}`);
  }
});
