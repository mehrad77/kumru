---
name: kumru-costs
description: Check that Kumru (turk.shab.boo) is still inside Cloudflare's free tier. Reads D1 and R2 usage with wrangler, checks the bindings for billable products, asks the user for the few dashboard-only numbers, and reports OK, watch or act per line. Read-only. Run it every month or two, or after changing what the Worker reads, writes or stores.
---

# kumru-costs

Goal: confirm Kumru costs $0 and say what to fix if it does not. The limits and reasoning are in `docs/COSTS.md`; read it first so the numbers below match.

**Read-only.** Run only the commands below. Never run SQL against the production D1 (not even a `SELECT`; `wrangler d1 info` gives the counters), never change a plan, a rule, a secret or a deploy. If something needs changing, say what and let the user do it.

All wrangler commands run from the repo root.

## 1. Gather

Run these and note the numbers:

```bash
pnpm exec wrangler d1 info yakerim
pnpm exec wrangler r2 bucket info yakerim-backups
pnpm exec wrangler r2 bucket lifecycle list yakerim-backups
```

From `d1 info`: `database_size`, `rows_read_24h`, `rows_written_24h`. From `r2 bucket info`: `object_count` and `bucket_size`. From `lifecycle list`: whether a rule deletes objects after 30 days (if the command fails, say so and ask the user to read the rule in the dashboard).

Then read `wrangler.jsonc` and list every binding and trigger. Billable products that must not appear without a decision: `kv_namespaces`, `queues`, `durable_objects`, `ai`, `vectorize`, `browser`, `containers`, `hyperdrive`, extra `d1_databases` or `r2_buckets`, more than the one cron. Expected: `d1_databases` (DB), `r2_buckets` (BACKUPS), `assets`, `triggers.crons` (one hourly), `observability`.

## 2. Ask the user for the dashboard-only numbers

One message, three items (they take a minute in dash.cloudflare.com):

1. Billing, Subscriptions: is there a **Workers Paid** or any other paid line? (Free is expected.)
2. Billing, Billable usage: the total for the current period (expected $0.00).
3. Workers & Pages, `yakerim`, Metrics: requests in the last 24 hours and, if visible, the busiest day this month.

If they have none of this to hand, finish with what you have and mark those lines "not checked".

## 3. Compare

Free limits (Workers Free plan):

| Line | Limit | Source value |
|---|---|---|
| Worker requests | 100,000 a day | dashboard |
| D1 rows read | 5,000,000 a day | `rows_read_24h` |
| D1 rows written | 100,000 a day | `rows_written_24h` |
| D1 storage | 5 GB | `database_size` |
| R2 storage | 10 GB | `bucket_size` |
| R2 objects | 30 nightly folders of a few files each (expect under 500) | `object_count` |
| Plan | Free | dashboard |
| Billable usage | $0.00 | dashboard |

Verdict per line: **OK** under 50% of the limit, **watch** 50 to 80%, **act** over 80%, or a paid plan, a nonzero bill, a missing R2 lifecycle rule, or an unexpected billable binding. `rows_*_24h` are a rolling 24 hours, so compare them with the daily limits as they are.

Extra checks:

- R2 size growing without bound: a missing lifecycle rule is the usual cause. With 30 days kept and nightly backups, `object_count` should be roughly flat.
- A high D1 read count with few requests points to a table scan; name the likely routes (`/api/friends`, `/api/admin/*`) and say to add an index or narrow the query.
- Compare with the previous run if the user has the earlier numbers; say which way each line is moving.

## 4. Report

Finish with a short table (line, value, limit, percent, verdict) and then:

- one sentence overall: "all free" or "at risk: <line>";
- for each **watch** or **act** line, the cause and the fix from the "If a number is high" table in `docs/COSTS.md`;
- the date, so the next run can compare. Offer to append the numbers to a log only if the user asks.

Do not fix anything unprompted. If the report needs a code change (an index, a throttle), propose it and wait.
