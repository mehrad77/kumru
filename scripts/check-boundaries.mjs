// Proves the import-boundary rules in eslint.config.js fire (app/README.md, worker/README.md): lints sample code at virtual
// paths and fails when a forbidden import is not reported, or an allowed one is. Run by `pnpm check`.
import { ESLint } from "eslint";
import { readdirSync } from "node:fs";

const dirs = (d) => { try { return readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name); } catch { return []; } };
const features = dirs("app/features");
const [a, b] = features;

// [virtual file, import, must be reported?]
const CASES = [
  ["app/core/x.ts", `../features/${a}/index.ts`, true],
  ["app/host/x.ts", `../features/${a}/index.ts`, true],
  ["app/ui/x.ts", `../features/${a}/index.ts`, true],
  ["app/lib/x.ts", `../features/${a}/index.ts`, true],
  ["app/core/x.ts", "./store.ts", false],
  ...(b ? [[`app/features/${a}/x.ts`, `../${b}/model/x.ts`, true], [`app/features/${a}/x.ts`, `../${b}/index.ts`, false]] : []),
  [`app/features/${a}/x.ts`, "./model/x.ts", false],
  ["app/core/x.ts", "../../worker/core/env.ts", true],
  ["shared/x.ts", "../app/core/store.ts", true],
  ["shared/x.ts", "../worker/core/env.ts", true],
  ["worker/test/x.ts", "../../app/core/store.ts", true],
  ["worker/core/x.ts", "../features/y/index.ts", true],
  ["worker/test/x.ts", "../../shared/api.ts", false],
];

const eslint = new ESLint();
let bad = 0;
for (const [filePath, spec, expect] of CASES) {
  const [r] = await eslint.lintText(`import ${JSON.stringify(spec)};\n`, { filePath });
  const hit = r.messages.some((m) => m.ruleId === "no-restricted-imports");
  if (hit !== expect) { bad++; console.error(`${expect ? "NOT reported" : "wrongly reported"}: ${filePath} imports ${spec}`); }
}
if (bad) process.exit(1);
console.log(`import boundaries: ${CASES.length} cases ok`);
