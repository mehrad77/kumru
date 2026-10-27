/* GET /c/:code: the page with link-preview tags naming the class's teacher (docs/SPECS_API.md section 3). */
import { first } from "../../core/db.ts";
import { page } from "../../core/pages.ts";
import type { Ctx } from "../../core/router.ts";

export async function classInvite(ctx: Ctx): Promise<Response> {
  const code = ctx.params.code.toUpperCase();
  const row = await first<{ name: string; username: string }>(ctx.env.DB,
    "SELECT c.name, u.username FROM classes c JOIN users u ON u.id = c.owner WHERE c.code = ?", code);
  return page(ctx, row ? `Join ${row.name} on Kumru` : "Join a class on Kumru",
    row ? `${row.username} invites you to their class: a weekly board for practising Turkish together.` : "A weekly board for practising Turkish together.");
}
