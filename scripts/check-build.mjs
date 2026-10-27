// `build is deterministic and parses` (pnpm check): build the page twice into temp dirs and fail if the two differ,
// or if a script (each module chunk, sw.js) does not parse.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { build } from "vite";

const list = (dir, base = dir) => readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? list(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))]))
  .sort();

const tmp = mkdtempSync(path.join(tmpdir(), "kumru-build-"));
const outs = [path.join(tmp, "a"), path.join(tmp, "b")];
try {
  for (const outDir of outs) await build({ logLevel: "silent", build: { outDir, emptyOutDir: true } });
  const [a, b] = outs.map((d) => list(d));
  const same = a.length === b.length && a.every((f, i) => f === b[i]
    && Buffer.compare(readFileSync(path.join(outs[0], f)), readFileSync(path.join(outs[1], f))) === 0);
  if (!same) {
    console.error("the build is not deterministic: two builds of the same sources differ");
    process.exit(1);
  }
  const checks = [];
  for (const f of a.filter((f) => f.startsWith("assets/") && f.endsWith(".js"))) checks.push([f, readFileSync(path.join(outs[0], f), "utf8"), ".mjs"]);
  checks.push(["sw.js", readFileSync(path.join(outs[0], "sw.js"), "utf8"), ".js"]);
  for (const [label, text, ext] of checks) {
    const file = path.join(tmp, "check" + ext);
    writeFileSync(file, text);
    const r = spawnSync("node", ["--check", file], { encoding: "utf8" });
    if (r.status) {
      console.error(`${label} does not parse:\n${r.stderr}`);
      process.exit(1);
    }
  }
  console.log(`OK: deterministic, ${checks.length} script(s) parse (${a.length} files)`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
