/* Owner routes (docs/SPECS_API.md section 10): every one answers 403 to anyone whose role is not owner. */
import type { AdminStats, AdminWeak } from "../../../shared/api.ts";
import { requireUser } from "../../core/session.ts";
import { backupStep } from "./backup.ts";
import { all, first, run } from "../../core/db.ts";
import { HttpError, json } from "../../core/http.ts";
import type { Ctx } from "../../core/router.ts";
import { pageVersion } from "../../core/health.ts";

const DAY = 86_400_000;

async function owner(ctx: Ctx) {
  const a = await requireUser(ctx);
  if (a.user.role !== "owner") throw new HttpError("forbidden", "Only the owner can do that.");
  return a;
}

const n = async (db: D1Database, sql: string, ...args: unknown[]) => (await first<{ n: number }>(db, sql, ...args))?.n ?? 0;

export async function latestBackup(ctx: Ctx) {
  const list = await ctx.env.BACKUPS.list({ prefix: "backups/", delimiter: "/" });
  const dates = list.delimitedPrefixes.map((p) => p.split("/")[1]).sort().reverse();
  for (const date of dates.slice(0, 5)) {
    const m = await ctx.env.BACKUPS.get(`backups/${date}/manifest.json`);
    if (m) return m.json<{ date: string; bytes: number; rows: number; finished: number }>();
  }
  return null;
}

export async function stats(ctx: Ctx): Promise<Response> {
  await owner(ctx);
  const db = ctx.env.DB, now = Date.now();
  const b = await latestBackup(ctx);
  const out: AdminStats = {
    users: { total: await n(db, "SELECT COUNT(*) AS n FROM users"), deleted: await n(db, "SELECT COUNT(*) AS n FROM users WHERE deleted IS NOT NULL"),
      signups7d: await n(db, "SELECT COUNT(*) AS n FROM users WHERE created > ?", now - 7 * DAY), signups30d: await n(db, "SELECT COUNT(*) AS n FROM users WHERE created > ?", now - 30 * DAY) },
    active: { d7: await n(db, "SELECT COUNT(*) AS n FROM profiles WHERE updated > ?", now - 7 * DAY), d30: await n(db, "SELECT COUNT(*) AS n FROM profiles WHERE updated > ?", now - 30 * DAY) },
    docs: { rows: await n(db, "SELECT COUNT(*) AS n FROM docs"), bytes: await n(db, "SELECT COALESCE(SUM(LENGTH(body)), 0) AS n FROM docs") },
    profiles: { rows: await n(db, "SELECT COUNT(*) AS n FROM profiles") },
    classes: { rows: await n(db, "SELECT COUNT(*) AS n FROM classes"), members: await n(db, "SELECT COUNT(*) AS n FROM class_members") },
    push: { rows: await n(db, "SELECT COUNT(*) AS n FROM push_subs") },
    limits: { rows: await n(db, "SELECT COUNT(*) AS n FROM limits"), hits24h: await n(db, "SELECT COUNT(*) AS n FROM limits WHERE window_start > ? AND count >= 10", now - DAY) },
    backup: b ? { date: b.date, bytes: b.bytes, rows: b.rows, finished: b.finished } : null,
    version: await pageVersion(ctx), time: now,
  };
  return json(out);
}

export async function weak(ctx: Ctx): Promise<Response> {
  await owner(ctx);
  const limit = Math.min(200, Math.max(1, Number(ctx.url.searchParams.get("limit")) || 50));
  const cards = await all<{ id: string; learners: number; tries: number; wrong: number }>(ctx.env.DB,
    `SELECT json_extract(c.value, '$.id') AS id, COUNT(*) AS learners, SUM(json_extract(c.value, '$.tries')) AS tries, SUM(json_extract(c.value, '$.wrong')) AS wrong
     FROM weak w, json_each(w.body, '$.cards') c GROUP BY json_extract(c.value, '$.id') ORDER BY learners DESC, wrong DESC LIMIT ?`, limit);
  const lessons = await all<{ id: string; learners: number; tries: number; misses: number }>(ctx.env.DB,
    `SELECT json_extract(c.value, '$.id') AS id, COUNT(*) AS learners, SUM(json_extract(c.value, '$.tries')) AS tries, SUM(json_extract(c.value, '$.misses')) AS misses
     FROM weak w, json_each(w.body, '$.lessons') c GROUP BY json_extract(c.value, '$.id') ORDER BY learners DESC, misses DESC LIMIT ?`, limit);
  const out: AdminWeak = { cards, lessons };
  return json(out);
}

