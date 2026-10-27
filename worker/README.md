# Kumru `worker/`: the server

This is the Cloudflare Worker behind `turk.shab.boo/api`. It also serves the page routes `/f/<code>`, `/c/<code>` and `/@<username>`. Its tree mirrors the browser app: a feature with a server half lives in `worker/features/<id>/`, under the same id as `app/features/<id>/` ([app/README.md](../app/README.md)), and its route types and document shapes live in `shared/<id>.ts`. Every route and table is documented first in [docs/SPECS_API.md](../docs/SPECS_API.md) and [docs/SPECS_SCHEMA.md](../docs/SPECS_SCHEMA.md).

The Worker was one tree with a central route table (`worker/src/`); it now has the layout below (plan steps 3a and 3b: `~/.claude/plans/plan-for-a-refactor-tender-zephyr.md`).

## Layout

```text
worker/
  index.ts          entry: builds the Worker from core + features/index.ts (wrangler.jsonc "main")
  core/             knows no feature:
                    router (+ route options), registry (the feature list and what is derived from it), feature (the contract),
                    http (errors, json, request ids, logs), cors, body, db (quota-aware first/all/run/batch),
                    crypto, limits (the mechanism, its table and the anon rule), session (authenticate, requireUser, publicUser),
                    env (hand-written: `wrangler types` would put each machine's `.dev.vars` secrets into the file), cron dispatcher,
                    MIN_CLIENT check, CORS, the page helper (HTMLRewriter OG tags), health, pageVersion
  features/
    index.ts        the ServerFeature list
    <id>/
      index.ts      `feature` (a ServerFeature)
      routes.ts     handlers
      queries.ts    its SQL, when there is enough of it to separate
      *.test.ts     vitest in workerd, beside the code it covers
  migrations/       one flat, append-only directory (wrangler's migrations_dir)
  test/             helpers.ts, setup.ts, env.d.ts, and cross-feature integration tests (cron, export/delete, routing)
  seed/             the local seed accounts (pnpm seed)
```

## The server contract

```ts
// core/feature.ts
interface ServerFeature {
  id: string;
  routes?: Route[];       // [method, pattern, handler, { cors?: "yeni", errors?: "flat" }?]
  pages?: Route[];
  docs?: { kinds?: Record<string, { limit: number; keys: ReadonlySet<string>; validate?(body): void }>; onPut?(put: DocPut): Promise<void> };
  cron?: { when(hourUtc: number): boolean; run(env, time): Promise<unknown> }[];
  sweep?: { order: number; statements(env, now): D1PreparedStatement[] };
  account?: { export?(who: { user, env }): Promise<Record<string, unknown>>; remove?(who: { user, env }): D1PreparedStatement[] };
  rules?: Record<string, Rule>;
}
```

What core does with each field:

- **`routes` and `pages`** are concatenated in feature order. A test fails on a duplicate method + pattern, and on a parameter pattern that would shadow a literal one. Every `pages` prefix must be listed in `run_worker_first` in `wrangler.jsonc`; a test checks that too.
- **CORS and errors.** Core answers `OPTIONS` before it matches a route. A route marked `cors: "yeni"` gets the reader's CORS headers. One marked `errors: "flat"` answers `{ error: code }` instead of `{ error: { code, message } }`.
- **`MIN_CLIENT`.** Core checks every `/api` route against it (the `426` that triggers the page's update).
- **`docs`.** A feature claims the document kinds served at `/api/doc/:kind` (`progress` is the progress feature's, `tutor` the tutor feature's; the reader's `yeni` notebook has its own routes) and may add a side-write after a `PUT`: the `weak` summary (progress) and the class-shared `book` summary (yeni) work this way. Extras share `putDoc`'s body allowance; a bad one is dropped, not an error.
- **`cron`.** The hourly trigger (`0 * * * *`) runs every job whose `when(hour)` is true, using `Promise.allSettled`.
- **`sweep`.** The nightly sweep collects every feature's statements and runs them in one batch, in `order` (yeni 20, core's rate-limit windows 30, account 90: the hard delete of old soft-deleted users runs last).
- **`account`.**
  - `GET /api/export` merges every feature's `export` into the frozen v1 shape, pinned by a test.
  - `POST /api/delete` runs every feature's `remove` statements in one atomic batch, after account's own.
- **Rate limits.** A feature defines its rules in `rules.ts` (`defineRule(key, limit, window)`), passes them to `hit`/`check`, and lists them under `rules`; a test checks that keys are unique across features. The `limits` table and the `anon` rule belong to core.
- **Backups** list tables from `sqlite_master`, so later migrations are covered without a table list.

Cross-table readers are declared, not hidden. `owner` (admin stats, the users table, backups) and account's export read other features' tables, and their README says which.

## Features with a server half

| id | Routes | Tables |
|---|---|---|
| account | signup, login, logout, recover, password, me, sessions, pair, export, delete | users, sessions, pairings |
| progress | `GET`/`PUT /api/doc/:kind` (progress, tutor) | docs, weak |
| friends | profile, friends, profiles/search, users; pages `/f/:code`, `/@/:username` | profiles, follows |
| classes | classes and its sub-routes; page `/c/:code` | classes, class_members |
| reminders | push key, subscriptions; the reminders cron job; Web Push (VAPID) | push_subs |
| yeni | yeni origins, codes, token, tokens, notebook, doc (bearer); the class-shared book through `docs.onPut` | yeni_tokens, yeni_codes, book |
| tutor | `POST /api/ai` (the paid-tier stub) | — |
| owner | admin stats, weak, users, undelete, backups; the backup cron job (R2 `BACKUPS`) | — |
| dev | `POST /api/dev/login` (only when `DEV` is `"1"`) | — |

Health (`GET /api/health`) is core.

## Rules

- **Boundaries.** `worker/core` never imports a feature (`features/index.ts` is the only exception). A feature imports another only through its `index.ts`. `worker/` never imports `app/`.
- **Contracts first.** A new route or table goes into `docs/SPECS_API.md` or `docs/SPECS_SCHEMA.md` and `shared/<id>.ts` first, then the handler, in the same commit. `shared/api.ts` re-exports every contract for older references.
- **Migrations.**
  - They are append-only and live in one flat directory, because wrangler allows one `migrations_dir` per database.
  - `0001`–`0008` keep their names forever: `d1_migrations` stores them.
  - New ones are named `NNNN_<feature>_<what>.sql`. Each feature's README lists its tables.
- **Production data.** Never run ad-hoc SQL against the production D1, except the two statements documented in `AGENTS.md`.
- **Secrets** (`PEPPER`, `TURNSTILE_SECRET_KEY`, `VAPID_PRIVATE`) live only in Cloudflare. `wrangler.jsonc` holds public `vars` only.
- **Tests.** Run with `pnpm test`, which uses vitest with `@cloudflare/vitest-pool-workers`. The `include` covers `worker/**/*.test.ts` only. A test sits beside the feature it covers. Tests that span features stay in `worker/test/`.
