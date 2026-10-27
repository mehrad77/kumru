// Worker tests run inside workerd with the bindings from wrangler.jsonc, each against a fresh local D1
// with every migration applied (docs/SPECS.md section 11.5).
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migrations = await readD1Migrations("./worker/migrations");
  return {
    plugins: [cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: { bindings: { MIN_CLIENT: "retired-1", DEV: "0", PBKDF2_ITER: "1000", PEPPER: "test-pepper", VAPID_PUBLIC: "", VAPID_PRIVATE: "", TURNSTILE_SITE_KEY: "", YENI_ORIGINS: "https://yeni.shab.boo,http://localhost:4330", TEST_MIGRATIONS: migrations } },
    })],
    test: { include: ["worker/**/*.test.ts"], setupFiles: ["worker/test/setup.ts"] },
  };
});
