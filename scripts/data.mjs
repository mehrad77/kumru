// Puts the course data in data/ before `pnpm dev`, `check`, `test` and `build` (README.md, *Data*).
// The five book-derived folders (cards, cards-extra, grammar, path, syllabus) are private: they live in the course
// repo's kumru-data/ and are never tracked here (.gitignore). The private root comes from $KUMRU_DATA or the first
// line of a git-ignored .kumru-data file; with one, each folder becomes a symlink into it. With none, each folder is
// a copy of data-sample/ (a few original cards, one lesson, one path section, a stub syllabus).
// `node scripts/data.mjs --which` prints "real" or "sample" and changes nothing.
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PRIVATE = ["cards", "cards-extra", "grammar", "path", "syllabus"];
const DATA = path.join(ROOT, "data");

/** The private data root (absolute), or null to use data-sample/. */
export function privateRoot() {
  let root = process.env.KUMRU_DATA?.trim();
  const file = path.join(ROOT, ".kumru-data");
  if (!root && existsSync(file)) root = readFileSync(file, "utf8").split("\n")[0].trim();
  return root ? path.resolve(ROOT, root) : null;
}

/** "real" when data/cards links into a private root, else "sample". */
export const dataKind = () => (lstatSync(path.join(DATA, "cards"), { throwIfNoEntry: false })?.isSymbolicLink() ? "real" : "sample");

/** The content root Sahne's tools read (SAHNE_CONTENT, an absolute folder): data/ itself on the real data. On the sample it
 * is .build/sahne-content/, made fresh: a view of data/ without the course folders (cards, grammar, syllabus), since the
 * public stories and places name real cards and lessons the sample does not have, and Sahne skips its course rules when
 * those folders are absent. Used by scripts/gates.mjs and scripts/backstage.mjs. */
export function sahneContent() {
  if (dataKind() === "real") return DATA;
  const view = path.join(ROOT, ".build", "sahne-content");
  rmSync(view, { recursive: true, force: true });
  mkdirSync(view, { recursive: true });
  for (const f of ["series.json", "seasons", "stories", "characters", "places", "thumbs", "needs.json", "days.json"]) symlinkSync(path.join(DATA, f), path.join(view, f));
  return view;
}

function setup() {
  const root = privateRoot();
  if (root) {
    const missing = PRIVATE.filter((d) => !existsSync(path.join(root, d)));
    if (missing.length) {
      console.error(`data: ${root} has no ${missing.join(", ")} (set KUMRU_DATA or .kumru-data to the course repo's kumru-data/)`);
      process.exit(1);
    }
  }
  for (const d of PRIVATE) {
    const at = path.join(DATA, d);
    if (root) {
      const to = path.join(root, d);
      const st = lstatSync(at, { throwIfNoEntry: false });
      if (st?.isSymbolicLink() && path.resolve(DATA, readlinkSync(at)) === to) continue;
      rmSync(at, { recursive: true, force: true });
      symlinkSync(to, at, "dir");
    } else {
      rmSync(at, { recursive: true, force: true });
      cpSync(path.join(ROOT, "data-sample", d), at, { recursive: true });
    }
  }
  console.log(root ? `data: linked ${PRIVATE.join(", ")} from ${root}` : "data: no private data (KUMRU_DATA or .kumru-data); copied data-sample/");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--which") console.log(dataKind());
  else setup();
}
