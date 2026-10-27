/* fetch for /api (docs/SPECS_API.md section 1): the bearer token, the client version header and one error
   shape. Every failure becomes `{ code, message, ... }` with a code from shared/api.ts; a network
   failure is the client-only `offline`. A 401 forgets the session; a 426 asks for the new version. */
import type { ErrorCode } from "../../shared/api.ts";
import { lsDel, lsGet, lsSet } from "./storage.ts";

export interface ApiFailure {
  code: ErrorCode;
  message: string;
  status?: number;
  retryAfter?: number;
  rev?: number;
  updated?: number;
  body?: unknown;
  field?: string;
}

export const clientVersion = (): string => document.querySelector('meta[name="kumru-version"]')?.getAttribute("content") || "dev";

export const getToken = (): string | null => lsGet("session");
export const setToken = (token: string): void => lsSet("session", token);

/** Forget the account on this device (sign-out, 401). The page's own copies go too. */
export function forgetSession(): void {
  const me = lsGet("me");
  let id = "";
  try { id = me ? JSON.parse(me).id : ""; } catch { /* corrupt */ }
  for (const k of ["session", "me", "dirty", "rev:progress", "rev:tutor", "pending:progress", "pending:tutor", "tutor", "yeni:uid", "yeni:rev", "yeni:doc"]) lsDel(k);
  if (id) lsDel("progress:" + id);
}

let skew = 0;
/** The time by the server's clock (the `Date` of its last answer) when the device's is more than two minutes off; the device's offline. Story release days use it. */
export const serverNow = (): number => Date.now() + skew;

/**
 * `timeout` (ms) gives up with `offline` ("timed out") instead of waiting for ever.
 * Resolves for 2xx and 304; anything else rejects with an ApiFailure.
 */
export async function api(method: string, path: string, body?: unknown, opts?: { timeout?: number }): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = { "X-Kumru-Client": clientVersion() };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let r: Response;
  const ctl = opts && opts.timeout ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), opts && opts.timeout) : 0;
  try {
    r = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store", signal: ctl ? ctl.signal : undefined });
  } catch (e) {
    throw { code: "offline", message: ctl && ctl.signal.aborted ? "The request timed out." : "No connection: " + String(e) } satisfies ApiFailure;
  } finally {
    clearTimeout(timer);
  }
  const date = Date.parse(r.headers?.get("Date") || "");
  if (date) skew = Math.abs(date - Date.now()) > 120_000 ? date - Date.now() : 0;
  const text = r.status === 204 || r.status === 304 ? "" : await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
  if (r.ok || r.status === 304) return { status: r.status, json };
  const err = (json && json.error) || { code: r.status >= 500 ? "internal" : "invalid", message: `HTTP ${r.status}` };
  if (err.code === "unauthorized" && token) {
    forgetSession();
    dispatchEvent(new Event("kumru:signedout"));
  }
  if (err.code === "upgrade_required") dispatchEvent(new Event("kumru:update"));
  throw { ...err, status: r.status } as ApiFailure;
}

/** True for failures worth retrying later with the same body (docs/SPECS_API.md section 1.9). */
export const retryable = (e: ApiFailure): boolean =>
  e.code === "offline" || e.code === "internal" || e.code === "quota_exceeded" || e.code === "rate_limited";
