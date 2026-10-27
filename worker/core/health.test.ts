import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("GET /api/health", () => {
  it("answers ok with no store and a request id", async () => {
    const r = await SELF.fetch("https://turk.shab.boo/api/health");
    expect(r.status).toBe(200);
    expect(r.headers.get("Cache-Control")).toBe("no-store");
    expect(r.headers.get("X-Request-Id")).toMatch(/^[a-z2-7]{16}$/);
    const body = await r.json<{ ok: boolean; time: number }>();
    expect(body.ok).toBe(true);
    expect(body.time).toBeGreaterThan(0);
  });
});

describe("unknown API routes", () => {
  it("answer 404 not_found in the error envelope", async () => {
    const r = await SELF.fetch("https://turk.shab.boo/api/nope");
    expect(r.status).toBe(404);
    expect(await r.json()).toMatchObject({ error: { code: "not_found" } });
  });
});
