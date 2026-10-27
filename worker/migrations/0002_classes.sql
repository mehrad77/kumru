-- 0002_classes (SPECS_SCHEMA.md section 2.12): classes and their members. Append-only.

CREATE TABLE classes (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,                              -- ≤ 40 characters
  code    TEXT NOT NULL UNIQUE,                       -- 6-char join code
  owner   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created INTEGER NOT NULL
);
CREATE TABLE class_members (
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined   INTEGER NOT NULL,
  share    INTEGER NOT NULL DEFAULT 0,                -- 1 = this member opted in to the teacher view
  PRIMARY KEY (class_id, user_id)
);
CREATE INDEX class_members_user ON class_members(user_id);
