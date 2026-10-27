/* Friends (docs/SPECS_API.md section 6): the payload the Friends tab draws from, code and name search, and
   usernames for ids. Soft-deleted accounts are left out everywhere. */
import type { Friends, Names, ProfileDoc, Search } from "../../../shared/api.ts";
import { requireUser } from "../../core/session.ts";
import { CODE_ABC } from "../../core/crypto.ts";
import { all, chunks, first, marks } from "../../core/db.ts";
import { HttpError, json } from "../../core/http.ts";
import { hit } from "../../core/limits.ts";
import type { Ctx } from "../../core/router.ts";
import { foldNick } from "./profiles.ts";
import { SEARCH } from "./rules.ts";

const WEEK_RE = /^\d{4}-W\d{2}$/;
const CODE_RE = new RegExp(`^[${CODE_ABC}]{6}$`);

export function weekParam(ctx: Ctx): string {
  const w = ctx.url.searchParams.get("week") || "";
  if (!WEEK_RE.test(w)) throw new HttpError("invalid", "week must be an ISO week key.", { field: "week" });
  return w;
}

/** Profile bodies and usernames for `ids`, in chunks of 100 (D1's parameter limit). */
export async function profilesAndNames(db: D1Database, ids: string[]) {
  const profiles: Record<string, ProfileDoc> = {}, names: Record<string, string> = {};
  for (const part of chunks([...new Set(ids)])) {
    const rows = await all<{ id: string; username: string; body: string | null }>(db,
      `SELECT u.id, u.username, p.body FROM users u LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id IN (${marks(part.length)}) AND u.deleted IS NULL`, ...part);
    for (const r of rows) {
      names[r.id] = r.username;
      if (r.body) profiles[r.id] = JSON.parse(r.body);
    }
  }
  return { profiles, names };
}

/**
 * Who may see a learner's character (docs/SPECS_SCHEMA.md §3.3): a visible faith item, a headscarf, discloses faith, so the
 * character goes only to mutual follows (and to classmates, on the class board) unless its owner has set `charPublic`.
 * Everyone else gets `char: null` and draws the silhouette.
 */
export function hideChars(profiles: Record<string, ProfileDoc>, viewer: string, viewerFollows: ReadonlySet<string>): void {
  for (const [id, p] of Object.entries(profiles)) {
    if (!p.char || p.charPublic === true) continue;
    const mutual = viewerFollows.has(id) && Array.isArray(p.following) && p.following.includes(viewer);
    if (!mutual) profiles[id] = { ...p, char: null };
  }
}

export async function friends(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const week = weekParam(ctx), db = ctx.env.DB;
  const mine = await first<{ body: string }>(db, "SELECT body FROM profiles WHERE user_id = ?", user.id);
  const following = (await all<{ id: string }>(db, "SELECT followee AS id FROM follows WHERE follower = ? ORDER BY at DESC LIMIT 200", user.id)).map((r) => r.id);
  const followers = (await all<{ id: string }>(db, "SELECT follower AS id FROM follows WHERE followee = ? ORDER BY at DESC LIMIT 200", user.id)).map((r) => r.id);
  const board = (await all<{ id: string }>(db,
    `SELECT p.user_id AS id FROM profiles p JOIN users u ON u.id = p.user_id
     WHERE p.week = ? AND p.xp_week > 0 AND u.deleted IS NULL ORDER BY p.xp_week DESC, p.xp DESC, p.user_id LIMIT 50`, week)).map((r) => r.id);
  const { profiles, names } = await profilesAndNames(db, [...following, ...followers, ...board].filter((id) => id !== user.id));
  names[user.id] = user.username;
  hideChars(profiles, user.id, new Set(following));
  const out: Friends = { week, me: mine ? JSON.parse(mine.body) : null, following, followers, board, profiles, names };
  return json(out);
}

export async function search(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  await hit(ctx.env.DB, SEARCH, user.id);
  const raw = (ctx.url.searchParams.get("q") || "").trim().slice(0, 40);
  const code = raw.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const out: Search = { self: false, code: null, ids: [], profiles: {}, names: {} };
  let ids: string[] = [];
  if (raw.startsWith("@")) {   // an exact username, from a /@name link
    const row = await first<{ id: string }>(ctx.env.DB, "SELECT id FROM users WHERE username = ? AND deleted IS NULL", raw.slice(1).toLowerCase());
    if (row?.id === user.id) out.self = true;
    else if (row) { ids = [row.id]; out.ids = ids; }
  } else if (CODE_RE.test(code)) {
    const row = await first<{ user_id: string }>(ctx.env.DB, "SELECT user_id FROM profiles WHERE code = ?", code);
    if (row?.user_id === user.id) out.self = true;
    else if (row) { out.code = row.user_id; ids = [row.user_id]; }
  }
  if (!out.self && !out.code && !ids.length && !raw.startsWith("@") && raw.length >= 3) {
    const like = "%" + foldNick(raw).replace(/[%_\\]/g, (m) => "\\" + m) + "%";
    ids = (await all<{ id: string }>(ctx.env.DB,
      `SELECT u.id FROM users u LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.deleted IS NULL AND u.id <> ?1 AND (p.nick LIKE ?2 ESCAPE '\\' OR u.username LIKE ?2 ESCAPE '\\')
       ORDER BY p.updated DESC LIMIT 20`, user.id, like)).map((r) => r.id);
    out.ids = ids;
  }
  Object.assign(out, await profilesAndNames(ctx.env.DB, ids));
  if (ids.length) {
    const mine = await all<{ id: string }>(ctx.env.DB, `SELECT followee AS id FROM follows WHERE follower = ? AND followee IN (${marks(ids.length)})`, user.id, ...ids);
    hideChars(out.profiles, user.id, new Set(mine.map((r) => r.id)));
  }
  return json(out);
}

export async function users(ctx: Ctx): Promise<Response> {
  await requireUser(ctx);
  const ids = (ctx.url.searchParams.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length > 100) throw new HttpError("invalid", "At most 100 ids.", { field: "ids" });
  const out: Names = { names: (await profilesAndNames(ctx.env.DB, ids)).names };
  return json(out);
}
