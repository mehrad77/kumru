/* Fixed-window rate limits kept in D1 (docs/SPECS_API.md section 1.7): an isolate's memory is neither shared
   nor durable. Each check is one upsert. */
import { first, run } from "./db.ts";
import { HttpError } from "./http.ts";

const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

/** A rate-limit rule: `key` names it in the `limits` table (`<key>:<subject>`), so keys are unique across features (a test checks). */
export interface Rule { key: string; limit: number; window: number }
export const defineRule = (key: string, limit: number, window: number): Rule => ({ key, limit, window });
/** Window lengths for rules, in ms. */
export const ms = { min: MIN, hour: HOUR, day: DAY } as const;

/** Anyone may call a route without a session; these count against the caller's IP. */
export const ANON = defineRule("anon", 120, 15 * MIN);

function limited(windowStart: number, window: number, now: number): never {
  const retryAfter = Math.max(1, Math.ceil((windowStart + window - now) / 1000));
  throw new HttpError("rate_limited", "Too many tries. Wait a little and try again.", { retryAfter });
}

/** Count one event and throw rate_limited when the window is over its limit. */
export async function hit(db: D1Database, rule: Rule, subject: string, now = Date.now()): Promise<void> {
  const { limit, window } = rule;
  const row = await first<{ count: number; window_start: number }>(db,
    `INSERT INTO limits (key, count, window_start) VALUES (?1, 1, ?2)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN window_start <= ?2 - ?3 THEN 1 ELSE count + 1 END,
       window_start = CASE WHEN window_start <= ?2 - ?3 THEN ?2 ELSE window_start END
     RETURNING count, window_start`, `${rule.key}:${subject}`, now, window);
  if (row && row.count > limit) limited(row.window_start, window, now);
}

/** Throw rate_limited if the window is already full, without counting (failure-only rules: login). */
export async function check(db: D1Database, rule: Rule, subject: string, now = Date.now()): Promise<void> {
  const { limit, window } = rule;
  const row = await first<{ count: number; window_start: number }>(db,
    "SELECT count, window_start FROM limits WHERE key = ?", `${rule.key}:${subject}`);
  if (row && row.window_start > now - window && row.count >= limit) limited(row.window_start, window, now);
}

export async function clear(db: D1Database, rule: Rule, subject: string): Promise<void> {
  await run(db, "DELETE FROM limits WHERE key = ?", `${rule.key}:${subject}`);
}

/** IP-keyed limits (signup, pair, anon) are skipped under `wrangler dev`, where every request comes from
 * one address and the local D1 outlives test runs; the Worker tests run with DEV off and cover them. */
export async function hitIp(db: D1Database, env: { DEV: string }, rule: Rule, req: Request): Promise<void> {
  if (env.DEV === "1") return;
  await hit(db, rule, clientIp(req));
}

export function clientIp(req: Request): string {
  return req.headers.get("CF-Connecting-IP") || "local";
}
