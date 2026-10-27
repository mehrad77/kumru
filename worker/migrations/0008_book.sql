-- 0008_book (SPECS_SCHEMA.md sections 2.10b and 2.7): book progress from Notebook, shared with a class owner only
-- when the learner switches it on for that class (separately from `share`). Append-only: never edit this file once applied.

ALTER TABLE class_members ADD COLUMN share_book INTEGER NOT NULL DEFAULT 0;

CREATE TABLE book (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  body    TEXT NOT NULL,                              -- the learner's book summary (§3.7), ≤ 4 KB
  updated INTEGER NOT NULL
);
