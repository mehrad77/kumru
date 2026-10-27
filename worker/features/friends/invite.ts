/* GET /f/:code and /@:username: the page with link-preview tags (docs/SPECS_API.md section 3). One row read each. */
import { first } from "../../core/db.ts";
import { page } from "../../core/pages.ts";
import type { Ctx } from "../../core/router.ts";

export async function friendInvite(ctx: Ctx): Promise<Response> {
  const code = ctx.params.code.toUpperCase();
  const row = await first<{ body: string }>(ctx.env.DB, "SELECT body FROM profiles WHERE code = ?", code);
  const nick = row ? String(JSON.parse(row.body).nick || "").slice(0, 30) : "";
  return page(ctx, nick ? `${nick} invites you to Kumru` : "Learn Turkish with Kumru", "Follow each other on Kumru and practise Turkish together, a few minutes a day.");
}

export async function profileInvite(ctx: Ctx): Promise<Response> {
  const row = await first<{ username: string; body: string | null }>(ctx.env.DB,
    "SELECT u.username, p.body FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.username = ? AND u.deleted IS NULL", ctx.params.username.toLowerCase());
  const nick = row?.body ? String(JSON.parse(row.body).nick || "").slice(0, 30) : "";
  return page(ctx, row ? `${nick || row.username} on Kumru` : "Learn Turkish with Kumru",
    row ? `Follow @${row.username} on Kumru and practise Turkish together, a few minutes a day.` : "Follow each other on Kumru and practise Turkish together, a few minutes a day.");
}
