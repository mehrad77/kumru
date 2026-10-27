// ESLint for the Worker (TypeScript), the host modules, the shared code and the app (app/).
import { readdirSync } from "node:fs";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

// Import boundaries (app/README.md, worker/README.md). Patterns match the import string, so relative paths are caught too;
// scripts/check-boundaries.mjs proves each one fires.
const ban = (groups, message) => ({ "no-restricted-imports": ["error", { patterns: groups.map((g) => ({ group: [].concat(g), message })) }] });
const dirs = (dir) => { try { return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch { return []; } };
const appFeatures = dirs("app/features");
const workerFeatures = dirs("worker/features");
const others = (ids, id) => ids.filter((g) => g !== id).flatMap((g) => [[`**/features/${g}/**`, `!**/features/${g}/index`, `!**/features/${g}/index.ts`], [`../${g}/**`, `!../${g}/index`, `!../${g}/index.ts`]]);
const FEATURE = "Import another feature only through its index.ts.";
const NOT_WORKER = ["**/worker/**"], NOT_APP = ["**/app/**"], NOT_FEATURES = ["**/features/**"];
// One config per area: a later "no-restricted-imports" replaces an earlier one, so each file must match exactly one block.
const boundaries = [
  { files: ["app/core/**", "app/host/**", "app/ui/**", "app/lib/**", "app/styles/**"], rules: ban([NOT_FEATURES, NOT_WORKER], "core, host, ui and lib never import a feature, and app code never imports worker code.") },
  ...appFeatures.map((id) => ({ files: [`app/features/${id}/**`], rules: ban([...others(appFeatures, id), NOT_WORKER], `${FEATURE} App code never imports worker code.`) })),
  { files: ["app/*.ts", "app/*.tsx", "app/features/*.ts"], rules: ban([NOT_WORKER], "App code never imports worker code.") },
  { files: ["shared/**"], rules: ban([NOT_WORKER, NOT_APP], "shared imports neither app nor worker.") },
  { files: ["worker/core/**"], rules: ban([NOT_APP, NOT_FEATURES], "worker/core never imports a feature, and the worker never imports app code.") },
  ...workerFeatures.map((id) => ({ files: [`worker/features/${id}/**`], rules: ban([...others(workerFeatures, id), NOT_APP], `${FEATURE} The worker never imports app code.`) })),
  { files: ["worker/test/**", "worker/*.ts", "worker/features/*.ts"], rules: ban([NOT_APP], "The worker never imports app code.") },
];

export default tseslint.config(
  { ignores: ["public/**", "node_modules/**", "app/features/account/vendor/**", ".wrangler/**", "test-results/**", "playwright-report/**", "sahne/**", "data-sample/**", "scripts/*.test.cjs"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["app/**/*.{ts,tsx}", "shared/**/*.ts"],
    languageOptions: { globals: { ...globals.browser } },
  },
  ...boundaries,
  {
    // progress, tutor and the content collections are open JSON documents until the domain ports type them
    files: ["app/host/**/*.ts", "shared/progress.ts", "shared/tutor.ts", "shared/merge-util.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  {
    files: ["app/host/sw.ts"],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
  {
    files: ["scripts/**/*.mjs", "scripts/**/*.ts", "vite.config.ts", "worker/seed/**/*.mjs", "**/*.test.js", "**/*.test.ts", "playwright.config.ts", "playwright.e2e.config.ts", "smoke/**", "e2e/**"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
);
