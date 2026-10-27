/* Sessions: who is calling (docs/SPECS.md section 8, docs/SPECS_API.md section 1.3). Every feature needs these; passwords, recovery
   codes and the Turnstile check are the account feature's (credentials.ts). */
import type { User } from "../../shared/api.ts";
import { b64url, randomBase32, randomBytes, sha256 } from "./crypto.ts";
import { first, run } from "./db.ts";
import type { Env } from "./env.ts";
import { HttpError } from "./http.ts";
import { ANON, hitIp } from "./limits.ts";
import type { Ctx } from "./router.ts";

export const DAY = 86_400_000;
export const SESSION_DAYS = 90;

export interface UserRow { id: string; username: string; role: User["role"]; plan: User["plan"]; created: number; tz: string | null;
  deleted: number | null; pw_hash: unknown; pw_salt: unknown; pw_iter: number; recovery_hash: unknown }
export interface Authed { user: UserRow; sessionId: string }

export const publicUser = (u: Pick<UserRow, "id" | "username" | "role" | "plan">): User =>
  ({ id: u.id, username: u.username, role: u.role, plan: u.plan });

/** A new session: the statement to run (alone or in a batch) and the token to hand out once. */
export async function newSession(env: Env, userId: string, label: string, now = Date.now()) {
  const token = b64url(randomBytes(32));
  const id = randomBase32(10).slice(0, 16);
  const stmt = env.DB.prepare(
    "INSERT INTO sessions (id, token_hash, user_id, label, created, refreshed, expires) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).bind(id, await sha256(token), userId, label, now, now, now + SESSION_DAYS * DAY);
  return { token, id, stmt };
}

function bearer(req: Request): string | null {
  const h = req.headers.get("Authorization") || "";
  const m = /^Bearer ([A-Za-z0-9_-]{20,100})$/.exec(h);
  return m ? m[1] : null;
}

/** The caller's session, or null. Slides `expires` at most once a day. */
export async function authenticate(ctx: Ctx): Promise<Authed | null> {
  const token = bearer(ctx.req);
  if (!token) return null;
  const now = Date.now();
  const row = await first<UserRow & { sid: string; refreshed: number; expires: number }>(ctx.env.DB,
    `SELECT s.id AS sid, s.refreshed, s.expires, u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?`, await sha256(token));
  if (!row || row.expires < now || row.deleted) return null;
  if (now - row.refreshed > DAY) {
    await run(ctx.env.DB, "UPDATE sessions SET refreshed = ?, expires = ? WHERE id = ?", now, now + SESSION_DAYS * DAY, row.sid);
  }
  return { user: row, sessionId: row.sid };
}

export async function requireUser(ctx: Ctx): Promise<Authed> {
  const a = ctx.authed !== undefined ? ctx.authed : (ctx.authed = await authenticate(ctx));
  if (!a) {
    await hitIp(ctx.env.DB, ctx.env, ANON, ctx.req);
    throw new HttpError("unauthorized", "Sign in to do that.");
  }
  return a;
}

/** Routes anyone may call count against the `anon` limit. */
export async function anonymous(ctx: Ctx): Promise<void> {
  await hitIp(ctx.env.DB, ctx.env, ANON, ctx.req);
}
