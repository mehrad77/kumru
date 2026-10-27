/* Classes (docs/SPECS_API.md section 7): create and join by code, a weekly board per class, and the
   opt-in teacher view. A class has at most 200 members; its owner is always a member who shares. */
import { CLASS_COLORS, CLASS_ICONS } from "../../../shared/api.ts";
import type { BookDoc, Class, ClassBoard, ClassMember, ProfileDoc } from "../../../shared/api.ts";
import { requireUser } from "../../core/session.ts";
import { readJson, str } from "../../core/body.ts";
import { randomBase32, randomCode } from "../../core/crypto.ts";
import { all, batch, first, isUniqueViolation, run } from "../../core/db.ts";
import { HttpError, json } from "../../core/http.ts";
import { hit } from "../../core/limits.ts";
import type { Ctx } from "../../core/router.ts";
import { profilesAndNames, weekParam } from "../friends/index.ts";
import { CLASS_CREATE, CLASS_JOIN } from "./rules.ts";

const MAX_MEMBERS = 200;

interface ClassRow { id: string; name: string; code: string; owner: string; created: number;
  description: string; schedule: string; icon: Class["icon"]; color: Class["color"] }
interface MemberRow { joined: number; share: number; share_book: number }

async function classView(db: D1Database, c: ClassRow, me: MemberRow): Promise<Class> {
  const n = await first<{ n: number }>(db, "SELECT COUNT(*) AS n FROM class_members WHERE class_id = ?", c.id);
  return { id: c.id, name: c.name, code: c.code, owner: c.owner, created: c.created, members: n?.n ?? 0, share: !!me.share, shareBook: !!me.share_book, joined: me.joined,
    description: c.description, schedule: c.schedule, icon: c.icon, color: c.color };
}

function name(o: Record<string, unknown>): string {
  const n = str(o, "name", { max: 40 }).trim();
  if (!n) throw new HttpError("invalid", "A class needs a name.", { field: "name" });
  return n;
}

type Style = Pick<ClassRow, "name" | "description" | "schedule" | "icon" | "color">;

/** The fields of a create or update body that are present, checked; absent ones are left out. */
function style(o: Record<string, unknown>): Partial<Style> {
  const out: Partial<Style> = {};
  if (o.name !== undefined) out.name = name(o);
  if (o.description !== undefined) out.description = str(o, "description", { max: 280 }).trim();
  if (o.schedule !== undefined) out.schedule = str(o, "schedule", { max: 60 }).trim();
  if (o.icon !== undefined) {
    if (!(CLASS_ICONS as readonly string[]).includes(o.icon as string)) throw new HttpError("invalid", "That icon is not available.", { field: "icon" });
    out.icon = o.icon as Style["icon"];
  }
  if (o.color !== undefined) {
    if (!(CLASS_COLORS as readonly string[]).includes(o.color as string)) throw new HttpError("invalid", "That colour is not available.", { field: "color" });
    out.color = o.color as Style["color"];
  }
  return out;
}

/** The class and the caller's membership; `owner` also requires the caller to own it. */
async function membership(ctx: Ctx, userId: string, owner = false): Promise<{ c: ClassRow; m: MemberRow }> {
  const c = await first<ClassRow>(ctx.env.DB, "SELECT * FROM classes WHERE id = ?", ctx.params.id);
  if (!c) throw new HttpError("not_found", "No such class.");
  const m = await first<MemberRow>(ctx.env.DB, "SELECT joined, share, share_book FROM class_members WHERE class_id = ? AND user_id = ?", c.id, userId);
  if (!m) throw new HttpError("forbidden", "You are not in this class.");
  if (owner && c.owner !== userId) throw new HttpError("forbidden", "Only the class owner can do that.");
  return { c, m };
}

