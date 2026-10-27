/* The hourly scheduled handler (docs/SPECS_API.md section 12) dispatches on the UTC hour: the sweep at 04:00, then every feature's
   jobs that are due. Every job is idempotent: a tick that runs twice does no harm. */
import type { Env } from "./env.ts";
import { cronJobs } from "./registry.ts";
import { sweep } from "./sweep.ts";

export async function scheduled(time: number, env: Env): Promise<void> {
  const hour = new Date(time).getUTCHours();
  const jobs: Promise<unknown>[] = [];
  if (hour === 4) jobs.push(sweep(env, time));
  for (const j of cronJobs(hour) ?? []) jobs.push(j.run(env, time));
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error(JSON.stringify({ cron: hour, error: String(r.reason) }));
}
