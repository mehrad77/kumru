-- 0003_push (SPECS_SCHEMA.md section 2.12): Web Push subscriptions. Append-only.

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
