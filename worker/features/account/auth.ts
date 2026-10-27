/* Account routes (docs/SPECS_API.md section 4): signup, login, logout, recover, password, me, sessions, pairing. */
import type { LoginOk, Me, PairStartOk, SignupOk } from "../../../shared/api.ts";
import { LOGIN_IP, LOGIN_USER, PAIR, RECOVER, SIGNUP } from "./rules.ts";
import { MIN_PASSWORD, USERNAME_RE, checkPassword, hashPassword, newRecovery, normCode, recoveryMatches, verifyTurnstile } from "./credentials.ts";
import { DAY, type UserRow, anonymous, newSession, publicUser, requireUser } from "../../core/session.ts";
import { device, readJson, str } from "../../core/body.ts";
import { hmac, randomBase32, randomCode } from "../../core/crypto.ts";
import { all, batch, first, isUniqueViolation, run } from "../../core/db.ts";
import { HttpError, json } from "../../core/http.ts";
import { check, clear, clientIp, hit, hitIp } from "../../core/limits.ts";
import type { Ctx } from "../../core/router.ts";

const RESTORE_WINDOW = 7 * DAY;

function username(o: Record<string, unknown>): string {
  const u = str(o, "username").trim().toLowerCase();
  if (!USERNAME_RE.test(u)) throw new HttpError("invalid", "A username is 3–24 letters, digits, _ or .", { field: "username" });
  return u;
}

function password(o: Record<string, unknown>, field = "password"): string {
  const p = str(o, field, { max: 200 });
  if (p.length < MIN_PASSWORD) throw new HttpError("invalid", `A password has at least ${MIN_PASSWORD} characters.`, { field });
  return p;
}

const findUser = (ctx: Ctx, name: string) => first<UserRow>(ctx.env.DB, "SELECT * FROM users WHERE username = ?", name);

