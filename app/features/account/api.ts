// The account routes' client (docs/SPECS.md section 8, docs/SPECS_API.md section 4; worker/features/account). Each call that
// signs in stores the session token and the user, then the page reloads so boot runs once with the new identity
// (docs/SPECS.md section 8.7).
import type { User } from "../../../shared/api.ts";
import { lsSet } from "../../host/storage.ts";
import { api, forgetSession, setToken, type ApiFailure } from "../../host/transport.ts";

function signedIn(r: { token: string; user: User }) {
  setToken(r.token);
  lsSet("me", JSON.stringify(r.user));
}

/** "iPhone · Safari", shown in Signed-in devices. */
export function deviceLabel(): string {
  const ua = navigator.userAgent;
  const dev = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Device";
  const br = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${dev} · ${br}`;
}

const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return undefined; } };
/** Give up on a sign-in request that has not answered in 25 s, so a form never waits for ever. */
const SLOW = { timeout: 25_000 };
const who = () => ({ tz: tz(), label: deviceLabel() });

export interface TurnstileState { token?: string; error?: string; expired?: boolean }

/** The part of Cloudflare's Turnstile script (window.turnstile) this page uses. */
interface TurnstileWidget { render(box: HTMLElement, o: object): unknown; reset(id: unknown): void }

const TURNSTILE_KEY = () => document.querySelector('meta[name="kumru-turnstile"]')?.getAttribute("content") || "";

/** The human check, drawn into `box` when the site has one. `on` hears every change: `{ token }` when the check passed
 * (an empty token when the site has no check), `{ error }` when the widget or its script failed, `{ expired: true }` when a
 * passed token ran out. `reset()` asks for a fresh check (after a failed submit the token is spent). `needed` is false
 * without a site key. */
export function turnstile(box: HTMLElement, on: (s: TurnstileState) => void): { needed: boolean; reset: () => void } {
  const key = TURNSTILE_KEY();
  if (!key) { on({ token: "" }); return { needed: false, reset() { on({ token: "" }); } }; }
  let id: unknown = null;
  const w = () => (window as unknown as { turnstile?: TurnstileWidget }).turnstile!;
  const render = () => {
    try {
      id = w().render(box, {
        sitekey: key,
        callback: (t: string) => on({ token: t }),
        "error-callback": (c: string) => { on({ error: String(c || "error") }); return true; },
        "expired-callback": () => on({ expired: true }),
        "timeout-callback": () => on({ expired: true }),
      });
    } catch (e) { on({ error: String(e) }); }
  };
  const load = () => {
    if (w()) return render();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = render;
    s.onerror = () => { s.remove(); on({ error: "script" }); };
    document.head.appendChild(s);
  };
  load();
  return {
    needed: true,
    reset() {
      if (id !== null && w()) { try { w().reset(id); return; } catch { /* draw it again */ } }
      box.replaceChildren();
      id = null;
      load();
    },
  };
}

export const account = {
  async signup(username: string, password: string, turnstileToken?: string) {
    const r = await api("POST", "/api/signup", { username, password, turnstile: turnstileToken || "", ...who() }, SLOW);
    signedIn(r.json);
    return { recovery: r.json.recovery as string };
  },
  async login(username: string, password: string) {
    const r = await api("POST", "/api/login", { username, password, ...who() }, SLOW);
    signedIn(r.json);
    return { restored: !!r.json.restored };
  },
  async recover(username: string, recovery: string, password: string) {
    const r = await api("POST", "/api/recover", { username, recovery, password, ...who() }, SLOW);
    signedIn(r.json);
    return { recovery: r.json.recovery as string };
  },
  async logout() {
    try { await api("POST", "/api/logout"); } catch { /* signed out on this device either way */ }
    forgetSession();
  },
  async password(current: string, next: string) {
    await api("POST", "/api/password", { current, next }, SLOW);
  },
  async devices(): Promise<{ current: string; sessions: { id: string; label: string; created: number; refreshed: number }[] }> {
    const r = await api("GET", "/api/me");
    lsSet("me", JSON.stringify(r.json.user));
    return { current: r.json.session.id, sessions: r.json.sessions };
  },
  async revoke(id: string) {
    await api("DELETE", "/api/sessions/" + encodeURIComponent(id));
  },
  /** A one-time code for adding a phone, as text, link and QR (SVG markup). */
  async pairStart() {
    const r = await api("POST", "/api/pair/start");
    const url = `${location.origin}/pair/${r.json.code}`;
    return { code: r.json.code as string, expires: r.json.expires as number, url, svg: await qrSvg(url) };
  },
  async pairClaim(code: string) {
    const r = await api("POST", "/api/pair/claim", { code, ...who() }, SLOW);
    signedIn(r.json);
  },
  /** Download the export file (docs/SPECS_SCHEMA.md section 3.5). */
  async exportData() {
    const r = await api("GET", "/api/export");
    const blob = new Blob([JSON.stringify(r.json, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kumru-${r.json.user.username}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  async deleteAccount(password: string) {
    await api("POST", "/api/delete", { password });
    forgetSession();
  },
  turnstile,
};

/** The QR code of `text` as SVG markup. The encoder loads on first use, so it stays out of the entry chunk. */
export async function qrSvg(text: string): Promise<string> {
  const { qrcode } = await import("./vendor/qrcode.js");
  const q = qrcode(0, "M");
  q.addData(text);
  q.make();
  return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}

/** A `/pair/<code>` link from another phone's QR (the old `#pair=<code>` too): claim it before the page boots, then reload signed in. */
export function claimPairingFromLink(): void {
  const m = /^\/pair\/([0-9A-Za-z-]{12,20})\/?$/.exec(location.pathname) || /^#pair=([0-9A-Za-z-]{12,20})$/.exec(location.hash);
  if (!m) return;
  history.replaceState(null, "", "/" + location.search);
  account.pairClaim(m[1]).then(() => location.reload(), (e: ApiFailure) => {
    dispatchEvent(new CustomEvent("kumru:notice", { detail: e.code === "gone" ? "That code has expired. Make a new one on your other phone." : "Couldn't add this phone: " + (e.message || e.code) }));
  });
}
