/* Notebook (docs/SPECS_API.md section 11a). The reader (yeni.shab.boo) is a static site with no
   server of its own: a learner connects it on /connect/yeni, which issues a bearer token bound to their account, and the
   reader then reads and writes one document, `docs.kind = 'yeni'`, cross-origin with that token. The Worker never parses
   or merges the notebook: a stale baseRev gets 409 with the current copy and the reader merges (like progress).

   Connecting is code + PKCE (docs/AUTH.md): the consent page asks for a one-time code bound to the reader's challenge and
   return URL; the reader trades it for a token with its verifier.

   Session routes (the connect page, the Account card): codes, list, revoke; origins is public (the sign-in gate needs it).
   Bearer routes (the reader, with CORS for YENI_ORIGINS only): the exchange (no auth), GET and PUT the doc, DELETE the
   presented token. GET /api/yeni/check is a bearer route without CORS: the course repo's exam Worker (yeni-sinav) calls
   it server to server, through a service binding, to learn whether a reader token is live. */
import type { YeniCheckOk, YeniCodeNew, YeniCodeOk, YeniDocGet, YeniDocPutOk, YeniExchange, YeniExchangeOk, YeniOrigins, YeniTokenList } from "../../../shared/api.ts";
import { DAY, anonymous, requireUser } from "../../core/session.ts";
import { readJson, str } from "../../core/body.ts";
import { b64url, equalBytes, hmac, randomBase32, randomBytes, sha256 } from "../../core/crypto.ts";
import { all, batch, first, run } from "../../core/db.ts";
import type { Env } from "../../core/env.ts";
import { HttpError, json } from "../../core/http.ts";
import { hit, hitIp } from "../../core/limits.ts";
import { YENI, YENI_CHECK, YENI_CODE, YENI_TOKEN } from "./rules.ts";
import type { Ctx } from "../../core/router.ts";

export const YENI_DOC_MAX = 512 * 1024;
export const YENI_TOKENS_MAX = 10;
export const YENI_CODE_TTL = 5 * 60_000;
const CHALLENGE_RE = /^[A-Za-z0-9_-]{43}$/;
const VERIFIER_RE = /^[A-Za-z0-9._~-]{43,128}$/;
const MIN_INTERVAL = 1000;
const KIND = "yeni";

import { readerOrigins } from "../../core/cors.ts";

export const yeniOrigins = readerOrigins;

