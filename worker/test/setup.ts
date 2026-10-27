import { applyD1Migrations, env, reset } from "cloudflare:test";
import { beforeEach } from "vitest";
import { setFeatures } from "../core/registry.ts";
import { FEATURES } from "../features/index.ts";

// tests that call core code directly (the sweep, the cron) need the same features the Worker entry registers
setFeatures(FEATURES);

beforeEach(async () => {
  await reset();
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});
