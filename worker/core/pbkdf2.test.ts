import { describe, expect, it } from "vitest";
import { pbkdf2, randomBytes } from "./crypto.ts";

// docs/SPECS.md section 8.3. Measured 2026-10-06: local workerd accepts more than 100,000 iterations (no cap
// enforced), and 100,000 take about 17 ms of CPU on an M-series Mac, over the free plan's 10 ms per
// request. PBKDF2_ITER therefore started at 50,000 (now 25,000) and is tuned against the deployed Worker's CPU time;
// users.pw_iter keeps each hash verifiable when the default changes.
describe("PBKDF2 in workerd", () => {
  it("derives 32 bytes at the configured default and is deterministic", async () => {
    const salt = randomBytes(16);
    const a = await pbkdf2("pw", "pepper", salt, 50_000);
    expect(a.length).toBe(32);
    expect(await pbkdf2("pw", "pepper", salt, 50_000)).toEqual(a);
    expect(await pbkdf2("pw", "other pepper", salt, 50_000)).not.toEqual(a);
  });
});
