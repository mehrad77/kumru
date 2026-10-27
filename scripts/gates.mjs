// One command per gate (docs/SPECS.md section 11.5): `pnpm check` and `pnpm test` run every step in order,
// print each one, and stop at the first failure with its exit code. Run from the repo root, after scripts/data.mjs
// (the package scripts run it first). Sahne's story tools and the thumbnails read Kumru's content through
// SAHNE_CONTENT (sahne/packages/sahne-story/paths.ts), an absolute folder set here for every step: data/ itself on the
// real data. On data-sample/ it is .build/sahne-content/, a view of data/ without the course folders (cards, grammar,
// syllabus), since the public stories and places name real cards and lessons the sample does not have: Sahne skips its
// course rules when those folders are absent. The rest of the story check runs on both.
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { ROOT, dataKind } from "./data.mjs";

process.chdir(ROOT);
const kind = dataKind();
process.env.SAHNE_CONTENT = path.join(ROOT, "data");
if (kind === "sample") {
  const view = path.join(ROOT, ".build", "sahne-content");
  rmSync(view, { recursive: true, force: true });
  mkdirSync(view, { recursive: true });
  for (const f of ["stories", "characters", "places", "thumbs", "needs.json", "days.json"]) symlinkSync(path.join(ROOT, "data", f), path.join(view, f));
  process.env.SAHNE_CONTENT = view;
}
const SAHNE = "sahne/packages";
const py = (tool, ...args) => ["uv", "run", `scripts/${tool}`, ...args];
const pageTests = readdirSync("scripts").filter((f) => /^kumru_.*\.test\.cjs$/.test(f)).sort();
// every *.test.ts under shared/ and app/, at any depth (features keep their tests beside their model/)
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (e.name === "vendor" ? [] : walk(`${d}/${e.name}`)) : /\.test\.[jt]s$/.test(e.name) ? [`${d}/${e.name}`] : []);
const unitTests = ["shared", "app"].flatMap(walk).sort();

const GATES = {
  check: [
    ...["app", "sw", "worker", "node"].map((c) => [`types (${c})`, ["pnpm", "exec", "tsc", "-p", `tsconfig.${c}.json`]]),
    ["eslint", ["pnpm", "exec", "eslint", "."]],
    ["import boundaries", ["node", "scripts/check-boundaries.mjs"]],
    ["build is deterministic and parses", ["node", "scripts/check-build.mjs"]],
    ["content schemas and references", py("kumru_data.py", "--check")],
    ["the A1 calendar (data/days.json)", ["node", "scripts/kumru_days.mjs", "--check"]],
    // stories, characters and places: their one schema source is sahne-story/schema/ in the Sahne submodule
    ["stories, characters and places", ["node", `${SAHNE}/sahne-story/stories.ts`, "--check", "--quiet"]],
    ["the generated extras", ["node", `${SAHNE}/sahne-story/cast/extras.ts`, "--check"]],
    ["story thumbnails", ["node", `${SAHNE}/sahne-gallery/thumbs.mjs`, "--check"]],
    ["brand files", py("kumru_icons.py", "--check")],
    ["build", ["pnpm", "exec", "vite", "build"]],
  ],
  test: [
    ["build", ["pnpm", "exec", "vite", "build"]],
    ...pageTests.map((t) => [t, ["node", `scripts/${t}`]]),
    ...(unitTests.length ? [["unit tests", ["node", "--test", ...unitTests]]] : []),
    ["worker tests", ["pnpm", "exec", "vitest", "run"]],
  ],
};

const which = process.argv[2];
if (!GATES[which]) {
  console.error(`usage: node scripts/gates.mjs ${Object.keys(GATES).join("|")}`);
  process.exit(2);
}
console.log(`${which} on the ${kind} data (scripts/data.mjs), SAHNE_CONTENT=${process.env.SAHNE_CONTENT}`);
for (const [label, [cmd, ...args]] of GATES[which]) {
  console.log(`\n== ${which}: ${label}`);
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`\n${which} failed at: ${label}`);
    process.exit(r.status || 1);
  }
}
console.log(`\n${which}: all ${GATES[which].length} steps passed`);
