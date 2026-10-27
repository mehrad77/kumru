/* Push subscriptions (docs/SPECS_API.md section 9). */
import { requireUser } from "../../core/session.ts";
import { readJson } from "../../core/body.ts";
import { randomBase32 } from "../../core/crypto.ts";
import { all, run } from "../../core/db.ts";
import { HttpError, json } from "../../core/http.ts";
import type { Ctx } from "../../core/router.ts";

const MAX_SUBS = 5;

export const pushKey = (ctx: Ctx) => json({ key: ctx.env.VAPID_PUBLIC || "" });

export async function subscribe(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const o = await readJson<{ endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown }; tz?: unknown; hour?: unknown }>(ctx.req, 8192);
  const { endpoint, keys, tz, hour } = o;
  if (typeof endpoint !== "string" || !/^https:\/\//.test(endpoint) || endpoint.length > 600) throw new HttpError("invalid", "endpoint must be an https URL.", { field: "endpoint" });
  if (!keys || typeof keys.p256dh !== "string" || typeof keys.auth !== "string" || keys.p256dh.length > 200 || keys.auth.length > 60) throw new HttpError("invalid", "keys are missing.", { field: "keys" });
  if (typeof tz !== "string" || tz.length > 64) throw new HttpError("invalid", "tz is an IANA zone.", { field: "tz" });
  if (!Number.isInteger(hour) || (hour as number) < 0 || (hour as number) > 23) throw new HttpError("invalid", "hour is 0–23.", { field: "hour" });
  const db = ctx.env.DB;
  const mine = await all<{ id: string; endpoint: string }>(db, "SELECT id, endpoint FROM push_subs WHERE user_id = ? ORDER BY created", user.id);
  const existing = mine.find((s) => s.endpoint === endpoint);
  const id = existing?.id ?? randomBase32(10).slice(0, 16);
  if (!existing && mine.length >= MAX_SUBS) await run(db, "DELETE FROM push_subs WHERE id = ?", mine[0].id);
  await run(db,
    `INSERT INTO push_subs (id, user_id, endpoint, keys, tz, hour, created) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, keys = excluded.keys, tz = excluded.tz, hour = excluded.hour`,
    id, user.id, endpoint, JSON.stringify({ p256dh: keys.p256dh, auth: keys.auth }), tz, hour, Date.now());
  return json({ id });
}

export async function unsubscribe(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const r = await run(ctx.env.DB, "DELETE FROM push_subs WHERE id = ? AND user_id = ?", ctx.params.id, user.id);
  if (!r.meta.changes) throw new HttpError("not_found", "No such subscription.");
  return new Response(null, { status: 204 });
}

export async function mySubs(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const rows = await all<{ id: string; endpoint: string; tz: string; hour: number }>(ctx.env.DB, "SELECT id, endpoint, tz, hour FROM push_subs WHERE user_id = ?", user.id);
  return json({ subs: rows });
}
