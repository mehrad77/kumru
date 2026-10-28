# Kumru API

The HTTP contract of the `yakerim` Worker at `https://turk.shab.boo`. It is the companion of [SPECS.md](SPECS.md) (the plan) and [SPECS_SCHEMA.md](SPECS_SCHEMA.md) (tables, documents and files). `shared/api.ts` implements this document: a route that is not here does not ship, and a change here lands in the same commit as the code.

Phases refer to SPECS.md §4–§10. A route is served only from its phase on; before that it answers `404 not_found`.

## 1. Conventions

### 1.1 Origin and paths

- One origin, `https://turk.shab.boo`. No CORS headers are sent; a browser on another origin cannot call the API. The one exception is Notebook's two cross-origin paths, `/api/yeni/doc` and `/api/yeni/token` (§11a), which answer CORS for the origins in the `YENI_ORIGINS` var only.
- `/api/*` is the Worker. Everything else is a static asset (§2) except `/f/:code`, `/c/:code` and `/@:username` (§3).
- All API responses carry `Cache-Control: no-store`.

### 1.2 Formats

- Requests and responses are JSON, UTF-8, `Content-Type: application/json`. A request body that is not valid JSON answers `400 invalid`.
- Times are integers, milliseconds since the Unix epoch, the page's `Date.now()`. Day keys are `YYYY-MM-DD` in the learner's local calendar; week keys are ISO weeks `YYYY-Www` from the page's `weekKey`. The server stores both as the client sends them and never recomputes them in UTC.
- Ids and codes:

| Thing | Shape | Made by |
|---|---|---|
| user id | 26 characters, base32 of 16 random bytes, lower case | server |
| session id | 16 characters, same alphabet | server |
| session token | 43 characters, base64url of 32 random bytes; sent, never stored | server |
| friend code | 6 characters from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (the page's `FR_ABC`) | client proposes, server guarantees uniqueness |
| class code | 6 characters, same alphabet | server |
| pairing code | 12 characters, same alphabet | server |
| recovery code | 10 characters, same alphabet, shown as `XXXXX-XXXXX`; dashes and case are ignored on input | server |
| username | 3–24 characters of `[a-z0-9_.]`, compared case-insensitively | learner |

### 1.3 Authentication

- Signed-in requests send `Authorization: Bearer <session token>`.
- The Worker hashes the token (SHA-256), looks the session up, checks `expires`, and slides `expires` forward by 90 days when `refreshed` is older than 24 hours (one write per device per day at most).
- A missing, unknown or expired token answers `401 unauthorized`. A route marked **owner** answers `403 forbidden` to anyone whose `users.role` is not `owner`.
- Ownership is implicit: a signed-in route only reads and writes rows of the caller. No route takes another learner's id for a write.
- **Reader tokens** (§11a) are a second kind of bearer token, kept in `yeni_tokens`, not `sessions`. They work only on `/api/yeni/doc`, `DELETE /api/yeni/token` and `GET /api/yeni/check`; a session token is refused there and a reader token everywhere else. The reader gets one by trading a one-time code (`POST /api/yeni/token`), never from a URL. [AUTH.md](AUTH.md) explains every credential and flow.

### 1.4 Errors

Every non-2xx response is

```json
{ "error": { "code": "conflict", "message": "Your copy is behind.", "rev": 12, "body": { } } }
```

`code` is from the union below; `message` is for logs and toasts, not for branching. Extra fields are listed per route. The reader's bearer routes (§11a) are the exception: their errors are flat, `{ "error": "<code>" }` (plus `retryAfter` on 429 and `requestId` on 500), and their 409 is `{ "error": "conflict", "rev", "doc" }`.

| Code | HTTP | Meaning |
|---|---|---|
| `invalid` | 400 | Malformed JSON, a missing or badly shaped field, a username or password outside the rules, a bad Turnstile token. `field` names the first offender. |
| `unauthorized` | 401 | No valid session. |
| `forbidden` | 403 | Signed in, but not allowed: not the owner, not a class member, not the class owner. |
| `not_found` | 404 | No such route, document, class or session; or a route from a later phase. |
| `taken` | 409 | Username, friend code or class name already in use. |
| `conflict` | 409 | `baseRev` is behind. Carries `rev`, `updated`, `body` (the server's current document). |
| `gone` | 410 | A pairing code that expired or was already used. |
| `too_large` | 413 | Body over the limit for that route. |
| `upgrade_required` | 426 | The page's version is listed in `MIN_CLIENT`; the client must reload (§1.6). |
| `rate_limited` | 429 | Carries `retryAfter` (seconds) and the `Retry-After` header. |
| `payment_required` | 402 | `POST /api/ai` on a free plan. |
| `not_implemented` | 501 | `POST /api/ai` on a paid plan before the AI plan exists. |
| `quota_exceeded` | 503 | D1 refused the query because a daily free-plan limit was hit. Data is intact; the client keeps its dirty flag and retries after 00:00 UTC. |
| `internal` | 500 | Anything else. The response carries `requestId`. |

Client-only codes (never sent by the server, produced by `app/host/transport.ts`): `offline` (fetch failed) and `aborted`.

### 1.5 Headers

| Header | Direction | Meaning |
|---|---|---|
| `Authorization: Bearer …` | request | session token |
| `X-Kumru-Client: <version>` | request | the page's build version (from `<meta name="kumru-version">`) |
| `X-Request-Id` | response | 16 random characters; the same id is in the Worker's log line |
| `Retry-After` | response | seconds, on 429 and 503 |
| `CF-Connecting-IP` | request (set by Cloudflare) | the address rate limits use |

### 1.6 Client version

`MIN_CLIENT` is a Worker `var`: a comma-separated list of retired page versions. Build versions are content hashes (SPECS_SCHEMA.md §4.2), so they have no order; a request whose `X-Kumru-Client` is in the list answers `426 upgrade_required`, and the client then tells the service worker to update and reloads. This is the lever for retiring a page version with a bug that would corrupt documents. Normally the list is empty.

### 1.7 Rate limits

Counters live in the `limits` table (SPECS_SCHEMA.md §2.10), keyed `<rule>:<subject>`, with a fixed window. Each check is one read and one write, so the rules below apply only where abuse is possible; signed-in writes are limited by a minimum interval instead, which needs no extra row.

| Rule | Subject | Limit | Window | Routes |
|---|---|---|---|---|
| `signup` | IP | 5 | 1 h | `POST /api/signup` |
| `login-user` | username | 10 failures | 15 min | `POST /api/login` (a success deletes the counter) |
| `login-ip` | IP | 30 failures | 15 min | `POST /api/login` |
| `recover` | username | 5 | 1 h | `POST /api/recover` |
| `pair` | IP | 10 | 1 h | `POST /api/pair/claim` |
| `anon` | IP | 120 | 15 min | every `/api` request without a valid session |
| `search` | user | 60 | 15 min | `GET /api/profiles/search` |
| `class-create` | user | 5 | 24 h | `POST /api/classes` |
| `class-join` | user | 20 | 24 h | `POST /api/classes/join` |
| `yeni` | user | 120 | 10 min | `GET` and `PUT /api/yeni/doc` (one every 5 s on average, bursts allowed) |
| `yeni-token` | user | 20 | 24 h | `POST /api/yeni/codes` |
| `yeni-code` | IP | 30 | 10 min | `POST /api/yeni/token` (the code exchange) |
| `yeni-check` | user | 60 | 10 min | `GET /api/yeni/check` (server to server, so per learner rather than per IP) |

Minimum intervals, enforced from the row's own `updated` column (no counter): `PUT /api/doc/*` 1 s, `PUT /api/yeni/doc` 1 s, `PUT /api/profile` 1 s; the `weak` and `book` summaries that ride along with a progress save are stored at most once a minute (older ones are skipped, not refused). A faster repeat answers `429 rate_limited` with `retryAfter: 1`. The page debounces saves by 1.2 s and 1.5 s, so a correct client never hits these.

### 1.8 Size limits

| Body | Limit |
|---|---|
| any request | 256 KB, measured on the raw body; over it is `413 too_large` before parsing (`PUT /api/yeni/doc`: 516 KiB) |
| progress document | 256 KB |
| tutor document | 64 KB |
| profile document | 16 KB; `following` ≤ 500 ids; `cheers` ≤ 200 entries; `nick` ≤ 30 characters |
| weak summary | 8 KB |
| book summary (`book`) | 4 KB |
| reader notebook (`yeni`) | 512 KiB, measured on `JSON.stringify(doc)` |
| class name | 40 characters |
| class description, schedule | 280 and 60 characters (trimmed) |
| `ids` query lists | 100 ids per request |

### 1.9 Retries

- `GET` and `PUT` are idempotent. The client retries them on `offline`, 5xx and `quota_exceeded` with exponential backoff (2 s, 4 s, … 5 min) and keeps `kumru:dirty` until a save succeeds.
- `POST /api/signup`, `/login`, `/recover`, `/pair/claim` and `/delete` are not retried automatically.
- A `409 conflict` is not an error to retry blindly: the client merges (SPECS.md §9) and sends a new `baseRev`.

## 2. Static routes

Served by Workers static assets, free and uncounted. Produced by `vite build` (SPECS_SCHEMA.md §4).

| Path | Content | Cache |
|---|---|---|
| `/`, `/index.html` | the page | `no-cache` (revalidate; the service worker holds the copy that works offline) |
| `/data/manifest.json` | collection → hashed file name, build version, counts | `no-cache` |
| `/data/<collection>.<hash>.json` | one collection, keyed by id | `immutable`, 1 year |
| `/sw.js` | service worker | `no-cache` |
| `/manifest.webmanifest`, `/icon.svg`, `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon-180.png` | brand | 1 day |
| `/f/*`, `/c/*` | not assets; see §3 | — |

Unknown paths outside `/api` fall back to `/index.html` with 200 so the page can read `location` path itself.

The page's own screens are paths, not `#` routes (the old `#tab`, `#card=` and `#pair=` links still land on the right screen):

| Path | Screen |
|---|---|
| `/path`, `/stories`, `/lab`, `/friends`, `/owner` | the tabs (`/` opens the last one used) |
| `/@<username>` | the Profile tab for your own name; another learner's profile sheet otherwise |
| `/stories/<id>`, `/lesson/<id>` | a story, a grammar lesson |
| `/c/<code>` | the class page when you are in it, else the join sheet |
| `/card/<id>` | a card's sheet (the reader's "Practise in Kumru" link) |
| `/pair/<code>` | claims an add-a-phone code, then goes to `/` |
| `/connect/yeni?return=<url>&state=…&code_challenge=…&code_challenge_method=S256` | Notebook's consent sheet (§11a) |
| `/unit/<REF>` | the Path at that book unit (`A1_3`): its sheet open, or its skill-tree section; a locked unit shows *Jump here* / *Test out*, never an open checkpoint. The reader's "Practise Ünite N in Kumru" link. |
| `/f/<code>` | a friend invite (follows after sign-in) |
| `/onboarding`, `/kerim` | dev screens: the full onboarding, the Kerim gallery |

## 3. Page routes served by the Worker

These return the page HTML (the same `index.html`) with three meta tags filled in, so a link preview shows who is inviting. One row read each. Phase 3.

### `GET /f/:code`

Invite link from Friends. Looks up `profiles.code`; sets `og:title` to "Join <nick> on Kumru", `og:description` and `og:url`. Unknown code: the plain page. The client reads the code from `location.pathname`, keeps it as `kumru:pending-follow`, and follows after sign-in.

### `GET /@:username`

Personal profile link. Looks up `users.username` (lowercased) joined to `profiles`; `og:title` "<nick> on Kumru". Unknown name: the plain page. The client reads the name from `location.pathname`, keeps it as `kumru:pending-profile`, and opens that learner's sheet after sign-in and Friends load.

### `GET /c/:code`

Class link. Looks up `classes.code`; `og:title` "Join the class <name> on Kumru". The client keeps `kumru:pending-class` and calls `POST /api/classes/join` after sign-in.

## 4. Auth

### `POST /api/signup` — phase 2

- Auth: none. Limits: `signup`, `anon`. Turnstile required in production (skipped when `TURNSTILE_SITE_KEY` is empty, which is only in `wrangler dev`).
- Request `{ username, password, turnstile, tz?, label? }`. `tz` is an IANA zone; `label` is the device description the client derives from the user agent.
- Response `201 { token, user: { id, username, role, plan }, recovery }`. `recovery` is shown once; the client never stores it.
- Errors: `invalid` (`field`: `username` | `password` | `turnstile`), `taken` (username), `rate_limited`.
- Rows: `users` +1, `sessions` +1, in one D1 batch. No profile row until the first `PUT /api/profile`.
- Notes: username uniqueness is the `UNIQUE COLLATE NOCASE` constraint; a race answers `taken`. The password is hashed with PBKDF2-SHA-256 (`pw_iter` from the `PBKDF2_ITER` var, 25,000 after tuning on the deployed Worker; SPECS.md §8.3), a 16-byte salt and the `PEPPER` secret. The recovery code is stored as HMAC-SHA-256(`PEPPER`, code).

### `POST /api/login` — phase 2

- Auth: none. Limits: `login-user`, `login-ip`, `anon`.
- Request `{ username, password, tz?, label? }`.
- Response `200 { token, user: { id, username, role, plan } }`.
- Errors: `invalid` (wrong username or password; the message does not say which), `rate_limited`.
- Rows: `users` 1 read, `sessions` +1, `limits` 1 write (failure) or 1 delete (success after failures), `users.tz` 1 write when it changed.
- Notes: a soft-deleted account (`users.deleted` set, within 7 days) is restored by a successful login: `deleted` is cleared and the response carries `restored: true`. Password comparison is constant-time.

### `POST /api/logout` — phase 2

- Auth: session. Response `204`. Deletes the calling session row. The client clears `kumru:session`, `kumru:progress:<id>`, `kumru:tutor`, `kumru:rev:*` and `kumru:dirty`.

### `POST /api/recover` — phase 2

- Auth: none. Limits: `recover`, `anon`.
- Request `{ username, recovery, password, tz?, label? }`.
- Response `200 { token, user, recovery }` with a new recovery code.
- Errors: `invalid` (username or code wrong; one message), `rate_limited`.
- Rows: `users` 1 read + 1 write, `sessions` delete all + 1 insert, in one batch.
- Notes: every other session ends, because the old password may be in someone else's hands.

### `POST /api/password` — phase 2

- Auth: session. Request `{ current, next }`. Response `200 {}`.
- Errors: `invalid` (`field`: `current` wrong, or `next` too short).
- Rows: `users` 1 read + 1 write; `sessions` delete all but the caller's.

### `GET /api/me` — phase 2

- Auth: session.
- Response `200 { user: { id, username, role, plan, created, tz }, session: { id }, sessions: [ { id, label, created, refreshed } ] }`.
- Rows: `users` 1, `sessions` ≤ 20.
- Notes: called once at boot after the session token is found. `sessions` feeds "Signed-in devices" in Profile.

### `DELETE /api/sessions/:id` — phase 2

- Auth: session. Response `204`. Deletes that session if it belongs to the caller; deleting the current one is a logout. Unknown id: `404 not_found`.

### `POST /api/pair/start` — phase 2

- Auth: session.
- Response `200 { code, expires }`. `expires` is 5 minutes ahead.
- Rows: `pairings` delete the caller's previous row + 1 insert.
- Notes: the client renders `https://turk.shab.boo/pair/<code>` (the old `#pair=<code>` link still works) as a QR and shows the code as text. Only the HMAC of the code is stored.

### `POST /api/pair/claim` — phase 2

- Auth: none. Limits: `pair`, `anon`.
- Request `{ code, tz?, label? }`.
- Response `200 { token, user }`.
- Errors: `gone` (expired or used), `invalid` (shape), `rate_limited`.
- Rows: `pairings` 1 read + 1 delete, `sessions` +1, in one batch.
- Notes: one-shot. A second claim of the same code answers `gone`.

## 5. Documents

`:kind` is `progress` or `tutor`. Document shapes are in SPECS_SCHEMA.md §3.

### `GET /api/doc/:kind` — phase 2

- Auth: session. Query `since=<rev>` optional.
- Response `200 { rev, updated, body }`; with `since` equal to the stored `rev`: `304` with an empty body; no document yet: `200 { rev: 0, updated: 0, body: null }`.
- Rows: `docs` 1.
- Notes: boot calls it without `since`; the pull on focus (SPECS.md §9.4) calls it with `since` so an unchanged document costs no bytes.

### `PUT /api/doc/:kind` — phase 2

- Auth: session. Minimum interval 1 s.
- Request `{ baseRev, body, weak?, book? }`. `baseRev` is the `rev` the client last loaded or saved (0 when it has never seen a server document). `weak` is accepted only for `progress` and is stored as the caller's `weak` row in the same batch (phase 4; ignored before). `book` (the reader-book summary, SPECS_SCHEMA.md §3.7) is accepted only for `progress`, stored as the caller's `book` row the same way, but only while the caller shares book progress with some class (`share_book = 1`); otherwise, or when over 4 KB, not an object, or within a minute of the last copy, it is dropped silently and the save still succeeds. The page sends it only while sharing and when it changed (and on the first save after switching sharing on).
- Response `200 { rev, updated }`.
- Errors: `conflict` with `rev`, `updated`, `body` (the server's current document) when `baseRev ≠ stored rev`, including `baseRev: 0` against an existing row; `too_large`; `invalid` when `body` is not an object, its top-level keys are outside the allowed set, or `progress.v < 4`, or `progress.char` is not an acceptable character (`field: "char"`; SPECS_SCHEMA.md §3.1); `rate_limited`. The page drops a refused `char` once and saves again (`app/host/sync.ts`), so a bad character never stalls sync.
- Rows: `docs` 1 read + 1 write (+ `weak` 1 write, + `book` 1 write).
- Notes: the Worker does not merge. The client merges the `conflict` body with its own (`shared/progress.ts`, `shared/tutor.ts`), applies the result, and PUTs again with the returned `rev`. After three conflicts in a row it stops and keeps `kumru:dirty`. `updated` is the server clock; the client stores `rev` as `kumru:rev:<kind>`.

## 6. Profile and Friends

The public profile document is the page's `frBuildDoc` output (SPECS_SCHEMA.md §3.3). Friends routes are phase 3; `PUT /api/profile` ships in phase 2 so that a profile row (and friend code) exists before Friends does.

### `PUT /api/profile` — phase 2

- Auth: session. Minimum interval 1 s.
- Request `{ doc, week }`. `week` is the client's current ISO week key; the server reads `doc.xpWeek[week]` for the board.
- Response `200 { doc, code, updated }`. `doc` is what was stored, with the final `code`.
- Errors: `invalid` (`doc.v ≠ 1`, nick too long, lists too long), `too_large`, `rate_limited`. A `char` that `progress.char`'s rules refuse is not an error: the stored document has `char: null`.
- Rows: `profiles` 1 read + 1 upsert; `follows` inserts and deletes only for ids that changed since the stored document (≤ 100 ids per statement).
- Notes: the stored `code` is permanent. On the first save the server takes `doc.code` if it is well-formed and free, otherwise it generates one. The columns `nick` (lower-cased with Turkish folding, for search), `xp`, `week`, `xp_week`, `last_day` are copied from the document. `doc.following` is the only source of the `follows` table.

### `GET /api/friends` — phase 3

- Auth: session. Query `week=<ISO week key>`.
- Response `200 { week, me, following, followers, board, profiles, names }`:
  - `me`: my profile document or `null`;
  - `following`, `followers`: user ids (each at most 200, newest follows first);
  - `board`: up to 50 user ids ordered by `xp_week` for `week`, then `xp`, then id;
  - `profiles`: `{ [id]: profile document }` for every id above, with `char: null` for anyone who is not a mutual follow unless their `charPublic` is true (SPECS_SCHEMA.md §3.3);
  - `names`: `{ [id]: username }` for the same ids.
- Rows: `profiles` 1, `follows` ≤ 400, `profiles` ≤ 450 in `IN` chunks of 100, `users` ≤ 450. About 100–200 rows for a normal learner.
- Notes: the host module turns this into the `profiles` snapshot the page already consumes and resolves names without a second request. Called when Friends becomes visible, on focus, and every 2 minutes while visible; never in the background.

### `GET /api/profiles/search` — phase 3

- Auth: session. Limit `search`. Query `q`.
- Response `200 { self, code, ids, profiles, names }`, the shape of the page's `frSearch`: `self` is true when `q` is my own code; `code` is the id whose friend code equals `q`; `ids` are name matches.
- Rows: a 6-character code is 1 read on `profiles.code`; `@name` is one point read on `users.username` (exact, `ids` holds that id); a name of 3+ characters is one `LIKE` over `profiles.nick` and `users.username`, 20 rows; shorter input returns empty without a query.
- Notes: the host module merges `profiles` into the snapshot so the existing results UI, which only shows ids present in `S.profiles`, can render them. A result's `char` follows the same rule as in `GET /api/friends` (one more read of `follows` for the found ids).

### `GET /api/users` — phase 3

- Auth: session. Query `ids=a,b,c` (≤ 100).
- Response `200 { names: { [id]: username } }`. Unknown ids are left out.
- Rows: `users` ≤ 100.
- Notes: backs the Friends feature's name lookup (`app/features/friends/api.ts`) for ids the Friends payload did not already name.

## 7. Classes — phase 3

Class documents: `{ id, name, code, owner, created, members, share, joined, description, schedule, icon, color }` where `share` and `joined` describe the caller's membership. The header fields are the teacher's: `description` ≤ 280 characters, `schedule` ≤ 60 (when it meets, free text), `icon` one of `book bulb chat flame spark target listen note flash drill`, `color` one of `sage sand sky rose plum sun` (`shared/api.ts` `CLASS_ICONS`, `CLASS_COLORS`); defaults `''`, `''`, `book`, `sage`.

### `POST /api/classes`

- Auth: session. Limit `class-create`. Request `{ name, description?, schedule?, icon?, color? }`.
- Response `201 { class }` with the caller as owner and first member (`share: true` for the owner).
- Errors: `invalid` (name empty or over 40 characters, an icon or colour not in the lists, text over its limit; `field` names it), `taken` (the caller already owns a class with that name), `rate_limited`.
- Rows: `classes` +1, `class_members` +1.

### `GET /api/classes`

- Auth: session. Response `200 { classes: [class] }` for every class the caller belongs to, with member counts.
- Rows: `class_members` ≤ 20, `classes` ≤ 20, one `COUNT` per class.

### `POST /api/classes/join`

- Auth: session. Limit `class-join`. Request `{ code, share }`.
- Response `200 { class }`. Joining twice is a no-op with 200.
- Errors: `not_found` (code), `forbidden` (the class has 200 members), `rate_limited`.
- Rows: `classes` 1, `class_members` 1 upsert.

### `POST /api/classes/:id/leave`

- Auth: session, member. Response `204`. The owner cannot leave; they delete the class instead (`forbidden`).

### `PATCH /api/classes/:id/me`

- Auth: session, member. Request `{ share?, shareBook? }`, at least one. Response `200 { class }`. `share` toggles the teacher-view opt-in (place, streak, hardest words); `shareBook` separately toggles sharing book progress from Notebook (units done, pages read, exercise scores; never answers or writing). `shareBook` starts false on every join. Turning the last `shareBook` off (or leaving, or being removed from, the last class that had it on) deletes the caller's `book` row.

### `PATCH /api/classes/:id`

- Auth: session, class owner. Request: any of `{ name, description, schedule, icon, color }`; absent fields stay. Response `200 { class }`. Errors: as create, and `taken` when the new name is another class of the owner's.

### `DELETE /api/classes/:id`

- Auth: session, class owner. Response `204`. Deletes the class and its memberships (cascade).

### `DELETE /api/classes/:id/members/:uid`

- Auth: session, class owner. Response `204`. Removing yourself answers `forbidden`.

### `GET /api/classes/:id/board`

- Auth: session, member. Query `week`.
- Response `200 { week, board, profiles, names }` as in `/api/friends`, limited to members; members with no save this week rank with 0.
- Rows: `class_members ⋈ profiles` ≤ 200, ordered in SQL; 50 returned to a member, every member (≤ 200) to the class owner, who can open any learner's profile from it; `users` ≤ 200.

### `GET /api/classes/:id/members`

- Auth: session, class owner.
- Response `200 { members: [ { id, username, nick, joined, share, shareBook, pos?, streak?, lastDay?, weak?, book? } ] }`. `pos`, `streak`, `lastDay` (from the profile document) and `weak` (the 10 weakest cards from the member's `weak` row) are present only when `share` is true; `book` (the member's `book` row) only when `shareBook` is true.
- Rows: `class_members` ≤ 200, `users` ≤ 200, `profiles` and `weak` only for members who opted in, `book` joined in the same members query (`LEFT JOIN book … AND share_book = 1`), so book sharing adds no extra query.

## 8. Account — phase 2

### `GET /api/export`

- Auth: session.
- Response `200`, `Content-Type: application/json`, `Content-Disposition: attachment; filename="kumru-<username>-<YYYY-MM-DD>.json"`. Shape in SPECS_SCHEMA.md §3.5.
- Rows: `users` 1, `docs` 3, `profiles` 1, `follows` ≤ 400, `class_members` ≤ 20, `push_subs` count, `weak` 1, `book` 1, `yeni_tokens` ≤ 10.

### `POST /api/delete`

- Auth: session. Request `{ password }`. Response `204`.
- Errors: `invalid` (password).
- Rows: `users` 1 write (`deleted = now`), `sessions` delete all.
- Notes: the account is unreachable at once and purged by the sweep after 7 days (§12.3). A login within those days restores it. Classes the learner owns are deleted at purge time; the delete dialog says so when the caller owns one.

## 9. Push — phase 4

### `GET /api/push/key`

- Auth: none. Response `200 { key }`, the VAPID public key (`VAPID_PUBLIC` var). Cacheable by the client for the session.

### `POST /api/push`

- Auth: session. Request `{ endpoint, keys: { p256dh, auth }, tz, hour }` (`hour` 0–23 in `tz`).
- Response `200 { id }`. Upserts by `endpoint`, so re-subscribing after a browser rotates the subscription replaces the row.
- Errors: `invalid`.
- Rows: `push_subs` 1 upsert. At most 5 subscriptions per user; a sixth replaces the oldest.

### `DELETE /api/push/:id`

- Auth: session. Response `204`. Unknown or not mine: `404 not_found`.

## 10. Owner — phase 4

All routes: auth session with `role = owner`, else `403 forbidden`.

### `GET /api/admin/stats`

- Response `200 { users: { total, deleted, signups7d, signups30d }, active: { d7, d30 }, docs: { rows, bytes }, profiles: { rows }, classes: { rows, members }, push: { rows }, limits: { rows, hits24h }, backup: { date, bytes, rows, finished } | null, version, time }`.
- Rows: one `COUNT`/`SUM` per table, `limits` ≤ 200, the latest backup manifest from R2.
- Notes: `active` counts `profiles.updated` within the window. Request and D1 usage are not here; the dashboard links to Cloudflare's own graphs.

### `GET /api/admin/weak`

- Query `limit` (default 50, max 200).
- Response `200 { cards: [ { id, learners, tries, wrong } ], lessons: [ { id, learners, tries, misses } ] }`, each list ordered by `learners` then `wrong` or `misses`.
- Rows: `weak` all rows (one per learner who has saved a summary), aggregated with `json_each`. Hundreds of small rows, well inside the daily read limit.

### `GET /api/admin/users`

- Query `q` (username prefix, 2+ characters; empty lists everyone), `limit` (default 50, max 100).
- Response `200 { users: [ { id, username, role, plan, tz, created, deleted, lastSave, code, nick, char, xp, xpWeek, week, streak, lastDay, lv, unit, progressBytes, saves, devices, classes, followers, following, reminders } ] }`, most recently active first (`profiles.updated`, else `users.created`).
- Rows: `users` ≤ limit, with indexed per-row counts (`sessions`, `class_members`, `follows` both ways, `push_subs`) and the size and revision of the progress document; no body is parsed beyond the profile's `nick`, `streak` and `pos`.
- Notes: this is the Owner tab's Learners table.

### `POST /api/admin/users/:id/undelete`

- Response `200 { user }`. Clears `users.deleted` before the purge. After the purge: `404 not_found`.

### `GET /api/admin/backups`

- Response `200 { backups: [ { date, bytes, rows, tables, started, finished } ] }` from the manifests under `backups/` in R2, newest first, 60 at most.

### `POST /api/admin/backup`

- Response `200 { date, bytes, rows }`. Runs the same code path as the nightly backup (§12.1) now. Used to verify the backup after a deploy.

## 11. Hooks and health

### `POST /api/ai` — phase 4

- Auth: session. Any body.
- Response: `402 payment_required` when `users.plan = 'free'`; `501 not_implemented` otherwise.
- Notes: reserved for the later paid tier. The page keeps `AI.state = "off"` and never calls it in these phases.

### `GET /api/health` — phase 1 (static answer) / phase 2 (with D1)

- Auth: none. Not rate limited beyond `anon`.
- Response `200 { ok: true, version, time, db: true }`. `db` is the result of `SELECT 1`; a D1 failure answers `503 quota_exceeded` or `500 internal` with `ok: false`.
- Notes: CI's smoke test and the dashboard call it. Learners never do.

### `POST /api/dev/login` — dev only

- Exists only when the `DEV` var is `"1"`, which `wrangler dev` sets and production never does; otherwise `404 not_found`.
- Request `{ username }` from the seed set (SPECS.md §11.4). Response `200 { token, user }`.
- Notes: backs the `?as=<username>` switch so an agent can open any seeded account in the browser pane.

## 11a. Notebook — notebook sync

The reader at `yeni.shab.boo` (`apps/reader/`) is a static site with no server of its own. A learner with a Kumru account can sync its notebook (apps/reader/docs/NOTEBOOK.md, phase 4) through this Worker. The notebook is one more private document, `docs.kind = 'yeni'` (SPECS_SCHEMA.md §2.3, §3.6), stored like progress: owner-checked, size-capped, with revisions; the Worker never parses or merges it. The reader never sees Kumru's session: it gets its own revocable token through a redirect and a code exchange shaped like OAuth 2.0's authorization code with PKCE. [AUTH.md](AUTH.md) has the sequence diagram and the threat model.

**`YENI_ORIGINS`** is a Worker var, a comma-separated list of the reader's origins: `https://yeni.shab.boo` in production (`wrangler.jsonc`), plus `http://localhost:4330` in dev (`.dev.vars`).

**The connect page** is a screen of the page app, `/connect/yeni?return=<url>&state=<state>&code_challenge=<challenge>&code_challenge_method=S256` (`app/features/yeni/ConnectSheet.tsx`). The reader makes `state` and a `verifier` (each 32 random bytes, base64url), keeps both in its own storage, and sends `challenge = base64url(SHA-256(verifier))`.

1. Signed out, the sign-in gate shows with a Notebook banner and a way back to the reader; it keeps the URL, so signing in comes back here.
2. The page asks `GET /api/yeni/origins` and checks the parameters: `return` an `http(s)` URL on a listed origin, `state` 16–128 base64url characters, `code_challenge` 43, method `S256`. Anything else shows an error and never redirects.
3. Otherwise a consent sheet asks *Defter, notlarını bu hesapla eşitlesin mi?* (with the English line), names the account, and lists what the reader can and cannot reach. **Allow** calls `POST /api/yeni/codes` and goes to `<return>#yk_code=<code>&state=<state>`; **Cancel**, or closing the sheet any way, goes to `<return>#yk_error=denied&state=<state>`. Any fragment already on `return` is dropped.
4. The reader checks that `state` is the one it stored (else it shows "that link expired" and calls nothing), then trades the code: `POST /api/yeni/token { code, verifier, return, label }` answers the token. The token never appears in a URL; a leaked code is useless without the verifier, which never left the reader.

The sheet takes the address bar back to the tab at once, so a reload never re-asks with a stale link.

### `GET /api/yeni/origins`

- Auth: none (the gate needs it before sign-in). Response `200 { origins: string[] }`, the parsed `YENI_ORIGINS`. Same-origin only; no CORS.

### `POST /api/yeni/codes`

- Auth: session. Limit `yeni-token`. Request `{ return, challenge }`.
- Response `200 { code }`. `code` is 43 characters, base64url of 32 random bytes; only HMAC-SHA-256(`PEPPER`, code) is stored, with the user, the challenge, the exact `return` and `expires` 5 minutes ahead.
- Errors: `invalid` (`field: "return"` when `return` is not an `http(s)` URL on an origin in `YENI_ORIGINS`; `field: "challenge"` when it is not 43 base64url characters); `unauthorized`; `rate_limited`.
- Rows: `limits` 1 upsert, `yeni_codes` +1.

### `POST /api/yeni/token`

- Auth: none; called cross-origin by the reader (CORS below). Limits: `yeni-code`, `anon`.
- Request `{ code, verifier, return, label? }`. `verifier` is 43–128 characters of `[A-Za-z0-9._~-]`; `label` is the device description the reader derives from the user agent, at most 40 characters.
- Response `200 { token, username }`. `token` is 43 characters, base64url of 32 random bytes; only its SHA-256 is stored.
- Shape errors (`invalid`) leave the code alone. Otherwise the code is consumed (`DELETE … RETURNING`), so it works once even when the rest fails; then `base64url(SHA-256(verifier))` must equal the stored challenge, `return` must equal the stored one exactly, and the account must not be deleted.
- Errors (flat, §1.4): `400 invalid` (shape), `400 invalid_grant` (unknown, used or expired code, wrong verifier, other `return`), `429 rate_limited`.
- Rows: `limits` 2 upserts, `yeni_codes` 1 delete, `users` 1 read, `yeni_tokens` +1 and a delete of the caller's tokens beyond the newest 10, in one batch.

### `GET /api/yeni/tokens`

- Auth: session. Response `200 [ { id, label, created_at, last_used_at } ]`, newest first (at most 10). Backs the Account card's *Notebook → Connections*.

### `GET /api/yeni/notebook`

- Auth: session. No limit counter (no write). Query `since=<rev>` optional.
- Response `200 { rev, doc }`, the caller's own `yeni` document as the reader last saved it (the body is passed through unparsed); with `since` equal to the stored `rev`: `304` and an empty body; no notebook yet: `{ rev: 0, doc: null }`.
- Rows: `sessions` 1, `docs` 1.
- Notes: read-only; only the reader writes the notebook (`PUT /api/yeni/doc`). The page (`app/features/yeni/book.ts`) reads it to show *In the book: …* on the Path, offer a unit's checkpoint when the book unit is done, fill the Profile banner and compute the `book` summary. It asks only when the account has a reader connection, when Path or Profile becomes visible, at most once every 10 minutes. The reader never sees Kumru data (the flow is one-way).

### `DELETE /api/yeni/tokens/:id`

- Auth: session. Response `204`. Revokes that reader token if it is the caller's; otherwise `404 not_found`. The Account card asks first (`confirmSheet`).

### Bearer routes

`/api/yeni/doc`, `DELETE /api/yeni/token` and `GET /api/yeni/check` take `Authorization: Bearer <reader token>`. A missing, unknown or revoked token, or one whose account is deleted, answers `401 { "error": "unauthorized" }` and counts against `anon` for the IP. A valid token bumps `last_used_at` at most once a day. Errors are flat (§1.4).

**CORS**, on `/api/yeni/doc` and `/api/yeni/token` only (not `/api/yeni/check`): when the request's `Origin` is in `YENI_ORIGINS`, every response (errors too) carries `Access-Control-Allow-Origin: <that origin>`, `Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS`, `Access-Control-Allow-Headers: Authorization, Content-Type`, `Access-Control-Expose-Headers: Retry-After, X-Request-Id` and `Access-Control-Max-Age: 86400`; any other origin gets none of them. `Vary: Origin` is always sent. No credentials: the token is a header, never a cookie. `OPTIONS` (the preflight) answers `204` with the same headers and touches nothing else.

### `GET /api/yeni/doc`

- Auth: reader token. Limit `yeni`.
- Response `200 { rev, doc }`; no document yet: `{ rev: 0, doc: null }`.
- Rows: `yeni_tokens` 1 (+1 write a day), `limits` 1 upsert, `docs` 1.

### `PUT /api/yeni/doc`

- Auth: reader token. Limit `yeni`; minimum interval 1 s.
- Request `{ baseRev, doc }`. Response `200 { rev }`.
- Errors: `409 { error: "conflict", rev, doc }` with the server's current copy when `baseRev ≠ rev` (including `baseRev: 0` against an existing document); `413 too_large` when `JSON.stringify(doc)` is over 512 KiB (or the raw body over 516 KiB); `400 invalid` when `doc` is not a JSON object or `baseRev` is not a revision; `429 rate_limited` with `retryAfter`.
- Rows: `yeni_tokens` 1, `limits` 1 upsert, `docs` 1 read + 1 write.
- Notes: the reader merges the 409 copy with its own (per entry by the newest `at`, `apps/reader/src/lib/notebook/merge.ts`) and PUTs again with the returned `rev`. It pushes on change (debounced about 10 s) and on `pagehide`, and pulls on sign-in and when the tab becomes visible; nothing polls.

### `GET /api/yeni/check`

- Auth: reader token. Limit `yeni-check`. **No CORS**: it is called server to server, by the course repo's exam-room Worker (`yeni-sinav`, same Cloudflare account) through a service binding, never by a browser. That Worker gives AI essay feedback only to learners whose reader token checks out, and keeps the answer, never the token.
- Response `200 { uid }`. `uid` is the first 22 characters of base64url(HMAC-SHA-256(`PEPPER`, `"sinav:" + user id`)): stable for a learner across their reader tokens, different between learners, and naming no account. No username, no data.
- Errors (flat, §1.4): `401 unauthorized` (missing, unknown or revoked token, a session token, a deleted account; counts against `anon` for the IP like the other bearer routes), `429 rate_limited`.
- Rows: `yeni_tokens` 1 (+1 write a day), `limits` 1 upsert.

### `DELETE /api/yeni/token`

- Auth: reader token. Response `204`. Revokes the presented token: the reader's *disconnect*. The document stays in the account.

**Other effects.** A password change or a recovery revokes every reader token and unused code (like other sessions); `POST /api/delete` revokes them at once and the purge deletes the document. The daily sweep (§12.3) deletes expired codes. `GET /api/export` carries the document under `docs.yeni` and the connections as `yeniTokens`.

## 12. Scheduled handlers

The Worker's `scheduled` handler runs hourly (`0 * * * *`) and dispatches on the UTC hour. Each job is idempotent: a tick that runs twice does no harm.

### 12.1 Backup — 03:00 UTC, phase 4 (enabled before phase 2 is opened to real learners)

- Reads every table in pages of 1,000 rows ordered by primary key and writes `backups/<YYYY-MM-DD>/<table>.jsonl` to R2, one JSON object per line, then `backups/<date>/manifest.json` (SPECS_SCHEMA.md §5).
- Rows: the whole database once a day. R2 operations: one `put` per table plus the manifest.
- A failure leaves no manifest; the dashboard shows the last complete backup and turns the row red after 36 hours.

### 12.2 Reminders — every hour, phase 4

- Selects `push_subs` whose `hour` equals the current hour in their `tz`, joins `profiles.last_day`, and sends one push to each learner whose `last_day` is before today in that zone.
- Payload: `{ title: "Kerim is waiting", body: "<streak> day streak — one lesson keeps it.", url: "/" }`, encrypted per RFC 8291 with the `VAPID_*` keys.
- A push service answer of 404 or 410 deletes the subscription.
- Rows: `push_subs` by the `hour` index, `profiles` one per candidate. Sends: one fetch per candidate; a few dozen an hour at most.

### 12.3 Sweep — 04:00 UTC, phase 2

- Deletes `sessions` past `expires`, `pairings` and `yeni_codes` past `expires`, `limits` rows whose window ended, `book` rows of learners no longer sharing book progress with any class, and every row of `users` whose `deleted` is older than 7 days (foreign keys cascade the rest).
- Rows: a handful of deletes a day.

## 13. Page → endpoint map

Where today's page code ends up calling. Only `app/core/startup.ts`, the features' boot handlers and the host module know the paths; the rest of the page keeps calling `S.db` and `S.user`.

| Page code | Today | On Cloudflare |
|---|---|---|
| boot: `user.id()`, `user.me()`, `user.canEdit()`, `user.can()` | artifact `user` | `GET /api/me` once, cached in the host module |
| boot: `db.doc("data/users/<me>/progress").get()` | artifact db | `GET /api/doc/progress` |
| `saveProgress` → `db.doc(…progress).set()` (`app/features/progress/api.ts`) | set | `PUT /api/doc/progress` with `baseRev` (+ `weak`) |
| `loadTutorDoc`, `saveTutorDoc` ([app/features/tutor/doc.ts](../app/features/tutor/doc.ts)) | get/set | `GET`/`PUT /api/doc/tutor` |
| `startFriends` → `db.collection("profiles").onSnapshot` | live collection | `GET /api/friends` on visibility, focus, 2-minute timer |
| `frFlush` → `db.doc("profiles/<me>").set(doc)` | set | `PUT /api/profile` |
| `frResolve` → the Friends feature's `api.ts` | artifact `user` | names from the Friends payload, else `GET /api/users` |
| Friends search → the Friends feature's `api.ts` | artifact `user` | `GET /api/profiles/search` |
| `db.collection("cards" \| "grammar" \| "path")` | live collections | `GET /data/manifest.json`, then the hashed file |
| `db.collection("contrib" \| "votes")` | live collections | empty snapshot, no request |
| `use("sample")` | artifact AI | `host.ai = null`; no request |
| new: Account card | — | §4, §8 |
| new: Classes section | — | §7 |
| new: Remind me | — | §9 |
| new: Owner tab | — | §10 |
| new: `/connect/yeni`, Account card *Notebook* (`app/features/yeni/api.ts`) | — | §11a (session routes) |
| the reader (`apps/reader/`, not this page) | — | §11a (bearer routes) |

## 14. `shared/api.ts`

The types the Worker and the client both import. Kept in this shape; fields are documented above.

```ts
export type ErrorCode =
  | "invalid" | "unauthorized" | "forbidden" | "not_found" | "taken" | "conflict" | "gone"
  | "too_large" | "upgrade_required" | "rate_limited" | "payment_required" | "not_implemented"
  | "quota_exceeded" | "internal"
  | "offline" | "aborted";                       // client-only

export interface ApiError { error: { code: ErrorCode; message: string; field?: string; retryAfter?: number;
  rev?: number; updated?: number; body?: unknown; requestId?: string } }

export type Role = "learner" | "owner";
export type Plan = "free";                        // later tiers extend this union
export interface User { id: string; username: string; role: Role; plan: Plan; created?: number; tz?: string }
export interface Session { id: string; label: string; created: number; refreshed: number }

export type DocKind = "progress" | "tutor";       // `docs.kind` also holds "yeni", reached only through /api/yeni/doc
export interface DocGet { rev: number; updated: number; body: unknown | null }
export interface DocPut { baseRev: number; body: unknown; weak?: WeakDoc }
export interface DocPutOk { rev: number; updated: number }

export interface Signup { username: string; password: string; turnstile?: string; tz?: string; label?: string }
export interface SignupOk { token: string; user: User; recovery: string }
export interface Login { username: string; password: string; tz?: string; label?: string }
export interface LoginOk { token: string; user: User; restored?: boolean }
export interface Recover { username: string; recovery: string; password: string; tz?: string; label?: string }
export interface Password { current: string; next: string }
export interface Me { user: User; session: { id: string }; sessions: Session[] }
export interface PairStartOk { code: string; expires: number }
export interface PairClaim { code: string; tz?: string; label?: string }

export interface ProfilePut { doc: ProfileDoc; week: string }
export interface ProfilePutOk { doc: ProfileDoc; code: string; updated: number }
export interface Friends { week: string; me: ProfileDoc | null; following: string[]; followers: string[];
  board: string[]; profiles: Record<string, ProfileDoc>; names: Record<string, string> }
export interface Search { self: boolean; code: string | null; ids: string[];
  profiles: Record<string, ProfileDoc>; names: Record<string, string> }
export interface Names { names: Record<string, string> }

export interface Class { id: string; name: string; code: string; owner: string; created: number;
  members: number; share: boolean; joined: number }
export interface ClassJoin { code: string; share: boolean }
export interface ClassBoard { week: string; board: string[]; profiles: Record<string, ProfileDoc>; names: Record<string, string> }
export interface ClassMember { id: string; username: string; nick: string; joined: number; share: boolean;
  pos?: { lv: string; u: number }; streak?: number; lastDay?: string; weak?: WeakCard[] }

export interface PushSub { endpoint: string; keys: { p256dh: string; auth: string }; tz: string; hour: number }

export interface AdminStats { users: { total: number; deleted: number; signups7d: number; signups30d: number };
  active: { d7: number; d30: number }; docs: { rows: number; bytes: number }; profiles: { rows: number };
  classes: { rows: number; members: number }; push: { rows: number }; limits: { rows: number; hits24h: number };
  backup: { date: string; bytes: number; rows: number; finished: number } | null; version: string; time: number }
export interface AdminWeak { cards: { id: string; learners: number; tries: number; wrong: number }[];
  lessons: { id: string; learners: number; tries: number; misses: number }[] }

export interface Health { ok: boolean; version: string; time: number; db?: boolean }

// Notebook (SPECS_API.md §11a). Session routes for the connect page and the Account card:
export interface YeniOrigins { origins: string[] }
export interface YeniTokenNew { return: string }
export interface YeniTokenNewOk { token: string; username: string }
export interface YeniTokenInfo { id: string; created_at: number; last_used_at: number }
export type YeniTokenList = YeniTokenInfo[];
// Bearer routes called cross-origin by the reader; their errors are flat, `{ error: code }` (not ApiError):
export type YeniErrorCode = "invalid" | "unauthorized" | "too_large" | "rate_limited" | "conflict" | "quota_exceeded" | "internal" | "not_found";
export interface YeniError { error: YeniErrorCode; retryAfter?: number; requestId?: string }
export interface YeniDocGet { rev: number; doc: Record<string, unknown> | null }
export interface YeniDocPut { baseRev: number; doc: Record<string, unknown> }
export interface YeniDocPutOk { rev: number }
export interface YeniDocConflict { error: "conflict"; rev: number; doc: Record<string, unknown> | null }

// Document shapes (SPECS_SCHEMA.md §3)
export interface ProfileDoc { v: 1; nick: string; char: unknown | null; code: string; following: string[]; xp: number;
  xpWeek: Record<string, number>; streak: number; lastDay: string; pos: { lv: string; u: number } | null;
  unitsDone: { ref: string; at: number }[]; storiesDone: number;
  cheers: Record<string, { kind: "great" | "go"; at: number }>; updatedAt: number }
export interface WeakCard { id: string; tries: number; wrong: number }
export interface WeakDoc { v: 1; at: number; cards: WeakCard[]; lessons: { id: string; tries: number; misses: number }[] }
```