export async function signup(ctx: Ctx): Promise<Response> {
  const ip = clientIp(ctx.req);
  await anonymous(ctx);
  await hitIp(ctx.env.DB, ctx.env, SIGNUP, ctx.req);
  const o = await readJson(ctx.req);
  const name = username(o), pw = password(o), { tz, label } = device(o);
  await verifyTurnstile(ctx.env, o.turnstile, ip);
  const now = Date.now(), id = randomBase32(16);
  const { hash, salt, iter } = await hashPassword(ctx.env, pw);
  const rec = await newRecovery(ctx.env);
  const s = await newSession(ctx.env, id, label, now);
  try {
    await batch(ctx.env.DB, [
      ctx.env.DB.prepare(
        "INSERT INTO users (id, username, pw_hash, pw_salt, pw_iter, recovery_hash, tz, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(id, name, hash, salt, iter, rec.hash, tz, now),
      s.stmt,
    ]);
  } catch (e) {
    if (isUniqueViolation(e)) throw new HttpError("taken", "That username is taken.", { field: "username" });
    throw e;
  }
  const out: SignupOk = { token: s.token, user: publicUser({ id, username: name, role: "learner", plan: "free" }), recovery: rec.shown };
  return json(out, 201);
}

export async function login(ctx: Ctx): Promise<Response> {
  const ip = clientIp(ctx.req), db = ctx.env.DB;
  await anonymous(ctx);
  const o = await readJson(ctx.req);
  const name = str(o, "username", { max: 64 }).trim().toLowerCase(), pw = str(o, "password", { max: 200 }), { tz, label } = device(o);
  await check(db, LOGIN_USER, name);
  await check(db, LOGIN_IP, ip);
  const u = await findUser(ctx, name);
  const now = Date.now();
  const usable = u && (!u.deleted || now - u.deleted < RESTORE_WINDOW);
  if (!u || !usable || !(await checkPassword(ctx.env, u, pw))) {
    await hit(db, LOGIN_USER, name);
    await hit(db, LOGIN_IP, ip);
    throw new HttpError("invalid", "That username and password don't match.");
  }
  await clear(db, LOGIN_USER, name);
  const s = await newSession(ctx.env, u.id, label, now);
  const stmts = [s.stmt];
  if (u.deleted) stmts.push(db.prepare("UPDATE users SET deleted = NULL WHERE id = ?").bind(u.id));
  if (tz && tz !== u.tz) stmts.push(db.prepare("UPDATE users SET tz = ? WHERE id = ?").bind(tz, u.id));
  await batch(db, stmts);
  const out: LoginOk = { token: s.token, user: publicUser(u), ...(u.deleted ? { restored: true } : {}) };
  return json(out);
}

export async function logout(ctx: Ctx): Promise<Response> {
  const a = await requireUser(ctx);
  await run(ctx.env.DB, "DELETE FROM sessions WHERE id = ?", a.sessionId);
  return new Response(null, { status: 204 });
}

export async function recover(ctx: Ctx): Promise<Response> {
  const db = ctx.env.DB;
  await anonymous(ctx);
  const o = await readJson(ctx.req);
  const name = str(o, "username", { max: 64 }).trim().toLowerCase();
  await hit(db, RECOVER, name);
  const code = str(o, "recovery", { max: 40 }), pw = password(o), { tz, label } = device(o);
  const u = await findUser(ctx, name);
  if (!u || u.deleted || !(await recoveryMatches(ctx.env, u, code))) {
    throw new HttpError("invalid", "That username and recovery code don't match.");
  }
  const { hash, salt, iter } = await hashPassword(ctx.env, pw);
  const rec = await newRecovery(ctx.env);
  const s = await newSession(ctx.env, u.id, label);
  await batch(db, [
    db.prepare("UPDATE users SET pw_hash = ?, pw_salt = ?, pw_iter = ?, recovery_hash = ?, tz = COALESCE(?, tz) WHERE id = ?")
      .bind(hash, salt, iter, rec.hash, tz, u.id),
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(u.id),
    db.prepare("DELETE FROM yeni_tokens WHERE user_id = ?").bind(u.id),
    db.prepare("DELETE FROM yeni_codes WHERE user_id = ?").bind(u.id),
    s.stmt,
  ]);
  return json({ token: s.token, user: publicUser(u), recovery: rec.shown });
}

export async function changePassword(ctx: Ctx): Promise<Response> {
  const { user, sessionId } = await requireUser(ctx);
  const o = await readJson(ctx.req);
  const current = str(o, "current", { max: 200 }), next = password(o, "next");
  if (!(await checkPassword(ctx.env, user, current))) throw new HttpError("invalid", "The current password is wrong.", { field: "current" });
  const { hash, salt, iter } = await hashPassword(ctx.env, next);
  await batch(ctx.env.DB, [
    ctx.env.DB.prepare("UPDATE users SET pw_hash = ?, pw_salt = ?, pw_iter = ? WHERE id = ?").bind(hash, salt, iter, user.id),
    ctx.env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND id <> ?").bind(user.id, sessionId),
    ctx.env.DB.prepare("DELETE FROM yeni_tokens WHERE user_id = ?").bind(user.id),
    ctx.env.DB.prepare("DELETE FROM yeni_codes WHERE user_id = ?").bind(user.id),
  ]);
  return json({});
}

export async function me(ctx: Ctx): Promise<Response> {
  const { user, sessionId } = await requireUser(ctx);
  const sessions = await all<{ id: string; label: string; created: number; refreshed: number }>(ctx.env.DB,
    "SELECT id, label, created, refreshed FROM sessions WHERE user_id = ? ORDER BY refreshed DESC LIMIT 20", user.id);
  const out: Me = { user: { ...publicUser(user), created: user.created, ...(user.tz ? { tz: user.tz } : {}) }, session: { id: sessionId }, sessions };
  return json(out);
}

export async function deleteSession(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const r = await run(ctx.env.DB, "DELETE FROM sessions WHERE id = ? AND user_id = ?", ctx.params.id, user.id);
  if (!r.meta.changes) throw new HttpError("not_found", "No such device.");
  return new Response(null, { status: 204 });
}

export async function pairStart(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const code = randomCode(12), expires = Date.now() + 5 * 60_000;
  await batch(ctx.env.DB, [
    ctx.env.DB.prepare("DELETE FROM pairings WHERE user_id = ?").bind(user.id),
    ctx.env.DB.prepare("INSERT INTO pairings (code_hash, user_id, expires) VALUES (?, ?, ?)")
      .bind(await hmac(ctx.env.PEPPER, code), user.id, expires),
  ]);
  const out: PairStartOk = { code, expires };
  return json(out);
}

export async function pairClaim(ctx: Ctx): Promise<Response> {
  await anonymous(ctx);
  await hitIp(ctx.env.DB, ctx.env, PAIR, ctx.req);
  const o = await readJson(ctx.req);
  const code = normCode(str(o, "code", { max: 40 })), { label } = device(o);
  if (code.length !== 12) throw new HttpError("invalid", "A pairing code has 12 characters.", { field: "code" });
  const now = Date.now();
  const row = await first<{ user_id: string }>(ctx.env.DB,
    "DELETE FROM pairings WHERE code_hash = ? AND expires > ? RETURNING user_id", await hmac(ctx.env.PEPPER, code), now);
  if (!row) throw new HttpError("gone", "That code has expired or was already used.");
  const u = await first<UserRow>(ctx.env.DB, "SELECT * FROM users WHERE id = ? AND deleted IS NULL", row.user_id);
  if (!u) throw new HttpError("gone", "That account is gone.");
  const s = await newSession(ctx.env, u.id, label, now);
  await s.stmt.run();
  return json({ token: s.token, user: publicUser(u) });
}
