/* Passwords, recovery codes and the Turnstile check: the account feature's credentials (docs/SPECS.md section 8). */
import { type Bytes, bytesOf, equalBytes, hmac, pbkdf2, randomBytes, randomCode } from "../../core/crypto.ts";
import type { Env } from "../../core/env.ts";
import { HttpError } from "../../core/http.ts";
import type { UserRow } from "../../core/session.ts";

export const USERNAME_RE = /^[a-z0-9_.]{3,24}$/;
export const MIN_PASSWORD = 8;

export function iterations(env: Env): number {
  const n = Number(env.PBKDF2_ITER);
  return Number.isInteger(n) && n >= 1000 ? n : 50_000;
}

export async function hashPassword(env: Env, password: string): Promise<{ hash: Bytes; salt: Bytes; iter: number }> {
  const salt = randomBytes(16), iter = iterations(env);
  return { hash: await pbkdf2(password, env.PEPPER, salt, iter), salt, iter };
}

export async function checkPassword(env: Env, u: UserRow, password: string): Promise<boolean> {
  const got = await pbkdf2(password, env.PEPPER, bytesOf(u.pw_salt), u.pw_iter);
  return equalBytes(got, bytesOf(u.pw_hash));
}

/** Recovery and pairing codes ignore dashes, spaces and case. */
export const normCode = (code: string) => code.toUpperCase().replace(/[^0-9A-Z]/g, "");

export async function newRecovery(env: Env): Promise<{ shown: string; hash: Bytes }> {
  const code = randomCode(10);
  return { shown: `${code.slice(0, 5)}-${code.slice(5)}`, hash: await hmac(env.PEPPER, code) };
}

export async function recoveryMatches(env: Env, u: UserRow, code: string): Promise<boolean> {
  return equalBytes(await hmac(env.PEPPER, normCode(code)), bytesOf(u.recovery_hash));
}

export async function verifyTurnstile(env: Env, token: unknown, ip: string): Promise<void> {
  if (!env.TURNSTILE_SITE_KEY) return;
  if (typeof token !== "string" || !token) throw new HttpError("invalid", "Please complete the check.", { field: "turnstile" });
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET_KEY);
  form.append("response", token);
  form.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const out = await r.json<{ success?: boolean }>().catch(() => ({ success: false }));
  if (!out.success) throw new HttpError("invalid", "The check failed. Try again.", { field: "turnstile" });
}
