/* PUT /api/profile (docs/SPECS_API.md section 6): the public Friends document, its indexed columns and the
   follows table derived from doc.following. */
import type { ProfileDoc, ProfilePutOk } from "../../../shared/api.ts";
import { charProblem } from "../../../shared/char.ts";
import { requireUser } from "../../core/session.ts";
import { readJson } from "../../core/body.ts";
import { CODE_ABC, randomCode } from "../../core/crypto.ts";
import { batch, chunks, first, isUniqueViolation, marks } from "../../core/db.ts";
import { HttpError, json } from "../../core/http.ts";
import type { Ctx } from "../../core/router.ts";

const WEEK_RE = /^\d{4}-W\d{2}$/;
const CODE_RE = new RegExp(`^[${CODE_ABC}]{6}$`);

/** Lower case with Turkish folding, for LIKE search only (docs/SPECS_SCHEMA.md section 2.4). */
export function foldNick(s: string): string {
  return s.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase()
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ü/g, "u")
    .replace(/[âà]/g, "a").replace(/[îì]/g, "i").replace(/[ûù]/g, "u");
}

function validate(doc: unknown): ProfileDoc {
  const d = doc as Partial<ProfileDoc>;
  if (!d || typeof d !== "object" || d.v !== 1) throw new HttpError("invalid", "doc.v must be 1.", { field: "doc" });
  if (typeof d.nick !== "string" || d.nick.length > 30) throw new HttpError("invalid", "nick is at most 30 characters.", { field: "nick" });
  if (!Array.isArray(d.following) || d.following.length > 500 || d.following.some((x) => typeof x !== "string" || x.length > 40)) {
    throw new HttpError("invalid", "following is a list of at most 500 ids.", { field: "following" });
  }
  if (d.cheers && (typeof d.cheers !== "object" || Object.keys(d.cheers).length > 200)) {
    throw new HttpError("invalid", "cheers has at most 200 entries.", { field: "cheers" });
  }
  // a character the rules refuse is stored as none rather than refusing the save (shared/char.ts)
  return (charProblem(d.char) ? { ...d, char: null } : d) as ProfileDoc;
}

export async function putProfile(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const o = await readJson<{ doc?: unknown; week?: unknown }>(ctx.req, 16 * 1024 + 512);
  const doc = validate(o.doc);
  const week = typeof o.week === "string" && WEEK_RE.test(o.week) ? o.week : "";
  if (!week) throw new HttpError("invalid", "week must be an ISO week key.", { field: "week" });
  const db = ctx.env.DB, now = Date.now();
  const old = await first<{ body: string; code: string; updated: number }>(db, "SELECT body, code, updated FROM profiles WHERE user_id = ?", user.id);
  if (old && now - old.updated < 1000) throw new HttpError("rate_limited", "Saving too fast.", { retryAfter: 1 });

  const following = [...new Set(doc.following)].filter((id) => id !== user.id);
  const before = new Set<string>(old ? (JSON.parse(old.body).following || []) : []);
  const added = following.filter((id) => !before.has(id));
  const removed = [...before].filter((id) => !following.includes(id));
  const cols = {
    nick: foldNick(doc.nick || ""), xp: Math.max(0, Math.floor(Number(doc.xp) || 0)),
    xpWeek: Math.max(0, Math.floor(Number(doc.xpWeek?.[week]) || 0)), lastDay: typeof doc.lastDay === "string" ? doc.lastDay.slice(0, 10) : "",
  };

  let code = old?.code || (typeof doc.code === "string" && CODE_RE.test(doc.code) ? doc.code : randomCode(6));
  for (let attempt = 0; ; attempt++) {
    const stored: ProfileDoc = { ...doc, following, code };
    const stmts = [
      db.prepare(
        `INSERT INTO profiles (user_id, body, code, nick, xp, week, xp_week, last_day, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET body = excluded.body, nick = excluded.nick, xp = excluded.xp, week = excluded.week,
           xp_week = excluded.xp_week, last_day = excluded.last_day, updated = excluded.updated`,
      ).bind(user.id, JSON.stringify(stored), code, cols.nick, cols.xp, week, cols.xpWeek, cols.lastDay, now),
      ...chunks(added).map((ids) => db.prepare(
        `INSERT INTO follows (follower, followee, at) SELECT ?, id, ? FROM users WHERE id IN (${marks(ids.length)}) ON CONFLICT DO NOTHING`,
      ).bind(user.id, now, ...ids)),
      ...chunks(removed).map((ids) => db.prepare(
        `DELETE FROM follows WHERE follower = ? AND followee IN (${marks(ids.length)})`,
      ).bind(user.id, ...ids)),
    ];
    try {
      await batch(db, stmts);
      const out: ProfilePutOk = { doc: stored, code, updated: now };
      return json(out);
    } catch (e) {
      // a friend code taken by someone else: the server picks a fresh one (only on the first save)
      if (!old && isUniqueViolation(e) && attempt < 5) { code = randomCode(6); continue; }
      throw e;
    }
  }
}
