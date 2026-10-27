/* The 04:00 UTC sweep (docs/SPECS_API.md section 12.3). Every feature contributes its statements (expired sessions, pairings,
   reader connect codes, book summaries nobody is shared with any more, accounts soft-deleted more than 7 days ago); core adds the
   expired rate-limit windows. They run in one batch, in order. */
import { batch } from "./db.ts";
import type { Env } from "./env.ts";
import { sweepStatements } from "./registry.ts";

const DAY = 86_400_000;

export async function sweep(env: Env, now = Date.now()): Promise<void> {
  await batch(env.DB, sweepStatements(env, now, { order: 30, statements: [env.DB.prepare("DELETE FROM limits WHERE window_start < ?").bind(now - DAY)] }));
}
