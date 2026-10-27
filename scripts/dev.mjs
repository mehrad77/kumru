// `pnpm dev`: the Vite dev server with the Worker in workerd (@cloudflare/vite-plugin, local D1 and R2). The page is
// served with the dev learner and draft path sections, HMR for app/, and a reload when data/ or
// brand/ change (scripts/vite/page.ts). PORT sets the port (default 8787). The dev-only switches are in app/host/dev.ts.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// the local D1 always has every migration (worker/migrations); `pnpm seed` adds the test accounts
if (spawnSync("pnpm", ["exec", "wrangler", "d1", "migrations", "apply", "yakerim", "--local"], { stdio: "inherit" }).status) process.exit(1);
// classes 504 and 506 (migration 0005) belong to `admin`, who does not exist in a fresh local database: add one
// that cannot sign in (`?as=admin` still works), then run the migration's statements again
mkdirSync(".wrangler", { recursive: true });
writeFileSync(".wrangler/dev-classes.sql", "INSERT OR IGNORE INTO users (id, username, pw_hash, pw_salt, pw_iter, recovery_hash, created) VALUES ('devadminaaaaaaaaaaaaaaaaaa', 'admin', X'00', X'00', 1, X'00', 0);\n"
  + readFileSync("worker/migrations/0005_suggested_classes.sql", "utf8"));
if (spawnSync("pnpm", ["exec", "wrangler", "d1", "execute", "yakerim", "--local", "--file=.wrangler/dev-classes.sql"], { stdio: "inherit" }).status) process.exit(1);

const port = process.env.PORT || "8787";
const vite = spawn("pnpm", ["exec", "vite", "--port", port, "--host", "127.0.0.1", "--strictPort"], { stdio: "inherit" });
vite.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => vite.kill(sig));