export async function createClass(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  await hit(ctx.env.DB, CLASS_CREATE, user.id);
  const body = await readJson(ctx.req), n = name(body), st = style(body);
  if (await first(ctx.env.DB, "SELECT 1 FROM classes WHERE owner = ? AND name = ?", user.id, n)) throw new HttpError("taken", "You already have a class with that name.", { field: "name" });
  const now = Date.now(), id = randomBase32(10).slice(0, 16);
  for (let attempt = 0; ; attempt++) {
    const c: ClassRow = { id, name: n, code: randomCode(6), owner: user.id, created: now,
      description: st.description ?? "", schedule: st.schedule ?? "", icon: st.icon ?? "book", color: st.color ?? "sage" };
    try {
      await batch(ctx.env.DB, [
        ctx.env.DB.prepare("INSERT INTO classes (id, name, code, owner, created, description, schedule, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(c.id, c.name, c.code, c.owner, c.created, c.description, c.schedule, c.icon, c.color),
        ctx.env.DB.prepare("INSERT INTO class_members (class_id, user_id, joined, share) VALUES (?, ?, ?, 1)").bind(c.id, user.id, now),
      ]);
      return json({ class: await classView(ctx.env.DB, c, { joined: now, share: 1, share_book: 0 }) }, 201);
    } catch (e) {
      if (isUniqueViolation(e) && attempt < 5) continue;   // a code collision: draw again
      throw e;
    }
  }
}

export async function listClasses(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const rows = await all<ClassRow & MemberRow>(ctx.env.DB,
    `SELECT c.*, m.joined, m.share, m.share_book FROM class_members m JOIN classes c ON c.id = m.class_id
     WHERE m.user_id = ? ORDER BY m.joined LIMIT 20`, user.id);
  const classes = await Promise.all(rows.map((r) => classView(ctx.env.DB, r, r)));
  return json({ classes });
}

export async function joinClass(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  await hit(ctx.env.DB, CLASS_JOIN, user.id);
  const o = await readJson(ctx.req);
  const code = str(o, "code", { max: 20 }).toUpperCase().replace(/[^0-9A-Z]/g, "");
  const share = o.share === true;
  const c = await first<ClassRow>(ctx.env.DB, "SELECT * FROM classes WHERE code = ?", code);
  if (!c) throw new HttpError("not_found", "No class has that code.", { field: "code" });
  const had = await first<MemberRow>(ctx.env.DB, "SELECT joined, share, share_book FROM class_members WHERE class_id = ? AND user_id = ?", c.id, user.id);
  if (had) return json({ class: await classView(ctx.env.DB, c, had) });
  const n = await first<{ n: number }>(ctx.env.DB, "SELECT COUNT(*) AS n FROM class_members WHERE class_id = ?", c.id);
  if ((n?.n ?? 0) >= MAX_MEMBERS) throw new HttpError("forbidden", `A class has at most ${MAX_MEMBERS} members.`);
  const now = Date.now();
  await run(ctx.env.DB, "INSERT INTO class_members (class_id, user_id, joined, share) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING", c.id, user.id, now, share ? 1 : 0);
  return json({ class: await classView(ctx.env.DB, c, { joined: now, share: share ? 1 : 0, share_book: 0 }) });
}

export async function leaveClass(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const { c } = await membership(ctx, user.id);
  if (c.owner === user.id) throw new HttpError("forbidden", "The owner can't leave; delete the class instead.");
  await run(ctx.env.DB, "DELETE FROM class_members WHERE class_id = ? AND user_id = ?", c.id, user.id);
  await pruneBook(ctx.env.DB, user.id);
  return new Response(null, { status: 204 });
}

export async function setShare(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const { c, m } = await membership(ctx, user.id);
  const o = await readJson(ctx.req);
  for (const k of ["share", "shareBook"]) {
    if (o[k] !== undefined && typeof o[k] !== "boolean") throw new HttpError("invalid", `${k} must be true or false.`, { field: k });
  }
  if (o.share === undefined && o.shareBook === undefined) throw new HttpError("invalid", "Send share, shareBook or both.", { field: "share" });
  const share = c.owner === user.id ? true : (o.share as boolean | undefined) ?? !!m.share;
  const shareBook = (o.shareBook as boolean | undefined) ?? !!m.share_book;
  await run(ctx.env.DB, "UPDATE class_members SET share = ?, share_book = ? WHERE class_id = ? AND user_id = ?", share ? 1 : 0, shareBook ? 1 : 0, c.id, user.id);
  if (!shareBook) await pruneBook(ctx.env.DB, user.id);
  return json({ class: await classView(ctx.env.DB, c, { ...m, share: share ? 1 : 0, share_book: shareBook ? 1 : 0 }) });
}

/** Drop a learner's stored book summary once no class has it switched on, so unsharing leaves no copy behind
 *  (a deleted class is swept nightly, cron/sweep.ts). */
const pruneBook = (db: D1Database, userId: string) =>
  run(db, "DELETE FROM book WHERE user_id = ? AND NOT EXISTS (SELECT 1 FROM class_members WHERE user_id = ? AND share_book = 1)", userId, userId);

export async function updateClass(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const { c, m } = await membership(ctx, user.id, true);
  const st = style(await readJson(ctx.req));
  if (st.name && st.name !== c.name && await first(ctx.env.DB, "SELECT 1 FROM classes WHERE owner = ? AND name = ? AND id <> ?", user.id, st.name, c.id))
    throw new HttpError("taken", "You already have a class with that name.", { field: "name" });
  const next: ClassRow = { ...c, ...st };
  await run(ctx.env.DB, "UPDATE classes SET name = ?, description = ?, schedule = ?, icon = ?, color = ? WHERE id = ?",
    next.name, next.description, next.schedule, next.icon, next.color, c.id);
  return json({ class: await classView(ctx.env.DB, next, m) });
}

export async function deleteClass(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const { c } = await membership(ctx, user.id, true);
  await run(ctx.env.DB, "DELETE FROM classes WHERE id = ?", c.id);
  return new Response(null, { status: 204 });
}

export async function removeMember(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const { c } = await membership(ctx, user.id, true);
  if (ctx.params.uid === user.id) throw new HttpError("forbidden", "You can't remove yourself; delete the class instead.");
  const r = await run(ctx.env.DB, "DELETE FROM class_members WHERE class_id = ? AND user_id = ?", c.id, ctx.params.uid);
  if (!r.meta.changes) throw new HttpError("not_found", "Not a member.");
  await pruneBook(ctx.env.DB, ctx.params.uid);
  return new Response(null, { status: 204 });
}

export async function classBoard(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const { c } = await membership(ctx, user.id);
  const week = weekParam(ctx);
  const limit = c.owner === user.id ? MAX_MEMBERS : 50;   // the teacher loads every member, a member the top 50
  const board = (await all<{ id: string }>(ctx.env.DB,
    `SELECT m.user_id AS id FROM class_members m JOIN users u ON u.id = m.user_id LEFT JOIN profiles p ON p.user_id = m.user_id
     WHERE m.class_id = ? AND u.deleted IS NULL
     ORDER BY CASE WHEN p.week = ? THEN p.xp_week ELSE 0 END DESC, COALESCE(p.xp, 0) DESC, m.user_id LIMIT ?`, c.id, week, limit)).map((r) => r.id);
  const out: ClassBoard = { week, board, ...(await profilesAndNames(ctx.env.DB, board)) };
  return json(out);
}

/** The teacher view: everyone's name; position, streak and last day only for members who opted in, and the book summary only for
 *  members who switched book sharing on (it comes with the same query: the join matches `book` rows only for them). */
export async function classMembers(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const { c } = await membership(ctx, user.id, true);
  const rows = await all<{ id: string; username: string; joined: number; share: number; share_book: number; body: string | null; book: string | null }>(ctx.env.DB,
    `SELECT u.id, u.username, m.joined, m.share, m.share_book, p.body, b.body AS book FROM class_members m JOIN users u ON u.id = m.user_id
     LEFT JOIN profiles p ON p.user_id = m.user_id LEFT JOIN book b ON b.user_id = m.user_id AND m.share_book = 1
     WHERE m.class_id = ? AND u.deleted IS NULL ORDER BY m.joined`, c.id);
  const weak = await weakFor(ctx.env.DB, rows.filter((r) => r.share).map((r) => r.id));
  const members: ClassMember[] = rows.map((r) => {
    const p: Partial<ProfileDoc> = r.body ? JSON.parse(r.body) : {};
    const m: ClassMember = { id: r.id, username: r.username, nick: p.nick || "", joined: r.joined, share: !!r.share, shareBook: !!r.share_book };
    if (r.share) {
      if (p.pos) m.pos = p.pos;
      if (typeof p.streak === "number") m.streak = p.streak;
      if (p.lastDay) m.lastDay = p.lastDay;
      if (weak[r.id]) m.weak = weak[r.id];
    }
    if (r.share_book && r.book) m.book = JSON.parse(r.book) as BookDoc;
    return m;
  });
  return json({ members });
}

/** The 10 weakest cards from each opted-in member's weak summary (the table arrives in migration 0004). */
async function weakFor(db: D1Database, ids: string[]): Promise<Record<string, ClassMember["weak"]>> {
  const out: Record<string, ClassMember["weak"]> = {};
  if (!ids.length) return out;
  const exists = await first(db, "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'weak'");
  if (!exists) return out;
  for (const id of ids) {
    const r = await first<{ body: string }>(db, "SELECT body FROM weak WHERE user_id = ?", id);
    if (r) out[id] = (JSON.parse(r.body).cards || []).slice(0, 10);
  }
  return out;
}