/** The origin of a `return` URL when it is one of YENI_ORIGINS, else null. */
export function allowedReturn(env: Env, ret: unknown): string | null {
  if (typeof ret !== "string" || ret.length > 2000) return null;
  let u: URL;
  try { u = new URL(ret); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  return yeniOrigins(env).includes(u.origin) ? u.origin : null;
}

/* ---------- session routes ---------- */

/** GET /api/yeni/origins: where the connect page may send a learner back to. Public: the gate shows it before sign-in. */
export async function origins(ctx: Ctx): Promise<Response> {
  await anonymous(ctx);
  const out: YeniOrigins = { origins: yeniOrigins(ctx.env) };
  return json(out);
}

/** POST /api/yeni/codes { return, challenge }: a one-time code (5 minutes) for the signed-in caller, bound to the
 * reader's PKCE challenge and its return URL. Only its HMAC is kept. */
export async function codes(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const o = await readJson<Partial<YeniCodeNew>>(ctx.req);
  const ret = str(o, "return", { max: 2000 });
  if (!allowedReturn(ctx.env, ret)) throw new HttpError("invalid", "That reader address is not allowed.", { field: "return" });
  const challenge = str(o, "challenge", { max: 64 });
  if (!CHALLENGE_RE.test(challenge)) throw new HttpError("invalid", "The challenge is not a SHA-256 hash.", { field: "challenge" });
  await hit(ctx.env.DB, YENI_TOKEN, user.id);
  const code = b64url(randomBytes(32));
  await run(ctx.env.DB, "INSERT INTO yeni_codes (code_hash, user_id, challenge, return_url, expires) VALUES (?, ?, ?, ?, ?)",
    await hmac(ctx.env.PEPPER, code), user.id, challenge, ret, Date.now() + YENI_CODE_TTL);
  const out: YeniCodeOk = { code };
  return json(out);
}

/** A new reader token for a learner; only its hash is kept, at most 10 per learner (the oldest beyond are revoked). */
async function mintToken(env: Env, userId: string, label: string | null): Promise<string> {
  const token = b64url(randomBytes(32));
  const id = randomBase32(10).slice(0, 16);
  const now = Date.now();
  const db = env.DB;
  await batch(db, [
    db.prepare("INSERT INTO yeni_tokens (id, user_id, token_hash, label, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, userId, await sha256(token), label, now, now),
    db.prepare(`DELETE FROM yeni_tokens WHERE user_id = ?1 AND id NOT IN
      (SELECT id FROM yeni_tokens WHERE user_id = ?1 ORDER BY created_at DESC, rowid DESC LIMIT ?2)`).bind(userId, YENI_TOKENS_MAX),
  ]);
  return token;
}

/** POST /api/yeni/token { code, verifier, return, label? }: the reader trades its one-time code for a bearer token. No
 * session; cross-origin; flat errors. The code is consumed even when the exchange fails (invalid_grant). */
export async function exchange(ctx: Ctx): Promise<Response> {
  await anonymous(ctx);
  await hitIp(ctx.env.DB, ctx.env, YENI_CODE, ctx.req);
  const o = await readJson<Partial<YeniExchange>>(ctx.req);
  const code = str(o, "code", { max: 100 }), verifier = str(o, "verifier", { max: 200 }), ret = str(o, "return", { max: 2000 });
  if (!VERIFIER_RE.test(verifier)) throw new HttpError("invalid", "The verifier is not valid.", { field: "verifier" });
  let label: string | null = null;
  if (o.label !== undefined) {
    if (typeof o.label !== "string") throw new HttpError("invalid", "label must be a string.", { field: "label" });
    // eslint-disable-next-line no-control-regex
    label = o.label.replace(/[\u0000-\u001f\u007f]/g, "").trim();
    if (label.length > 40) throw new HttpError("invalid", "The label is over 40 characters.", { field: "label" });
    label = label || null;
  }
  const row = await first<{ user_id: string; challenge: string; return_url: string }>(ctx.env.DB,
    "DELETE FROM yeni_codes WHERE code_hash = ? AND expires > ? RETURNING user_id, challenge, return_url",
    await hmac(ctx.env.PEPPER, code), Date.now());
  const grant = () => new HttpError("invalid_grant", "That code has expired or was already used.");
  if (!row) throw grant();
  const enc = new TextEncoder();
  const same = equalBytes(enc.encode(b64url(await sha256(verifier))), enc.encode(row.challenge));
  if (!same || ret !== row.return_url) throw grant();
  const u = await first<{ username: string }>(ctx.env.DB, "SELECT username FROM users WHERE id = ? AND deleted IS NULL", row.user_id);
  if (!u) throw grant();
  const out: YeniExchangeOk = { token: await mintToken(ctx.env, row.user_id, label), username: u.username };
  return json(out);
}

/** GET /api/yeni/tokens: the caller's connected readers, newest first. */
export async function list(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const out: YeniTokenList = await all(ctx.env.DB,
    "SELECT id, label, created_at, last_used_at FROM yeni_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT ?", user.id, YENI_TOKENS_MAX);
  return json(out);
}

/** DELETE /api/yeni/tokens/:id: disconnect one reader from Kumru's side. */
export async function revoke(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const r = await run(ctx.env.DB, "DELETE FROM yeni_tokens WHERE id = ? AND user_id = ?", ctx.params.id, user.id);
  if (!r.meta.changes) throw new HttpError("not_found", "No such connection.");
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

/** GET /api/yeni/notebook?since=<rev>: the signed-in learner's own reader notebook, for Kumru's page (book progress, the
 * "continue in the book" line, checkpoint offers). Session auth, same origin only (not a bearer path, so no CORS) and
 * read-only: no `hit()`, so no limits write. One row read. The stored body is passed through as a string, never parsed
 * (CPU limit, docs/SPECS.md section 10.10). 304 when `since` is the stored rev. */
export async function notebook(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const row = await first<{ rev: number; body: string }>(ctx.env.DB, "SELECT rev, body FROM docs WHERE user_id = ? AND kind = ?", user.id, KIND);
  if (!row) return json({ rev: 0, doc: null });
  const since = new URL(ctx.req.url).searchParams.get("since");
  if (since !== null && since !== "" && Number(since) === row.rev) return new Response(null, { status: 304, headers: { "Cache-Control": "no-store" } });
  return new Response(`{"rev":${row.rev},"doc":${row.body}}`, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}

/* ---------- bearer routes ---------- */

interface Reader { tokenId: string; userId: string }

/** The reader token in `Authorization: Bearer`, or 401. A session token is not a reader token (different table). */
async function reader(ctx: Ctx): Promise<Reader> {
  const m = /^Bearer ([A-Za-z0-9_-]{20,100})$/.exec(ctx.req.headers.get("Authorization") || "");
  const row = m ? await first<{ id: string; user_id: string; last_used_at: number; deleted: number | null }>(ctx.env.DB,
    `SELECT t.id, t.user_id, t.last_used_at, u.deleted FROM yeni_tokens t JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = ?`, await sha256(m[1])) : null;
  if (!row || row.deleted) {
    await anonymous(ctx);
    throw new HttpError("unauthorized", "Connect the reader again.");
  }
  const now = Date.now();
  if (now - row.last_used_at > DAY) await run(ctx.env.DB, "UPDATE yeni_tokens SET last_used_at = ? WHERE id = ?", now, row.id);
  return { tokenId: row.id, userId: row.user_id };
}

interface DocRow { body: string; rev: number; updated: number }
const current = (ctx: Ctx, userId: string) =>
  first<DocRow>(ctx.env.DB, "SELECT body, rev, updated FROM docs WHERE user_id = ? AND kind = ?", userId, KIND);

/** 409 with the server's copy; the reader merges and sends again with this rev. */
function conflict(row: DocRow | null): Response {
  return json({ error: "conflict", rev: row?.rev ?? 0, doc: row ? JSON.parse(row.body) : null }, 409);
}

/** GET /api/yeni/doc */
export async function getYeniDoc(ctx: Ctx): Promise<Response> {
  const r = await reader(ctx);
  await hit(ctx.env.DB, YENI, r.userId);
  const row = await current(ctx, r.userId);
  const out: YeniDocGet = row ? { rev: row.rev, doc: JSON.parse(row.body) } : { rev: 0, doc: null };
  return json(out);
}

/** PUT /api/yeni/doc { baseRev, doc } */
export async function putYeniDoc(ctx: Ctx): Promise<Response> {
  const r = await reader(ctx);
  await hit(ctx.env.DB, YENI, r.userId);
  const o = await readJson<{ baseRev?: unknown; doc?: unknown }>(ctx.req, YENI_DOC_MAX + 4096);
  const baseRev = o.baseRev;
  if (!Number.isInteger(baseRev) || (baseRev as number) < 0) throw new HttpError("invalid", "baseRev must be a revision.", { field: "baseRev" });
  const doc = o.doc;
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) throw new HttpError("invalid", "doc must be a JSON object.", { field: "doc" });
  const text = JSON.stringify(doc);
  if (new TextEncoder().encode(text).length > YENI_DOC_MAX) throw new HttpError("too_large", "The notebook is over 512 KiB.");

  const now = Date.now();
  const row = await current(ctx, r.userId);
  if (row && now - row.updated < MIN_INTERVAL) throw new HttpError("rate_limited", "Saving too fast.", { retryAfter: 1 });
  if ((row?.rev ?? 0) !== baseRev) return conflict(row);
  const w = row
    ? await run(ctx.env.DB, "UPDATE docs SET body = ?, rev = rev + 1, updated = ? WHERE user_id = ? AND kind = ? AND rev = ?",
      text, now, r.userId, KIND, baseRev)
    : await run(ctx.env.DB, "INSERT INTO docs (user_id, kind, body, rev, updated) VALUES (?, ?, ?, 1, ?) ON CONFLICT DO NOTHING",
      r.userId, KIND, text, now);
  if (!w.meta.changes) return conflict(await current(ctx, r.userId));
  const out: YeniDocPutOk = { rev: (baseRev as number) + 1 };
  return json(out);
}

/** GET /api/yeni/check: whether the presented reader token is live, and an opaque, stable id for its learner. Called by
 * the exam Worker (yeni-sinav), never by a browser (no CORS). The id is an HMAC of the user id, so it names no account and
 * links to nothing else; it carries no username and reads no data. Limited per learner, since every call comes from one
 * Worker (an IP bucket would be shared by a whole class). */
export async function check(ctx: Ctx): Promise<Response> {
  const r = await reader(ctx);
  await hit(ctx.env.DB, YENI_CHECK, r.userId);
  const out: YeniCheckOk = { uid: b64url(await hmac(ctx.env.PEPPER, "sinav:" + r.userId)).slice(0, 22) };
  return json(out);
}

/** DELETE /api/yeni/token: the reader disconnects itself; the presented token stops working. */
export async function dropToken(ctx: Ctx): Promise<Response> {
  const r = await reader(ctx);
  await run(ctx.env.DB, "DELETE FROM yeni_tokens WHERE id = ?", r.tokenId);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
