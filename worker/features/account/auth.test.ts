import { describe, expect, it } from "vitest";
import { api, signup } from "../../test/helpers.ts";

describe("signup and login", () => {
  it("creates an account, a session and a recovery code", async () => {
    const s = await signup("Ada", "correct horse");
    expect(s.user.username).toBe("ada");
    expect(s.recovery).toMatch(/^[2-9A-Z]{5}-[2-9A-Z]{5}$/);
    const me = await api("/api/me", { token: s.token });
    expect(me.status).toBe(200);
    expect(me.json.user).toMatchObject({ username: "ada", role: "learner", plan: "free", tz: "Europe/Istanbul" });
    expect(me.json.sessions).toHaveLength(1);
  });

  it("rejects a taken username, case-insensitively", async () => {
    await signup("ali");
    const r = await api("/api/signup", { body: { username: "ALI", password: "another one" } });
    expect(r.status).toBe(409);
    expect(r.json.error.code).toBe("taken");
  });

  it("validates username and password shape", async () => {
    expect((await api("/api/signup", { body: { username: "a b", password: "longenough" } })).json.error).toMatchObject({ code: "invalid", field: "username" });
    expect((await api("/api/signup", { body: { username: "okname", password: "short" } })).json.error).toMatchObject({ code: "invalid", field: "password" });
  });

  it("logs in with the right password only, without saying which part was wrong", async () => {
    const s = await signup("nina", "correct horse");
    const bad = await api("/api/login", { body: { username: "nina", password: "wrong horse" } });
    expect(bad.status).toBe(400);
    expect(bad.json.error.code).toBe("invalid");
    const nobody = await api("/api/login", { body: { username: "nobody", password: "wrong horse" } });
    expect(nobody.json.error.message).toBe(bad.json.error.message);
    const ok = await api("/api/login", { body: { username: "NINA", password: s.password } });
    expect(ok.status).toBe(200);
    expect(ok.json.user.id).toBe(s.user.id);
  });

  it("rate-limits repeated login failures for one username", async () => {
    await signup("omid");
    for (let i = 0; i < 10; i++) await api("/api/login", { body: { username: "omid", password: "nope nope" } });
    const r = await api("/api/login", { body: { username: "omid", password: "nope nope" } });
    expect(r.status).toBe(429);
    expect(r.json.error.retryAfter).toBeGreaterThan(0);
    expect(r.headers.get("Retry-After")).toBeTruthy();
  });

  it("answers 401 without a valid session", async () => {
    expect((await api("/api/me")).status).toBe(401);
    expect((await api("/api/me", { token: "x".repeat(43) })).json.error.code).toBe("unauthorized");
  });
});

describe("sessions, recovery and password", () => {
  it("logout ends only this device", async () => {
    const s = await signup("sara");
    const second = (await api("/api/login", { body: { username: "sara", password: s.password } })).json.token;
    expect((await api("/api/logout", { method: "POST", token: s.token })).status).toBe(204);
    expect((await api("/api/me", { token: s.token })).status).toBe(401);
    expect((await api("/api/me", { token: second })).status).toBe(200);
  });

  it("revokes another device by id", async () => {
    const s = await signup("bora");
    const other = (await api("/api/login", { body: { username: "bora", password: s.password } })).json.token;
    const me = await api("/api/me", { token: s.token });
    const otherId = me.json.sessions.find((x: { id: string }) => x.id !== me.json.session.id).id;
    expect((await api(`/api/sessions/${otherId}`, { method: "DELETE", token: s.token })).status).toBe(204);
    expect((await api("/api/me", { token: other })).status).toBe(401);
    expect((await api(`/api/sessions/${otherId}`, { method: "DELETE", token: s.token })).status).toBe(404);
  });

  it("recovers with the code, ends every session and issues a new code", async () => {
    const s = await signup("ece");
    const r = await api("/api/recover", { body: { username: "ece", recovery: s.recovery.toLowerCase().replace("-", " "), password: "a new password" } });
    expect(r.status).toBe(200);
    expect(r.json.recovery).not.toBe(s.recovery);
    expect((await api("/api/me", { token: s.token })).status).toBe(401);
    expect((await api("/api/login", { body: { username: "ece", password: "a new password" } })).status).toBe(200);
    expect((await api("/api/recover", { body: { username: "ece", recovery: s.recovery, password: "another password" } })).status).toBe(400);
  });

  it("changes the password and signs other devices out", async () => {
    const s = await signup("can");
    const other = (await api("/api/login", { body: { username: "can", password: s.password } })).json.token;
    expect((await api("/api/password", { token: s.token, body: { current: "wrong", next: "a fresh password" } })).json.error.field).toBe("current");
    expect((await api("/api/password", { token: s.token, body: { current: s.password, next: "a fresh password" } })).status).toBe(200);
    expect((await api("/api/me", { token: s.token })).status).toBe(200);
    expect((await api("/api/me", { token: other })).status).toBe(401);
  });
});

describe("QR pairing", () => {
  it("claims a code once", async () => {
    const s = await signup("deniz");
    const start = await api("/api/pair/start", { method: "POST", token: s.token });
    expect(start.json.code).toMatch(/^[2-9A-Z]{12}$/);
    const claim = await api("/api/pair/claim", { body: { code: start.json.code.toLowerCase(), label: "phone 2" } });
    expect(claim.status).toBe(200);
    expect(claim.json.user.id).toBe(s.user.id);
    expect((await api("/api/me", { token: claim.json.token })).status).toBe(200);
    expect((await api("/api/pair/claim", { body: { code: start.json.code } })).json.error.code).toBe("gone");
  });
});

describe("delete and export", () => {
  it("soft-deletes with the password, and a login within 7 days restores", async () => {
    const s = await signup("emre");
    expect((await api("/api/delete", { token: s.token, body: { password: "wrong one" } })).status).toBe(400);
    expect((await api("/api/delete", { token: s.token, body: { password: s.password } })).status).toBe(204);
    expect((await api("/api/me", { token: s.token })).status).toBe(401);
    const back = await api("/api/login", { body: { username: "emre", password: s.password } });
    expect(back.json.restored).toBe(true);
  });

  it("exports the caller's own data as a download", async () => {
    const s = await signup("fatma");
    await api("/api/doc/progress", { method: "PUT", token: s.token, body: { baseRev: 0, body: { v: 5, conf: { a: 3 } } } });
    const r = await api("/api/export", { token: s.token });
    expect(r.headers.get("Content-Disposition")).toMatch(/kumru-fatma-\d{4}-\d{2}-\d{2}\.json/);
    expect(r.json).toMatchObject({ format: "kumru-export", user: { username: "fatma" }, docs: { progress: { rev: 1, body: { conf: { a: 3 } } } } });
    expect(JSON.stringify(r.json)).not.toMatch(/pw_hash|recovery_hash|token/);
  });
});

describe("dev login", () => {
  it("does not exist outside wrangler dev", async () => {
    expect((await api("/api/dev/login", { body: { username: "ada" } })).status).toBe(404);
  });
});
