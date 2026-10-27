-- The classes a new learner is offered in onboarding (SPECS.md section 10.3), taught by `admin`.
-- Fixed codes: the random code alphabet has no 0, so these can never collide with one. If `admin`
-- does not exist yet (a fresh database) nothing is inserted; seed.mjs adds them locally.
INSERT OR IGNORE INTO classes (id, name, code, owner, created)
  SELECT 'suggested504001', '504', 'YK0504', id, CAST(strftime('%s', 'now') AS INTEGER) * 1000 FROM users WHERE username = 'admin';
INSERT OR IGNORE INTO classes (id, name, code, owner, created)
  SELECT 'suggested506001', '506', 'YK0506', id, CAST(strftime('%s', 'now') AS INTEGER) * 1000 FROM users WHERE username = 'admin';
INSERT OR IGNORE INTO class_members (class_id, user_id, joined, share)
  SELECT c.id, c.owner, c.created, 1 FROM classes c WHERE c.id IN ('suggested504001', 'suggested506001');
