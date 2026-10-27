-- 0001_init (SPECS_SCHEMA.md section 2.12): users, sessions, docs, profiles, follows, pairings, limits.
-- Append-only: never edit this file once applied; add a new migration instead.

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

CREATE TABLE docs (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind    TEXT NOT NULL,                              -- 'progress' | 'tutor'
  body    TEXT NOT NULL,                              -- JSON document (§3.1, §3.2); progress ≤ 256 KB, tutor ≤ 64 KB
  rev     INTEGER NOT NULL DEFAULT 1,                 -- +1 on every stored PUT; the client's baseRev must match
  updated INTEGER NOT NULL,                           -- server clock; also the minimum-interval check
  PRIMARY KEY (user_id, kind)
);

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

CREATE TABLE follows (
  follower TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  at       INTEGER NOT NULL,
  PRIMARY KEY (follower, followee)
);
CREATE INDEX follows_followee ON follows(followee);

CREATE TABLE pairings (
  code_hash BLOB PRIMARY KEY,                         -- HMAC-SHA-256(pepper, pairing code)
  user_id   TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,  -- one open code per learner
  expires   INTEGER NOT NULL                          -- start + 5 minutes
);

CREATE TABLE limits (
  key          TEXT PRIMARY KEY,                      -- '<rule>:<subject>', e.g. 'login-ip:203.0.113.9'
  count        INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);

