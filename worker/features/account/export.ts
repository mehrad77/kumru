/* GET /api/export and POST /api/delete (docs/SPECS_API.md section 8). What is exported and what is removed comes from every feature. */
import { checkPassword } from "./credentials.ts";
import { requireUser } from "../../core/session.ts";
import { readJson, str } from "../../core/body.ts";
import { batch } from "../../core/db.ts";
import { HttpError, json } from "../../core/http.ts";
import { accountExport, accountRemoval } from "../../core/registry.ts";
import type { Ctx } from "../../core/router.ts";

/** GET /api/export: the account's own data, one JSON file. The sections come from the features (their `account.export`); the frozen v1 shape is pinned by a test. */
export async function exportData(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const now = Date.now();
  const out = { format: "kumru-export", v: 1, exported: now, ...(await accountExport({ user, env: ctx.env })) };
  const day = new Date(now).toISOString().slice(0, 10);
  return json(out, 200, { "Content-Disposition": `attachment; filename="kumru-${user.username}-${day}.json"` });
}

export async function deleteAccount(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  const o = await readJson(ctx.req);
  if (!(await checkPassword(ctx.env, user, str(o, "password", { max: 200 })))) {
    throw new HttpError("invalid", "The password is wrong.", { field: "password" });
  }
  // one atomic batch: the account's own statements, then every feature's
  await batch(ctx.env.DB, accountRemoval({ user, env: ctx.env }));
  return new Response(null, { status: 204 });
}