/** The learners table: newest activity first, or a username prefix. Counts come from indexed subqueries; no document bodies are read. */
export async function users(ctx: Ctx): Promise<Response> {
  await owner(ctx);
  const q = (ctx.url.searchParams.get("q") || "").trim().toLowerCase();
  if (q && q.length < 2) throw new HttpError("invalid", "q needs 2 or more characters.", { field: "q" });
  const limit = Math.min(100, Math.max(1, Number(ctx.url.searchParams.get("limit")) || 50));
  const rows = await all<Record<string, unknown>>(ctx.env.DB,
    `SELECT u.id, u.username, u.role, u.plan, u.tz, u.created, u.deleted,
            p.updated AS lastSave, p.code, p.xp, p.xp_week AS xpWeek, p.week, p.last_day AS lastDay,
            json_extract(p.body, '$.nick') AS nick, json_extract(p.body, '$.char') AS char, json_extract(p.body, '$.streak') AS streak,
            json_extract(p.body, '$.pos.lv') AS lv, json_extract(p.body, '$.pos.u') AS unit,
            (SELECT LENGTH(body) FROM docs d WHERE d.user_id = u.id AND d.kind = 'progress') AS progressBytes,
            (SELECT rev FROM docs d WHERE d.user_id = u.id AND d.kind = 'progress') AS saves,
            (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id) AS devices,
            (SELECT COUNT(*) FROM class_members m WHERE m.user_id = u.id) AS classes,
            (SELECT COUNT(*) FROM follows f WHERE f.followee = u.id) AS followers,
            (SELECT COUNT(*) FROM follows f WHERE f.follower = u.id) AS following,
            (SELECT COUNT(*) FROM push_subs x WHERE x.user_id = u.id) AS reminders
     FROM users u LEFT JOIN profiles p ON p.user_id = u.id
     WHERE (?1 = '' OR u.username LIKE ?1 || '%' ESCAPE '\\')
     ORDER BY COALESCE(p.updated, u.created) DESC LIMIT ?2`, q.replace(/[%_\\]/g, (m) => "\\" + m), limit);
  // the avatar parts are stored inside the profile document; json_extract hands an object back as JSON text
  for (const r of rows) if (typeof r.char === "string") { try { r.char = JSON.parse(r.char); } catch { r.char = null; } }
  return json({ users: rows });
}

export async function undelete(ctx: Ctx): Promise<Response> {
  await owner(ctx);
  const r = await run(ctx.env.DB, "UPDATE users SET deleted = NULL WHERE id = ?", ctx.params.id);
  if (!r.meta.changes) throw new HttpError("not_found", "No such account.");
  return json({ user: await first(ctx.env.DB, "SELECT id, username, role, plan FROM users WHERE id = ?", ctx.params.id) });
}

export async function backups(ctx: Ctx): Promise<Response> {
  await owner(ctx);
  const list = await ctx.env.BACKUPS.list({ prefix: "backups/", delimiter: "/" });
  const dates = list.delimitedPrefixes.map((p) => p.split("/")[1]).sort().reverse().slice(0, 60);
  const out = [];
  for (const date of dates) {
    const m = await ctx.env.BACKUPS.get(`backups/${date}/manifest.json`);
    if (m) out.push(await m.json());
  }
  return json({ backups: out });
}

export async function backupNow(ctx: Ctx): Promise<Response> {
  await owner(ctx);
  const date = new Date().toISOString().slice(0, 10);
  let m = null;
  for (let i = 0; i < 20 && !m; i++) {
    m = await backupStep(ctx.env, date);
    if (!m && (await ctx.env.BACKUPS.head(`backups/${date}/manifest.json`))) break;
  }
  const done = await ctx.env.BACKUPS.get(`backups/${date}/manifest.json`);
  if (!done) throw new HttpError("internal", "The backup did not finish in this run; run it again.");
  const mm = await done.json<{ bytes: number; rows: number }>();
  return json({ date, bytes: mm.bytes, rows: mm.rows });
}
