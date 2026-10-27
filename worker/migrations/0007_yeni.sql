-- 0007_yeni (SPECS_SCHEMA.md section 2.10a): bearer tokens for Notebook's sync.
-- The notebook itself is one more row of `docs` (kind 'yeni'); these tables only hold who may read and write it.
-- Connecting is code + PKCE (AUTH.md): `yeni_codes` holds the one-time codes between the consent page and the exchange.
-- Append-only: never edit this file once applied; add a new migration instead.

CREATE TABLE yeni_tokens (
  id           TEXT PRIMARY KEY,                       -- 16 chars, shown in the Account card's connections list
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   BLOB NOT NULL UNIQUE,                   -- SHA-256 of the bearer token; the token itself is never stored
  label        TEXT,                                   -- a short device label the reader sends at exchange time (at most 40 chars)
  created_at   INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL                        -- bumped at most once a day per token
);
CREATE INDEX yeni_tokens_user ON yeni_tokens(user_id);

CREATE TABLE yeni_codes (
  code_hash  BLOB PRIMARY KEY,                         -- HMAC-SHA-256 of the code under PEPPER; the code itself is never stored
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge  TEXT NOT NULL,                            -- the reader's PKCE challenge, b64url(sha256(verifier)), 43 chars
  return_url TEXT NOT NULL,                            -- the exact return URL the code was made for
  expires    INTEGER NOT NULL                          -- five minutes after creation; consumed on first use, swept nightly
);
CREATE INDEX yeni_codes_user ON yeni_codes(user_id);
