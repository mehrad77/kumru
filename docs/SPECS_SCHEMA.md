# Kumru data

Every place Kumru keeps data once it runs on Cloudflare: the D1 database, the JSON documents stored in it, the static content files, the R2 backup bucket and the keys on the learner's device. Companion of [SPECS.md](SPECS.md) (the plan) and [SPECS_API.md](SPECS_API.md) (the routes). `worker/migrations/` implements §2, `shared/schema/` implements §3 and §4 (§4.1's stories, characters and places: `sahne/packages/sahne-story/schema/`), and a table, column or field that is not here does not ship.

## 1. Conventions

- **Engine.** D1 is SQLite. One database, `yakerim`, bound as `DB`. Foreign keys are enforced (D1's default), and every child table cascades from `users`, so purging an account is one `DELETE`.
- **Times** are `INTEGER` milliseconds since the epoch (`Date.now()`). Day keys are `TEXT` `YYYY-MM-DD` and week keys `TEXT` `YYYY-Www`, both in the learner's calendar as the client sends them.
- **Ids** are `TEXT`, random, never derived from user input (SPECS_API.md §1.2). Usernames are data, not keys.
- **JSON columns** are `TEXT` holding one document. The Worker validates size and top-level shape on write and otherwise treats the body as opaque; the page owns the meaning of the fields.
- **Limits that shape the schema** (D1): 100 bound parameters per statement, so `IN (…)` lists are chunked at 100; a row at most 2 MB; a statement at most 100 KB of SQL text (parameters are not counted). Free plan: 5 million rows read and 100,000 rows written a day, 5 GB stored.
- **Migrations** are files `worker/migrations/NNNN_<name>.sql`, applied by `wrangler d1 migrations apply`, append-only. A column is never altered in place; a new file adds a table or column. The listing in §2.12 is the order.

## 2. Tables

### 2.1 `users` — phase 2

```sql
CREATE TABLE users (
  id            TEXT PRIMARY KEY,                     -- 26-char base32 of 16 random bytes
  username      TEXT NOT NULL COLLATE NOCASE UNIQUE,  -- 3–24 of [a-z0-9_.], stored lower case
  pw_hash       BLOB NOT NULL,                        -- 32 bytes, PBKDF2-SHA-256(password + pepper, salt, pw_iter)
  pw_salt       BLOB NOT NULL,                        -- 16 random bytes
  pw_iter       INTEGER NOT NULL,                     -- iterations used for this hash; can rise on a later password change
  recovery_hash BLOB NOT NULL,                        -- 32 bytes, HMAC-SHA-256(pepper, recovery code)
  role          TEXT NOT NULL DEFAULT 'learner',      -- 'learner' | 'owner'; set by hand, never by a route
  plan          TEXT NOT NULL DEFAULT 'free',         -- 'free' now; the paid tier adds values
  tz            TEXT,                                 -- IANA zone from the last sign-in, e.g. 'Europe/Istanbul'
  created       INTEGER NOT NULL,
  deleted       INTEGER                               -- set by POST /api/delete; purged by the sweep after 7 days
);
```

Written by: signup, login (`tz`, soft-delete restore), recover, password, delete, admin undelete. One row per account; a few hundred rows.

### 2.2 `sessions` — phase 2

```sql
CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,                        -- 16 chars, shown in "Signed-in devices"
  token_hash BLOB NOT NULL UNIQUE,                    -- SHA-256 of the bearer token; the token itself is never stored
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT NOT NULL DEFAULT '',                -- device description from the client, e.g. 'iPhone · Safari'
  created    INTEGER NOT NULL,
  refreshed  INTEGER NOT NULL,                        -- last time expires was pushed forward (at most once a day)
  expires    INTEGER NOT NULL                         -- created + 90 days, sliding
);
CREATE INDEX sessions_user ON sessions(user_id);
```

One row per signed-in device. Read on every authenticated request (1 row by `token_hash`). The sweep deletes expired rows.

### 2.3 `docs` — phase 2

```sql
CREATE TABLE docs (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind    TEXT NOT NULL,                              -- 'progress' | 'tutor' | 'yeni'
  body    TEXT NOT NULL,                              -- JSON document (§3.1, §3.2, §3.6); progress ≤ 256 KB, tutor ≤ 64 KB, yeni ≤ 512 KiB
  rev     INTEGER NOT NULL DEFAULT 1,                 -- +1 on every stored PUT; the client's baseRev must match
  updated INTEGER NOT NULL,                           -- server clock; also the minimum-interval check
  PRIMARY KEY (user_id, kind)
);
```

The private documents. Three rows per learner at most: `progress` and `tutor` (SPECS_API.md §5) and `yeni`, Notebook, written only through `/api/yeni/doc` with a reader token (SPECS_API.md §11a). The Worker never parses `body` beyond those checks; the merge lives in the client (the page, or the reader for `yeni`).

### 2.4 `profiles` — phase 2 (read by Friends from phase 3)

```sql
CREATE TABLE profiles (
  user_id  TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  body     TEXT NOT NULL,                             -- the public profile document (§3.3), ≤ 16 KB
  code     TEXT NOT NULL UNIQUE,                      -- 6-char friend code, permanent
  nick     TEXT NOT NULL DEFAULT '',                  -- body.nick lower-cased with Turkish folding (ı→i, ş→s …), for LIKE search only
  xp       INTEGER NOT NULL DEFAULT 0,                -- body.xp
  week     TEXT NOT NULL DEFAULT '',                  -- the ISO week key the client sent with the save
  xp_week  INTEGER NOT NULL DEFAULT 0,                -- body.xpWeek[week]
  last_day TEXT NOT NULL DEFAULT '',                  -- body.lastDay (YYYY-MM-DD in the learner's calendar)
  updated  INTEGER NOT NULL
);
CREATE INDEX profiles_board ON profiles(week, xp_week DESC);
```

The columns exist so the weekly board is an index range (`WHERE week = ? ORDER BY xp_week DESC LIMIT 50`), the code search is a point read, "active learners" is a range on `updated`, and reminders can see whether a learner studied today without opening `body`. The display name shown to others is `body.nick`, not the folded column.

### 2.5 `follows` — phase 3

```sql
CREATE TABLE follows (
  follower TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  at       INTEGER NOT NULL,
  PRIMARY KEY (follower, followee)
);
CREATE INDEX follows_followee ON follows(followee);
```

Derived from `profiles.body.following` on every profile save: ids added get a row, ids removed lose theirs, unchanged lists write nothing. The page's model stays one-way following, friends being mutual follows; this table only makes "who follows me" an index lookup instead of a scan of every profile.

### 2.6 `pairings` — phase 2

```sql
CREATE TABLE pairings (
  code_hash BLOB PRIMARY KEY,                         -- HMAC-SHA-256(pepper, pairing code)
  user_id   TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,  -- one open code per learner
  expires   INTEGER NOT NULL                          -- start + 5 minutes
);
```

One-shot QR codes for adding a phone. A claim deletes the row in the same batch that creates the session.

### 2.7 `limits` — phase 2

```sql
CREATE TABLE limits (
  key          TEXT PRIMARY KEY,                      -- '<rule>:<subject>', e.g. 'login-ip:203.0.113.9'
  count        INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
```

Fixed-window counters for the rules in SPECS_API.md §1.7. They are in D1 because a Worker isolate's memory is neither shared nor durable. The sweep deletes rows whose window has ended.

### 2.8 `classes`, `class_members` — phase 3

```sql
CREATE TABLE classes (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,                              -- ≤ 40 characters
  code    TEXT NOT NULL UNIQUE,                       -- 6-char join code
  owner   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created INTEGER NOT NULL,
  description TEXT NOT NULL DEFAULT '',               -- ≤ 280 characters; added by 0006
  schedule    TEXT NOT NULL DEFAULT '',               -- ≤ 60 characters, e.g. 'Tuesdays 18:00'
  icon        TEXT NOT NULL DEFAULT 'book',           -- one of CLASS_ICONS (shared/api.ts)
  color       TEXT NOT NULL DEFAULT 'sage'            -- one of CLASS_COLORS
);
CREATE TABLE class_members (
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined   INTEGER NOT NULL,
  share    INTEGER NOT NULL DEFAULT 0,                -- 1 = this member opted in to the teacher view
  share_book INTEGER NOT NULL DEFAULT 0,              -- 1 = also shares book progress from the reader (0008; never on by default)
  PRIMARY KEY (class_id, user_id)
);
CREATE INDEX class_members_user ON class_members(user_id);
```

A class has at most 200 members. The owner is always a member with `share = 1`. Deleting the owner's account deletes the class (cascade); the delete dialog warns about it.

### 2.9 `push_subs` — phase 4

```sql
CREATE TABLE push_subs (
  id       TEXT PRIMARY KEY,
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,                      -- the push service URL; upsert key
  keys     TEXT NOT NULL,                             -- JSON {p256dh, auth}
  tz       TEXT NOT NULL,                             -- IANA zone of the device
  hour     INTEGER NOT NULL,                          -- 0–23 local hour chosen by the learner
  created  INTEGER NOT NULL
);
CREATE INDEX push_subs_hour ON push_subs(hour);
CREATE INDEX push_subs_user ON push_subs(user_id);
```

At most 5 rows per learner. The hourly reminder job selects by `hour`, converts "now" to each row's `tz`, and joins `profiles.last_day`.

### 2.10 `weak` — phase 4

```sql
CREATE TABLE weak (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  body    TEXT NOT NULL,                              -- the learner's hard-words summary (§3.4), ≤ 8 KB
  updated INTEGER NOT NULL
);
```

Written by the client at most once a minute, piggybacked on `PUT /api/doc/progress`. The owner's report aggregates these small rows with `json_each`; the Worker never opens a progress document for it.

### 2.10b `book` — reader book progress for classes

```sql
CREATE TABLE book (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  body    TEXT NOT NULL,                              -- the learner's book summary (§3.7), ≤ 4 KB
  updated INTEGER NOT NULL
);
```

Written like `weak`: piggybacked on `PUT /api/doc/progress`, at most once a minute, and only while the learner shares book progress with at least one class (`class_members.share_book`). The page computes it from the reader notebook; the Worker never opens the notebook for it. Read only by `GET /api/classes/:id/members`, for members with `share_book = 1`. Deleted when the learner stops sharing book progress with every class (switch off, leave, removed), and by the daily sweep when the last sharing class was deleted, so a row exists only while someone may see it.

### 2.10a `yeni_tokens` — reader sync

```sql
CREATE TABLE yeni_tokens (
  id           TEXT PRIMARY KEY,                       -- 16 chars, shown in the Account card's connections list
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   BLOB NOT NULL UNIQUE,                   -- SHA-256 of the reader's bearer token; the token itself is never stored
  label        TEXT,                                   -- device description the reader sends at exchange, ≤ 40 chars
  created_at   INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL                        -- bumped at most once a day per token
);
CREATE INDEX yeni_tokens_user ON yeni_tokens(user_id);

CREATE TABLE yeni_codes (
  code_hash  BLOB PRIMARY KEY,                         -- HMAC-SHA-256(PEPPER, code); the code itself is never stored
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge  TEXT NOT NULL,                            -- base64url(SHA-256(verifier)) from the reader (PKCE S256)
  return_url TEXT NOT NULL,                            -- the exact return URL; the exchange must name the same one
  expires    INTEGER NOT NULL                          -- 5 minutes after issue
);
CREATE INDEX yeni_codes_user ON yeni_codes(user_id);
```

One row per connected reader (a browser on `yeni.shab.boo` that a learner allowed on `/connect/yeni`, SPECS_API.md §11a). At most 10 per learner: issuing an eleventh deletes the oldest in the same batch. Read on every reader request (1 row by `token_hash`). Deleted by the reader's disconnect, the Account card's revoke, a password change, a recovery, `POST /api/delete`, and the purge (cascade). The column names are the reader contract's (`created_at`, `last_used_at`), not this file's usual `created`.

`yeni_codes` holds the one-time codes of the connect flow (SPECS_API.md §11a, [AUTH.md](AUTH.md)): one row per Allow, deleted by the exchange that uses it (`DELETE … RETURNING`, so a code works once), by the daily sweep once past `expires`, by a password change, a recovery, `POST /api/delete`, and the purge (cascade). A row lives a few seconds in normal use.

### 2.11 Row budget

What the hot paths cost against the free-plan daily limits (5,000,000 reads, 100,000 writes).

| Operation | Reads | Writes |
|---|---|---|
| any authenticated request | 1 (`sessions`) | 0, or 1 once a day per device (sliding expiry) |
| `PUT /api/doc/progress` | 1 | 1 (+1 `weak`, +1 `book`, each at most once a minute) |
| `GET /api/yeni/notebook` | 2 (session, doc); none on 304 beyond the session | 0 |
| `PUT /api/profile` | 1 | 1 (+ changed `follows` rows) |
| `GET /api/yeni/doc` | 3 (token, limit, doc) | 1 (`limits`), +1 a day (`last_used_at`) |
| `PUT /api/yeni/doc` | 3 | 2 (`limits`, `docs`) |
| `GET /api/friends` | ~100–200 | 0 |
| `GET /api/profiles/search` | 1 or ≤ 20 | 0 |
| login | 2–3 | 1–2 |
| signup | 1 | 2 |
| class board | ≤ 200 | 0 |
| nightly backup | every row | 0 |
| hourly reminders | `push_subs` by hour + 1 profile each | 0 (deletes dead subscriptions) |

A learner who studies for an hour saves perhaps 60 times: about 180 reads and 120 writes. One hundred such learners a day use about 2% of the write limit and under 1% of the read limit. A learner who also writes in the reader for an hour with sync on adds about 20 pulls and up to 60 pushes (one per 10 s of typing at most): about 240 reads and 140 writes, so a hundred of them add about 14% of the write limit.

### 2.12 Migrations

| File | Phase | Adds |
|---|---|---|
| `0001_init.sql` | 2 | `users`, `sessions`, `docs`, `profiles`, `follows`, `pairings`, `limits` and their indexes |
| `0002_classes.sql` | 3 | `classes`, `class_members` |
| `0003_push.sql` | 4 | `push_subs` |
| `0004_weak.sql` | 4 | `weak` |
| `0005_suggested_classes.sql` | 5 | classes `504` and `506` (codes `YK0504`, `YK0506`) owned by `admin`, if that user exists |
| `0006_class_style.sql` | 5 | `classes.description`, `schedule`, `icon`, `color` |
| `0007_yeni.sql` | reader sync | `yeni_tokens`, `yeni_codes` (the notebook itself is a `docs` row, kind `yeni`) |
| `0008_book.sql` | reader bridge | `class_members.share_book`, `book` |

`follows` ships in `0001` although Friends is phase 3, because `PUT /api/profile` maintains it from day one and the first Friends deploy then needs no backfill.

## 3. Documents

JSON bodies stored in D1. The page defines them; the schemas in `shared/schema/` make them checkable. Every document carries `v`.

### 3.1 Progress document (`docs.kind = 'progress'`), `v: 5`

Written by the page's `progressDoc()` (`app/features/progress/api.ts`) and read back by `applyProgress()`. Version 5 adds `confAt` and `at` for the merge (SPECS.md §9.2); `applyProgress` fills them from `stats[id].t` or 0 for older documents. Card ids refer to `cards`, lesson ids to `grammar`, node ids to the unit path, skill and section ids to `path`.

| Field | Type | Written by | Meaning |
|---|---|---|---|
| `v` | `5` | — | schema version (`4` and below are read, never written) |
| `conf` | `{ [cardId]: 1..15 }` | `bumpConf` | word confidence; absent means 0. Rules in `docs/PROGRESS.md` |
| `confAt` | `{ [cardId]: ms }` | `bumpConf` (new) | time of the last confidence change, including claims and "near" bumps |
| `box` | `{ [cardId]: 0..5 }` | legacy | pre-v4 levels, kept unread so an old client can still be understood |
| `gram` | `{ [lessonId]: 1 }` | lesson quiz, `toggleLearned` | lessons marked learned |
| `stats` | `{ [cardId]: { a?, g?, e?, r?, w?, v?, t?, l? } }` | `recordCard`, `recordSeen` | counts: `a` again (flashcard wrong), `g` good, `e` easy, `r` right, `w` wrong, `v` times shown; `t` time of the last answer; `l` last result (1 right, 0 wrong) |
| `drill` | `{ [key]: { r, w } }` | `recordDrill` | suffix drills; `key` is a drill id or `v:<verb group>` |
| `days` | `{ [day]: n }` | `bumpDay`, `addXp` | answers per active day; the streak's source |
| `ex` | `{ [kind]: { r, w } }` | `recordEx` | per exercise kind (`flash`, `choice`, `type`, `listen`, `write`, …) and, new in v5, `q:<lessonId>` for each lesson quiz, which feeds the hard-words report |
| `log` | `[{ d, min, q, acc, w, l, st }]` | session end | the last 30 sessions: day, minutes, questions, accuracy, new words, lessons, stories |
| `nick` | string ≤ 30 | onboarding, Profile | display name |
| `st` | `{ [storyId]: { done, stars, reads, at, picks, ch?, fu? } }` | stories | per story (`s1e01`…; the retired `s01`–`s16` stay and are ignored): `done` read to the end and the quiz answered; `stars` the best quiz (first-try answers, 1–3); `reads`; `at` the last reading; `picks` the `ok` choices of the last reading; `ch` the last reading's picks (choice or act id → option index or target, follow-ups `fu_*` too), from which flags and warmth are derived (docs/stories/STORIES_SCHEMA.md §9); `fu` the follow-up was read. Merged by the later `at`, `done` wins, `stars` and `reads` take the max |
| `prefs` | `{ lang: 'fa'\|'en'\|'both'\|'none', corr: 'end'\|…, tryIt: boolean, goal: n, yeniLinked?: boolean, bookDismiss?: { [unitRef]: ms }, charPublic?: boolean }` | `setPref`; `charPublic` by Profile → Privacy; `yeniLinked` by `app/features/yeni`, `bookDismiss` by the Path's book offer | defaults in `PREF_DEFAULTS` (`lang: 'none'` for a new learner). `lang`: the help language; stories show exactly it, and practice, placement and the tutor read `'none'` as English (`app/core/lang.ts`). `yeniLinked`: this account has a reader connection, so the page may read the notebook. `bookDismiss`: units whose book offer the learner dismissed. `charPublic`: show the character to everyone (profile `charPublic`) |
| `onb` | integer | onboarding | highest onboarding version completed (`ONB_V`, now 3) |
| `xp` | integer | `addXp` | total XP |
| `xpDays` | `{ [day]: n }` | `addXp` | XP per day; the weekly board sums it |
| `nd` | `{ [nodeId]: { at, stars?, n?, migrated? } }` | unit path | finished nodes: `<LV>_<u>_cp` checkpoints, `<LV>_<u>_w<k>` word batches |
| `tree` | `{ v: 1, sk: { [skillId]: { l, at, how } }, sec: { [sectionId]: { at, how } }, mig?: 1, tests?: [{ from, to, probes }] }` | skill tree | stars per skill, section placement, the migration flag and Jump-here tests |
| `cheerSeen` | ms | Friends | when the learner last read their cheers |
| `pos` | `{ lv: 'A1'\|'A2'\|'B1', u: 1..6 }` | placement, Jump here, checkpoints | place on the path |
| `char` | object or `null` | onboarding | the learner's character: a Sahne avatar document (`sahne/packages/sahne/DESIGN.md` §5.2: `v: 1`, a `sahne-kit` `kit`, at most 2048 bytes of JSON, no part reserved for the cast, no `custom`), or the legacy eight-slot shape (`skin hair hairC beard top wear acc shirt`, whole numbers; still accepted, drawn as the silhouette, never written again). The Worker refuses anything else with `invalid`, `field: "char"` (`shared/char.ts` `charProblem`; the cast-only ids are `shared/cast-parts.gen.ts`, written by `scripts/cast-parts.ts`) |
| `profile` | `{ hometown, job, hobby, why, bio, name? }` | onboarding | the learner's own description, used by stories |
| `placed` | `{ lv, u, self, probes, test, ai, learned, at, v: 1, jumps?: [{ from, to, target, probes, learned, at }] }` | placement, Jump here | the last placement audit |
| `at` | `{ nick?, char?, profile?, prefs?, pos?, placed? : ms }` | each setter (new) | when each of those fields was last set; the merge takes the later side |

Allowed top-level keys are exactly the rows above; the Worker rejects a body with any other key (`invalid`).

### 3.2 Tutor document (`docs.kind = 'tutor'`)

Written by `saveTutorDoc` ([app/features/tutor/doc.ts](../app/features/tutor/doc.ts)). Dormant without AI, but the page loads and saves it, and the later paid tier fills it again.

| Field | Type | Meaning |
|---|---|---|
| `mistakes` | `[{ orig, fixed, lesson, fa, en, src, at, n }]`, ≤ 60 | corrected sentences that feed practice; `n` counts the times it was answered right afterwards (removed at 2) |
| `tries` | `{ [lessonId]: { n, ok } }` | "Try it" attempts per lesson |
| `talk` | `{ [scenarioId]: { done, stars, last, turns, hints, tries, at } }` | conversation scenario results |

Merge: `mistakes` union by normalised `orig` keeping the later `at`; `tries` and `talk` per key max of counters, `done` wins, later `at`.

### 3.3 Profile document (`profiles.body`), `v: 1`

The page's `frBuildDoc` output ([app/features/friends](../app/features/friends)): the only thing other learners see.

| Field | Type | Meaning |
|---|---|---|
| `v` | `1` | |
| `nick` | string ≤ 30 | display name |
| `char` | object or `null` | the learner's character, as `progress.char`. A value `charProblem` refuses is stored as `null` (the save still succeeds). Other learners receive it only when they follow each other, on the class board, or when `charPublic` is true; otherwise the Worker sends `char: null` (`hideChars`, worker/features/friends/routes.ts) |
| `charPublic` | `true` or absent | the learner's Privacy switch *Show my character to everyone* (`progress.prefs.charPublic`) |
| `code` | 6 chars | friend code; the server's `profiles.code` wins if they differ |
| `following` | `string[]` ≤ 500 | ids I follow; source of `follows` |
| `xp` | integer | total |
| `xpWeek` | `{ [weekKey]: n }` | this week and last week |
| `streak` | integer | as computed by the page; `frLiveStreak` discounts it when `lastDay` is old |
| `lastDay` | day key or `''` | last active day |
| `pos` | `{ lv, u }` or `null` | |
| `unitsDone` | `[{ ref, at }]` ≤ 5 | newest finished checkpoints, `ref` like `A1_3` |
| `storiesDone` | integer | |
| `cheers` | `{ [toUserId]: { kind: 'great'\|'go', at } }` ≤ 200 | cheers I sent, kept 14 days by the page |
| `updatedAt` | ms | client clock; the server's `profiles.updated` is authoritative |

### 3.4 Weak summary (`weak.body`), `v: 1`

Computed by the client from `stats` and `ex` right before a progress save, at most once a minute.

```json
{ "v": 1, "at": 1791200000000,
  "cards":   [ { "id": "a1-w-ekmek", "tries": 7, "wrong": 5 } ],
  "lessons": [ { "id": "g_a1_2_var_yok", "tries": 4, "misses": 3 } ] }
```

`cards`: up to 50 cards with at least 3 tries, lowest accuracy first. `lessons`: up to 20 lessons from the `q:<lessonId>` keys of `ex`, most misses first. Nothing else from the progress document is copied.

### 3.7 Book summary (`book.body`), `v: 1`

Computed by the learner's own page (`app/features/yeni/book.ts`) from the reader notebook (§3.6, read through `GET /api/yeni/notebook`), sent with a progress save when it changed and the learner shares book progress with a class. ≤ 4 KB. Type `BookDoc` in `shared/api.ts`.

```json
{ "v": 1, "at": 1791200000000,
  "units": { "A1_3": { "d": 1, "p": 0.92, "s": [12, 9, 14] } },
  "last": { "ref": "A1_4", "at": 1791100000000 } }
```

Keys are Kumru unit refs. `d`: the learner marked every book of that unit done in the reader. `p`: share of the unit's printed pages read (both books). `s`: exercises tried, solved, and seen in the notebook. Never answers, writing or self-assessment text.

### 3.5 Export file (`GET /api/export`)

```json
{ "format": "kumru-export", "v": 1, "exported": 1791200000000,
  "user": { "id": "…", "username": "ada", "created": 0, "tz": "Europe/Istanbul", "role": "learner", "plan": "free" },
  "docs": { "progress": { "rev": 12, "updated": 0, "body": { } }, "tutor": { "rev": 1, "updated": 0, "body": { } }, "yeni": { "rev": 3, "updated": 0, "body": { } } },
  "profile": { "code": "AB2C3D", "updated": 0, "body": { } },
  "follows": { "following": [ "…" ], "followers": [ "…" ] },
  "classes": [ { "id": "…", "name": "…", "code": "…", "owner": false, "joined": 0, "share": false, "shareBook": false } ],
  "weak": { "updated": 0, "body": { } },
  "book": { "updated": 0, "body": { } },
  "push": 1,
  "yeniTokens": [ { "id": "…", "label": "Safari · iPhone", "created_at": 0, "last_used_at": 0 } ] }
```

`docs.yeni` is present once the reader has saved a notebook; `yeniTokens` lists the connected readers (never the tokens).

The Account card can also read this file back into a new account whose server progress is still empty (`docs.progress` only; the rest is informational).

### 3.6 Reader notebook (`docs.kind = 'yeni'`)

Notebook (apps/reader/docs/NOTEBOOK.md): the reader's export shape, defined and versioned by `apps/reader/src/lib/notebook/`. The Worker checks only that it is a JSON object of at most 512 KiB and never reads a field; the reader merges a 409 copy per entry by the newest `at`.

## 4. Static content

Course content never changes at runtime. It lives in `data/` (source) and ships as files under `public/data/` (generated by `vite build`, git-ignored).

### 4.1 Source files, `data/`

One document per file, pretty-printed with a trailing newline, named by its id (the generated files, cards and extras, with sorted keys). `cards`, `grammar` and `path` have their schema in `shared/schema/<collection>.json`, which `kumru_data.py --check` validates them against. `stories`, `characters` and `places` are the Sahne story data: their one schema source is `sahne/packages/sahne-story/schema/` (`story.json`, `character.json`, `place.json`, run with ajv by the story check, `node sahne/packages/sahne-story/stories.ts --check`, with the story rules of `docs/stories/STORIES_SCHEMA.md` §10), and `sahne/packages/sahne-story/paths.ts` names their folders for every reader. `pnpm check` runs both checks and `cast/extras.ts --check`, and `kumru_data.py --check` checks the cross-references listed below.

| Collection | Files | Id | Fields |
|---|---|---|---|
| `cards` | `cards/<id>.json`, about 3,140 after the freeze, plus `cards-extra/*.json` (268, the path's own sentence and starter cards) | `<level>-w-<slug>` for CSV words, `seed-*` for the artifact's early cards, `yk-s-<slug>` for path sentences; permanent | `tr en fa kind level topic pos ref core origin author at`, optional `detail ex exFa src accept retired`. `kind` is `word` or `sentence`; `ref` is `<LEVEL>_<app unit>`; `core` 1 for core words; `accept` lists other correct answers for a sentence card; `retired: true` marks a word the CSVs no longer list (the file stays, the build ships it, the page offers it to nobody new) |
| `grammar` | `grammar/<id>.json`, 86 | `g_<level>_<unit>_<slug>` | `title en fa level ref section sectionNo topic order blocks ex practice lite`, optional `tip`. Block and widget shapes: `docs/GRAMMAR_BRIEF.md` |
| `path` | `path/s01.json` … `s18.json` (+ `retired.json`) | `sNN` sections, `sk_<slug>` skills; permanent | `order level title en fa draft? skills[]`; each skill `id title en fa icon kind(words\|grammar\|mixed) lessons[] words[] sentences[]?`. `retired.json` lists skill ids that must never be reused |
| `stories` | `stories/<id>.json`, 48 (Season 1, A1; every one `draft: true` until the owner's review) | `s<season>e<NN>`, permanent | `id releaseDate kind level season arc ref title titleEn titleFa summary summaryFa place cast lessons words gl steps quiz`, optional `extras props looks followUp draft`. Shapes: `docs/stories/STORIES_SCHEMA.md` §3–§4 |
| `characters` | `characters/<id>.json`, 48: the cast roster (22, Kerim and Nima among them) and the generic extras (26, `kind: "extra"`, written by `sahne/packages/sahne-story/cast/extras.ts`, never by hand) | name slug, permanent | `id order name nameFa kind role roleFa bio bioFa color level`, optional `circle places catch friend terms puppet address avatar outfits motion voice album`. Shapes: `STORIES_SCHEMA.md` §5 |
| `places` | `places/<id>.json`, 41 | the site, or `<site>_<sub>`; permanent | `v id name size pieces marks`, optional `district site placeholder outdoor props times states perch camera life stops ambience motif surface`. Shapes: `STORIES_SCHEMA.md` §6 and `sahne/packages/sahne/DESIGN.md` §5.1. What the briefs ask of each place is `sahne/packages/sahne-story/places/needs.json`, not app data |

The old collections are retired: the 16 old stories (`s01`–`s16`), their 16 scenarios (`sc01`–`sc16`), the 4 journal prompts (`w1`–`w4`) and the 10 old characters (`ada can dede deniz ela marti mert selin simit zeynep`) are deleted, with their `shared/schema` files, and no new id reuses one (the story check refuses a retired character id). Old `st` entries in learners' progress stay and are ignored.

Cross-references checked by `kumru_data.py`: every `lessons[]` id in `path` and `stories` exists in `grammar`; every `words[]` and `sentences[]` id in `path`, and every `words[]` id in `stories`, exists in `cards` or `cards-extra`; every story's `cast[]` and `extras[]` id exists in `characters` and its `place` in `places`; every card `ref` and lesson `ref` names a real unit; no `path` skill id appears in `retired.json`. The story check holds everything else about the three story collections (every `who`, mark, prop, step place and spot lesson, the calendar, the known words).

The CSVs under `content/a1/`, `content/a2/`, `content/b1/` stay the source of the word cards' `tr en fa topic ref core`: `kumru_cards.py` updates those fields in `cards/` from the CSVs (as `artifact_cards.py` did against the artifact) and `--check` fails when they differ. Notes (`detail`, `ex`, `exFa`) are edited in the card files directly.

### 4.2 Built files, `public/data/`

- `manifest.json`:

  ```json
  { "v": 1, "version": "3f2a1c9d0b47",
    "files": { "cards": "data/cards.5d41402a.json", "grammar": "data/grammar.098f6bcd.json", "path": "…", "stories": "…", "characters": "…", "places": "…" },
    "counts": { "cards": 3405, "grammar": 86, "path": 18, "stories": 48, "characters": 48, "places": 41 },
    "sounds": "/sounds/1a2b3c4d/", "thumbs": "/thumbs/5e6f7a8b/" }
  ```

  `version` is the first 12 hex characters of a SHA-256 over every built file (so the same sources always give the same version), also written to `<meta name="kumru-version">` and sent as `X-Kumru-Client`.
- `<collection>.<hash>.json`: `{ "<id>": { "id": "<id>", …doc } }`, ids sorted, `hash` the first 8 hex characters of the file's SHA-256. The host module turns it into the `{ docs: [{ id, data() }] }` snapshot the page expects, and applies `orderBy` and `where` in the browser.
- `cards` in the built file is the union of `cards/` and `cards-extra/`. `path` leaves out sections with `draft: true`, and `stories` leaves out stories with `draft: true`, unless built with `--drafts` (or `dev`).
- `cards`, `grammar` and `path` load at boot; `stories`, `characters` and `places` when the Stories tab opens. All six are precached.
- `sounds`: the base URL of Sahne's recordings (`sahne/packages/sahne-kit/sounds/*.m4a`, copied to `sounds/<hash8>/`, cached for ever, fetched on first use and kept in the service worker's `kumru-lazy` cache).
- `thumbs`: the base URL of the stories' thumbnails, `<story id>.webp` (480×300, about 10 KB each), copied from `data/thumbs/` (written by `sahne/packages/sahne-gallery/thumbs.mjs`, which records what each is drawn from in `data/thumbs/thumbs.json`; `--check` is in `pnpm check`) to `thumbs/<hash8>/`, cached for ever, fetched on first use and kept in the `kumru-lazy` cache.
- A build is deterministic: the same sources give the same bytes and the same hashes.

## 5. R2 bucket `yakerim-backups`

```text
backups/
  2026-10-06/
    state.json             while a backup is running: per table { rows, bytes, parts, after (last rowid), done }
    manifest.json          when complete: { "date", "started", "finished", "schema",
                             "tables": { "users": { "rows": 212, "bytes": 51234, "parts": 1 }, … }, "rows", "bytes" }
    users.000.jsonl        one JSON object per row, columns as keys, BLOBs as { "$b64": "…" }
    sessions.000.jsonl
    docs.000.jsonl  docs.001.jsonl  …
    …                      every table in sqlite_master, so later migrations are covered
```

- The free plan gives a cron run 10 ms of CPU, so the backup is resumable: from the 03:00 UTC tick on, each hourly tick copies a bounded number of rows in rowid order (a `docs` row counts 20, its body is large), writes them as the next part and saves `state.json`. The tick that finishes the last table writes `manifest.json` and deletes `state.json`. `POST /api/admin/backup` runs one tick on demand.
- A folder without `manifest.json` is incomplete and ignored by the dashboard.
- A lifecycle rule on the bucket deletes objects older than 30 days.
- `pnpm restore -- 2026-10-06` loads a folder into the local D1 (truncate, then insert in foreign-key order). Restoring production is a documented manual step in `AGENTS.md`, never a route.
- `schema` is the number of applied migrations; a restore refuses a folder from a newer schema.

## 6. Device storage (`localStorage`)

All keys start with `kumru:`. Every read and write is wrapped in `try/catch`; the page works with none of them.

| Key | Holds | Cleared by |
|---|---|---|
| `kumru:session` | the session token | sign-out, `401` |
| `kumru:progress:<userId>` | the last saved progress document for that account | sign-out |
| `kumru:progress:anon` | progress made before signing in; uploaded on the first sign-in when the server has none | that upload |
| `kumru:tutor` | the tutor document while signed out | sign-in |
| `kumru:me` | the signed-in user (`{id, username, role, plan}`), so an offline boot keeps the identity | sign-out, `401` |
| `kumru:rev:progress`, `kumru:rev:tutor` | the server `rev` last loaded or saved | sign-out |
| `kumru:pending:progress`, `kumru:pending:tutor` | a document waiting to be saved (offline, 5xx, a conflict past 3 tries) | a successful save, sign-out |
| `kumru:dirty` | `1` while a save is pending or failed | a successful save |
| `kumru:portrait` | `{c, svg}`: the learner's own `char` as JSON and its head portrait (≤ 10 KB), so the app bar draws it before the portraits' bundle loads (`app/ui/avatar/portrait.ts`) | a different `char`; sign-out |
| `kumru:stories` | `1` or `0`: the stories preview before launch (`?stories`) | `?stories=0` |
| `kumru:story:aloud`, `kumru:story:view2`, `kumru:story:nomic` | the reader's settings: say it aloud, bubbles on stage (`auto`/`log`/`theatre`), and `1` after speech recognition failed here for good (`unsupported`, `network`). The first version's `story:translate` and `story:view` are no longer read | never |
| `kumru:yeni:rev`, `kumru:yeni:doc`, `kumru:yeni:uid` | the learner's reader notebook as last read through `GET /api/yeni/notebook`, its rev and owner | sign-out, another account signing in |
| `kumru:yeniChk:<userId>` | when the page last asked for the notebook (at most every 10 minutes when linked, daily otherwise) | — |
| `kumru:pending-follow`, `kumru:pending-class`, `kumru:pending-profile` | a code from `/f/:code` or `/c/:code`, or a username from `/@name`, waiting for sign-in | the follow, join or profile sheet |
| `kumru:mlang`, `kumru:lab`, `kumru:tree` | UI state the page already keeps through its `store` helper | `?fresh` |
| `kumru:vapid` | the push public key | — |

The service worker's caches are named `kumru-<version>`; an activated new version deletes the others. `?fresh` clears every key above and every cache.

## 7. Deletion and retention

| Data | Kept | Removed by |
|---|---|---|
| sessions | 90 days sliding | sweep, sign-out, device revoke, password change, recovery |
| pairings | 5 minutes | claim, sweep |
| limits | the window (≤ 24 h) | sweep |
| soft-deleted accounts | 7 days | sweep: `DELETE FROM users WHERE deleted < now − 7d`, cascading to every table in §2 |
| backups | 30 days | R2 lifecycle rule |
| push subscriptions | until unsubscribed or the push service returns 404/410 | the learner, the reminder job, account purge |
| reader connect codes (`yeni_codes`) | 5 minutes, or until used | the exchange, the daily sweep, password change, recovery, `POST /api/delete`, account purge |
| reader tokens (`yeni_tokens`) | until revoked; at most 10 per learner | the reader's disconnect, the Account card, an eleventh connection (the oldest), password change, recovery, `POST /api/delete`, account purge |
| everything else | while the account exists | account purge |

The cascade order on purge is implicit in the foreign keys: `sessions`, `docs` (the reader notebook too), `yeni_tokens`, `yeni_codes`, `profiles`, `follows` (both directions), `pairings`, `class_members`, `classes` the user owned (and through them other members' `class_members` rows), `push_subs`, `weak`, `book`. Nothing of a purged learner remains except their lines inside backups still within the 30 days, and their id inside other learners' `following` and `cheers` lists, which the page already ignores for ids it cannot resolve.
