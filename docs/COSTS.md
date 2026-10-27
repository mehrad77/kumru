# COSTS.md: what Kumru can cost, and how to check

Kumru is meant to cost **$0**. This note says why it should, which part could still bill, and how to check. The budget behind it is `docs/SPECS.md` §12; the check is the `kumru-costs` skill (`.claude/skills/kumru-costs/SKILL.md`), run it every month or two, and after a big change to what the Worker reads, writes or stores.

## What is used

| Piece | Binding or setting | Free limit | Past the limit |
|---|---|---|---|
| Worker | `yakerim` | 100,000 requests a day (only `/api/*`, `/f/*`, `/c/*` count), 10 ms CPU per request | Requests fail until 00:00 UTC. No charge. |
| Static assets | `assets` | Unlimited; do not count as Worker requests | n/a |
| D1 | `DB` → `yakerim` | 5M rows read a day, 100,000 rows written a day, 5 GB | Queries fail until 00:00 UTC; data is kept. No charge. |
| R2 | `BACKUPS` → `yakerim-backups` | 10 GB-month, 1M writes (class A), 10M reads (class B) a month | **Billed** if a payment method is on file. R2 has no hard cap. |
| Cron Triggers | `0 * * * *` | Free | n/a |
| Turnstile, Web Push, Workers Logs | | Free tiers | n/a |

On the Workers **Free** plan, Workers and D1 stop instead of charging. The only way to be billed is to be on **Workers Paid** ($5 a month, charged by subscription) or to use more R2 than the free tier.

## Where the real risks are

1. **The plan changes.** Someone (or an upgrade prompt) moves the account to Workers Paid. Check Billing, Subscriptions.
2. **R2 grows.** The nightly backup keeps 30 days (`backups/<date>/`). It is megabytes today; it only matters if the lifecycle rule is missing (then it never deletes) or the data grows by a thousand times. Expected size: tens of MB. Free tier: 10 GB.
3. **A new billable binding.** KV, Queues, Durable Objects, Workers AI, Vectorize, Browser Rendering and Containers all bill. None is used. Adding one needs a conscious decision.
4. **D1 reads.** A query without an index scans the table and counts every row it touched. A change that adds a table scan to a hot route (`/api/friends`, `/api/doc`) can eat the 5M a day quickly. The skill compares the last 24 hours with the limit.
5. **Request volume.** Only if the app is shared widely. 100,000 requests a day is roughly a few hundred active learners.
6. **Reader notebook sync.** Notebook calls `/api/yeni/doc` with its own token: a pull when its tab becomes visible and a push about every 10 s of writing. Expect 20–80 requests and up to 140 D1 writes a day per syncing learner (`docs/SPECS.md` §10.10).
7. **Book bridge.** The Kumru page reads a linked learner's notebook (`GET /api/yeni/notebook`) when Path or Profile is drawn, at most every 10 minutes (once a day for unlinked accounts), plus one `GET /api/classes` per page load for linked learners: about 2 row reads each and no writes; a 304 sends no body. A learner who shares book progress with a class also sends `book` with a progress save when the summary changes (one extra small write, at most once a minute).

## How to check (the skill)

Run it from this repository with Claude Code:

```text
/kumru-costs
```

It reads, and changes nothing: D1 size and the last 24 hours of rows read and written (`wrangler d1 info`), R2 object count and size (`wrangler r2 bucket info`), the bindings in `wrangler.jsonc`, and the lifecycle rule. It then asks you for the few numbers only the dashboard shows (plan, billable usage, Worker requests), compares everything with the limits above, and reports **OK, watch or act** for each line.

By hand, the same checks:

- **Plan:** dash.cloudflare.com, Billing, Subscriptions. No Workers Paid line.
- **Billable usage:** Billing, Billable usage. It should read $0.00.
- **Worker requests:** Workers & Pages, `yakerim`, Metrics.
- **D1:** D1, `yakerim`, Metrics, Row Metrics.
- **R2:** R2, `yakerim-backups`, Metrics; Settings should show a 30-day object lifecycle rule.

## Set these once

- **Billing alert:** Notifications, Add, Billing, usage-based billing, to your email. It warns before you are billed; it is not a cap.
- **R2 lifecycle rule:** `yakerim-backups`, Settings, Object lifecycle rules, delete after 30 days.
- **D1 free-limit emails:** Cloudflare emails the account when a free daily D1 limit is reached; keep those emails on.

## If a number is high

| Sign | Likely cause | Fix |
|---|---|---|
| D1 rows read over 50% of 5M a day | A route scans a table | Add an index or narrow the query; look at `/api/friends`, `/api/admin/*` |
| D1 rows written over 50% of 100k a day | A route writes on every request | Throttle the write (progress saves, `weak` summary, session touch) |
| Worker requests over 50% of 100k a day | Real growth, or a client loop | Check Workers Logs for one route dominating; the client pull is throttled to 10 s |
| `/api/yeni/*` dominating the logs | A Notebook pushing or pulling in a loop | Each learner is capped at 120 a 10 min by the `yeni` limit; revoke the token (Account card) and fix the reader's sync (`apps/reader/src/lib/notebook/`) |
| R2 over 1 GB | Lifecycle rule missing | Add the 30-day rule; delete old `backups/<date>/` |
| Workers Paid on the plan | Upgrade by accident | Downgrade in Billing; the app runs on Free |

If the app has outgrown the free limits, Workers Paid ($5 a month) is the first paid step (`docs/SPECS.md` §12).
