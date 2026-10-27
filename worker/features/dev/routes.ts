/* POST /api/dev/login (docs/SPECS_API.md section 11): only when DEV is "1" (wrangler dev). Backs ?as=<username>. */
import { newSession, publicUser, type UserRow } from "../../core/session.ts";
import { readJson, str } from "../../core/body.ts";
import { first } from "../../core/db.ts";
import { HttpError, json } from "../../core/http.ts";
import type { Ctx } from "../../core/router.ts";

export async function devLogin(ctx: Ctx): Promise<Response> {
  if (ctx.env.DEV !== "1") throw new HttpError("not_found", "No such route.");
  const o = await readJson(ctx.req);
  const u = await first<UserRow>(ctx.env.DB, "SELECT * FROM users WHERE username = ?", str(o, "username").toLowerCase());
  if (!u) throw new HttpError("not_found", "No such seeded user; run pnpm seed.");
  const s = await newSession(ctx.env, u.id, "dev");
  await s.stmt.run();
  return json({ token: s.token, user: publicUser(u) });
}
