// `pnpm smoke`: the browser smoke test against `wrangler dev` (docs/SPECS.md section 11.5).
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.SMOKE_PORT || 8788);

export default defineConfig({
  testDir: "smoke",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${PORT}`, ...devices["Pixel 7"] },
  webServer: {
    command: `PORT=${PORT} node scripts/dev.mjs`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
