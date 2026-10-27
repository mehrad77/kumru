-- A class's header: a description, when it meets, and an icon and colour the teacher picks (SPECS_SCHEMA.md section 2.8).
ALTER TABLE classes ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE classes ADD COLUMN schedule    TEXT NOT NULL DEFAULT '';
ALTER TABLE classes ADD COLUMN icon        TEXT NOT NULL DEFAULT 'book';
ALTER TABLE classes ADD COLUMN color       TEXT NOT NULL DEFAULT 'sage';
