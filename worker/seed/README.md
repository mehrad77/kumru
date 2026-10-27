# Seeded accounts (`pnpm seed`)

Local D1 only (`wrangler dev`). `pnpm seed` replaces these accounts each time it runs; open one in the browser
pane with `http://localhost:8787/?as=<username>` (dev only: `POST /api/dev/login`, no password).

| Username | Password | State |
|---|---|---|
| `ada` | `ada-password` | Mid-A1: words of A1 units 1–3 known, their lessons learned, place A1 · Unit 4, a 5-day streak. Friend code `ADA234`. |
| `ali` | `ali-password` | Placed past at B1 · Unit 1 by a placement test; A1 units 1–2 known, a 1-day streak. Friend code `ALI234`. |
| `nur` | `nur-password` | New: an account with no progress on the server, so signing in uploads this device's signed-out progress. |
| `owner` | `owner-password` | `role = 'owner'`: the Owner tab (phase 4) and `canEdit()`. |

Every account's recovery code is `SEED2-SEED2`.

Friends: `ada` and `ali` follow each other; `owner` follows `ada`. Classes **504** (`YK0504`) and **506** (`YK0506`), offered in onboarding, belong to a local `admin` that `pnpm dev` adds (it cannot sign in; `?as=admin` works). Class **Ali's Turkish Circle** (`ALI234`) is taught by `ali`, with `ada` sharing and `nur` not. Class **A1 Salı** (code `CLS234`) is owned by `owner`, with `ada` sharing the teacher view and `ali` not.

Two devices, one account: open `?as=ada` in two browser tabs or contexts (the Playwright smoke test does this), answer
in both, and both end on one document. A stale overnight tab is the same thing with one tab left hidden while the
other answers: when it comes back to the front it pulls (`?since=rev`) and merges before its next save.
