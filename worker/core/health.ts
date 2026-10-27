/* GET /api/health (docs/SPECS_API.md section 11). */
import type { Health } from "../../shared/api.ts";
import { first } from "./db.ts";
import { json } from "./http.ts";
import type { Ctx } from "./router.ts";

/** The build version, from the static data manifest (an asset fetch: free, no D1). */
export async function pageVersion(ctx: Ctx): Promise<string> {
  const r = await ctx.env.ASSETS.fetch(new URL("/data/manifest.json", ctx.url));
  if (!r.ok) return "unknown";
  const m = await r.json<{ version?: string }>();
  return m.version ?? "unknown";
}

export async function health(ctx: Ctx): Promise<Response> {
  const db = (await first<{ ok: number }>(ctx.env.DB, "SELECT 1 AS ok"))?.ok === 1;
  const body: Health = { ok: db, version: await pageVersion(ctx), time: Date.now(), db };
  return json(body, db ? 200 : 500);
}
