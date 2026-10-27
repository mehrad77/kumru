-- 0004_weak (SPECS_SCHEMA.md section 2.12): each learner's hard-words summary. Append-only.

CREATE TABLE weak (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  body    TEXT NOT NULL,                              -- the learner's hard-words summary (§3.4), ≤ 8 KB
  updated INTEGER NOT NULL
);
