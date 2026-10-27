import { SELF, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { sweep } from "../../core/sweep.ts";
import { b64url, hmac, sha256 } from "../../core/crypto.ts";
import { BASE, api, signup } from "../../test/helpers.ts";

const READER = "http://localhost:4330";
const RETURN = READER + "/ayarlar/";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SELFfetch = (path: string, init: RequestInit) => SELF.fetch(BASE + path, init);

/** A PKCE pair like the reader makes: a random verifier and b64url(sha256(verifier)). */
async function pkce() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)) as never);
  return { verifier, challenge: b64url(await sha256(verifier)) };
}
const newCode = (session: string, ret = RETURN, challenge?: string) =>
  api("/api/yeni/codes", { method: "POST", token: session, body: { return: ret, challenge } });
const exchange = (body: Record<string, unknown>, origin = READER) =>
  api("/api/yeni/token", { method: "POST", body, headers: { Origin: origin } });
/** The whole connect: code (signed in), then the reader's exchange. Resolves with the exchange response. */
async function connect(session: string, ret = RETURN, label?: string) {
  const p = await pkce();
  const c = await newCode(session, ret, p.challenge);
  if (c.status !== 200) return c;
  return exchange({ code: c.json.code, verifier: p.verifier, return: ret, ...(label === undefined ? {} : { label }) });
}
async function reader() {
  const s = await signup();
  const r = await connect(s.token);
  expect(r.status).toBe(200);
  return { ...s, yeni: r.json.token as string };
}
const getDoc = (token: string, origin = READER) => api("/api/yeni/doc", { token, headers: { Origin: origin } });
const putDoc = (token: string, baseRev: number, doc: unknown) =>
  api("/api/yeni/doc", { method: "PUT", token, body: { baseRev, doc }, headers: { Origin: READER } });

describe("connect codes", () => {
  it("hands out a code for a signed-in learner and stores only its HMAC", async () => {
    const s = await signup("defter"), p = await pkce();
    const r = await newCode(s.token, RETURN, p.challenge);
    expect(r.status).toBe(200);
    expect(r.json.code).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const rows = (await env.DB.prepare("SELECT * FROM yeni_codes WHERE user_id = ?").bind(s.user.id).all()).results as Record<string, unknown>[];
    expect(rows.length).toBe(1);
    expect(JSON.stringify(rows[0])).not.toContain(r.json.code);
    expect(new Uint8Array(rows[0].code_hash as ArrayBuffer)).toEqual(await hmac(env.PEPPER, r.json.code));
    expect(rows[0].challenge).toBe(p.challenge);
    expect(rows[0].return_url).toBe(RETURN);
    const left = (rows[0].expires as number) - Date.now();
    expect(left).toBeGreaterThan(4.5 * 60_000);
    expect(left).toBeLessThanOrEqual(5 * 60_000);
  });

  it("refuses a return address outside YENI_ORIGINS, a bad challenge and an unsigned caller", async () => {
    const s = await signup(), p = await pkce();
    for (const bad of ["https://evil.example/ayarlar/", "javascript:alert(1)", "https://yeni.shab.boo.evil.example/", "", 5]) {
      const r = await newCode(s.token, bad as string, p.challenge);
      expect(r.status).toBe(400);
      expect(r.json.error.field).toBe("return");
    }
    for (const bad of [undefined, "", "short", p.challenge + "x", p.challenge.slice(1) + "+", 5]) {
      const r = await newCode(s.token, RETURN, bad as string);
      expect(r.status).toBe(400);
      expect(r.json.error.field).toBe("challenge");
    }
    expect((await newCode(s.token, "https://yeni.shab.boo/a1/ders/1/", p.challenge)).status).toBe(200);
    expect((await api("/api/yeni/codes", { method: "POST", body: { return: RETURN, challenge: p.challenge } })).status).toBe(401);
  });

  it("no longer issues a token directly", async () => {
    const s = await signup();
    const r = await api("/api/yeni/tokens", { method: "POST", token: s.token, body: { return: RETURN } });
    expect(r.status).toBe(404);
  });

  it("lists the origins for the connect page, signed in or not", async () => {
    const s = await signup();
    expect((await api("/api/yeni/origins", { token: s.token })).json).toEqual({ origins: ["https://yeni.shab.boo", READER] });
    const anon = await api("/api/yeni/origins");
    expect(anon.status).toBe(200);
    expect(anon.json).toEqual({ origins: ["https://yeni.shab.boo", READER] });
    expect(anon.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("rate-limits issuing codes per learner", async () => {
    const s = await signup(), p = await pkce();
    for (let i = 0; i < 20; i++) expect((await newCode(s.token, RETURN, p.challenge)).status).toBe(200);
    const r = await newCode(s.token, RETURN, p.challenge);
    expect(r.status).toBe(429);
    expect(r.json.error.retryAfter).toBeGreaterThan(0);
  });
});

describe("the code exchange", () => {
  it("trades code + verifier + return for a token and the username, and stores only the token's hash", async () => {
    const s = await signup("defter");
    const r = await connect(s.token);
    expect(r.status).toBe(200);
    expect(r.json.username).toBe("defter");
    expect(r.json.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(r.headers.get("Access-Control-Allow-Origin")).toBe(READER);
    const rows = (await env.DB.prepare("SELECT * FROM yeni_tokens WHERE user_id = ?").bind(s.user.id).all()).results;
    expect(rows.length).toBe(1);
    const row = rows[0] as Record<string, unknown>;
    expect(JSON.stringify(row)).not.toContain(r.json.token);
    expect(new Uint8Array(row.token_hash as ArrayBuffer)).toEqual(await sha256(r.json.token));
    expect(row.label).toBeNull();
    expect(await env.DB.prepare("SELECT COUNT(*) AS n FROM yeni_codes WHERE user_id = ?").bind(s.user.id).first("n")).toBe(0);
    expect((await getDoc(r.json.token)).status).toBe(200);
  });

  it("works without a session: the reader has none", async () => {
    const s = await signup(), p = await pkce();
    const c = await newCode(s.token, RETURN, p.challenge);
    const r = await exchange({ code: c.json.code, verifier: p.verifier, return: RETURN });
    expect(r.status).toBe(200);
  });

  it("stores the label, trimmed and stripped of control characters, and lists it", async () => {
    const s = await signup();
    const r = await connect(s.token, RETURN, "  Safari \u0007· iPhone\n ");
    expect(r.status).toBe(200);
    const list = (await api("/api/yeni/tokens", { token: s.token })).json;
    expect(list).toEqual([{ id: expect.any(String), label: "Safari · iPhone", created_at: expect.any(Number), last_used_at: expect.any(Number) }]);
    const two = await connect(s.token, RETURN, "x".repeat(40));
    expect(two.status).toBe(200);
    const blank = await connect(s.token, RETURN, "   ");
    expect(blank.status).toBe(200);
    expect((await api("/api/yeni/tokens", { token: s.token })).json.map((t: { label: string | null }) => t.label)).toEqual([null, "x".repeat(40), "Safari · iPhone"]);
  });

  it("refuses a label over 40 characters or not a string", async () => {
    const s = await signup();
    for (const bad of ["x".repeat(41), 5, {}]) {
      const r = await connect(s.token, RETURN, bad as string);
      expect(r.status).toBe(400);
      expect(r.json).toEqual({ error: "invalid" });
    }
  });

  it("refuses a verifier of the wrong shape as invalid", async () => {
    const s = await signup(), p = await pkce();
    const c = await newCode(s.token, RETURN, p.challenge);
    for (const bad of ["", "short", p.verifier + "!", "x".repeat(129), 5]) {
      const r = await exchange({ code: c.json.code, verifier: bad, return: RETURN });
      expect(r.status).toBe(400);
      expect(r.json).toEqual({ error: "invalid" });
    }
    // a malformed request does not burn the code
    expect((await exchange({ code: c.json.code, verifier: p.verifier, return: RETURN })).status).toBe(200);
  });

  it("answers invalid_grant for a wrong verifier, and the code is gone even so", async () => {
    const s = await signup(), p = await pkce(), other = await pkce();
    const c = await newCode(s.token, RETURN, p.challenge);
    const bad = await exchange({ code: c.json.code, verifier: other.verifier, return: RETURN });
    expect(bad.status).toBe(400);
    expect(bad.json).toEqual({ error: "invalid_grant" });
    const again = await exchange({ code: c.json.code, verifier: p.verifier, return: RETURN });
    expect(again.status).toBe(400);
    expect(again.json).toEqual({ error: "invalid_grant" });
    expect((await api("/api/yeni/tokens", { token: s.token })).json).toEqual([]);
  });

  it("answers invalid_grant when the return differs from the one the code was made for", async () => {
    const s = await signup(), p = await pkce();
    const c = await newCode(s.token, RETURN, p.challenge);
    for (const ret of [READER + "/other/", "https://yeni.shab.boo/ayarlar/", RETURN + "?x=1", ""]) {
      const c2 = await newCode(s.token, RETURN, p.challenge);
      const r = await exchange({ code: c2.json.code, verifier: p.verifier, return: ret });
      expect(r.status).toBe(400);
      expect(r.json).toEqual({ error: "invalid_grant" });
    }
    expect((await exchange({ code: c.json.code, verifier: p.verifier, return: RETURN })).status).toBe(200);
  });

  it("is single use", async () => {
    const s = await signup(), p = await pkce();
    const c = await newCode(s.token, RETURN, p.challenge);
    const body = { code: c.json.code, verifier: p.verifier, return: RETURN };
    expect((await exchange(body)).status).toBe(200);
    const again = await exchange(body);
    expect(again.status).toBe(400);
    expect(again.json).toEqual({ error: "invalid_grant" });
    expect((await api("/api/yeni/tokens", { token: s.token })).json).toHaveLength(1);
  });

  it("refuses an expired code", async () => {
    const s = await signup(), p = await pkce();
    const c = await newCode(s.token, RETURN, p.challenge);
    await env.DB.prepare("UPDATE yeni_codes SET expires = ? WHERE user_id = ?").bind(Date.now() - 1, s.user.id).run();
    const r = await exchange({ code: c.json.code, verifier: p.verifier, return: RETURN });
    expect(r.status).toBe(400);
    expect(r.json).toEqual({ error: "invalid_grant" });
  });

  it("refuses an unknown code", async () => {
    const p = await pkce();
    const r = await exchange({ code: b64url(crypto.getRandomValues(new Uint8Array(32)) as never), verifier: p.verifier, return: RETURN });
    expect(r.status).toBe(400);
    expect(r.json).toEqual({ error: "invalid_grant" });
    expect(r.headers.get("Access-Control-Allow-Origin")).toBe(READER);
  });

  it("refuses a code whose learner was deleted meanwhile", async () => {
    const s = await signup(), p = await pkce();
    const c = await newCode(s.token, RETURN, p.challenge);
    await env.DB.prepare("UPDATE users SET deleted = ? WHERE id = ?").bind(Date.now(), s.user.id).run();
    expect((await exchange({ code: c.json.code, verifier: p.verifier, return: RETURN })).json).toEqual({ error: "invalid_grant" });
  });

  it("rate-limits the exchange per IP", async () => {
    const p = await pkce();
    for (let i = 0; i < 30; i++) expect((await exchange({ code: "nope" + i, verifier: p.verifier, return: RETURN })).status).toBe(400);
    const r = await exchange({ code: "nope", verifier: p.verifier, return: RETURN });
    expect(r.status).toBe(429);
    expect(r.json.error).toBe("rate_limited");
    expect(r.json.retryAfter).toBeGreaterThan(0);
  });

  it("keeps at most 10 live tokens per learner, revoking the oldest", async () => {
    const s = await signup();
    const first = (await connect(s.token)).json.token;
    for (let i = 0; i < 10; i++) await connect(s.token);
    expect((await api("/api/yeni/tokens", { token: s.token })).json.length).toBe(10);
    expect((await getDoc(first)).status).toBe(401);
  });
});

describe("the reader's document", () => {
  it("starts empty, then stores revisions against the right baseRev", async () => {
    const s = await reader();
    expect((await getDoc(s.yeni)).json).toEqual({ rev: 0, doc: null });
    expect((await putDoc(s.yeni, 0, { v: 1, units: { a: 1 } })).json).toEqual({ rev: 1 });
    await wait(1050);
    expect((await putDoc(s.yeni, 1, { v: 1, units: { a: 2 } })).json).toEqual({ rev: 2 });
    expect((await getDoc(s.yeni)).json).toEqual({ rev: 2, doc: { v: 1, units: { a: 2 } } });
  });

  it("answers 409 with the server copy when baseRev is behind (also 0 against an existing doc)", async () => {
    const s = await reader();
    await putDoc(s.yeni, 0, { n: 10 });
    await wait(1050);
    const r = await putDoc(s.yeni, 0, { n: 3 });
    expect(r.status).toBe(409);
    expect(r.json).toMatchObject({ rev: 1, doc: { n: 10 } });
    expect(r.headers.get("Access-Control-Allow-Origin")).toBe(READER);
  });

  it("refuses a doc that is not an object, and one over 512 KiB", async () => {
    const s = await reader();
    for (const bad of [[1, 2], "x", null, 3]) {
      const r = await putDoc(s.yeni, 0, bad);
      expect(r.status).toBe(400);
      expect(r.json).toEqual({ error: "invalid" });
    }
    const big = await putDoc(s.yeni, 0, { t: "x".repeat(512 * 1024) });
    expect(big.status).toBe(413);
    expect(big.json).toEqual({ error: "too_large" });
    expect((await putDoc(s.yeni, 0, { t: "x".repeat(400 * 1024) })).status).toBe(200);
  });

  it("keeps the minimum interval between saves", async () => {
    const s = await reader();
    await putDoc(s.yeni, 0, {});
    const r = await putDoc(s.yeni, 1, {});
    expect(r.status).toBe(429);
    expect(r.json).toEqual({ error: "rate_limited", retryAfter: 1 });
    expect(r.headers.get("Retry-After")).toBe("1");
  });

  it("counts GET and PUT against the yeni limit", async () => {
    const s = await reader();
    for (let i = 0; i < 120; i++) expect((await getDoc(s.yeni)).status).toBe(200);
    const r = await getDoc(s.yeni);
    expect(r.status).toBe(429);
    expect(r.json.error).toBe("rate_limited");
  });

  it("is separate from progress and from other learners", async () => {
    const a = await reader(), b = await reader();
    await putDoc(a.yeni, 0, { mine: 1 });
    expect((await getDoc(b.yeni)).json.doc).toBeNull();
    expect((await api("/api/doc/progress", { token: a.token })).json.body).toBeNull();
    expect((await api("/api/doc/yeni", { token: a.token })).status).toBe(404);
  });
});

describe("bearer auth", () => {
  it("answers 401 { error: 'unauthorized' } without a valid reader token", async () => {
    const s = await reader();
    for (const t of [undefined, "nope", "x".repeat(43), s.token]) {   // the session token is not a reader token
      const r = await api("/api/yeni/doc", { token: t, headers: { Origin: READER } });
      expect(r.status).toBe(401);
      expect(r.json).toEqual({ error: "unauthorized" });
      expect(r.headers.get("Access-Control-Allow-Origin")).toBe(READER);
    }
    // and a reader token is not a session token
    expect((await api("/api/me", { token: s.yeni })).status).toBe(401);
  });

  it("bumps last_used_at at most once a day", async () => {
    const s = await reader();
    const id = (await api("/api/yeni/tokens", { token: s.token })).json[0].id;
    await env.DB.prepare("UPDATE yeni_tokens SET last_used_at = 1 WHERE id = ?").bind(id).run();
    await getDoc(s.yeni);
    const used = ((await env.DB.prepare("SELECT last_used_at AS t FROM yeni_tokens WHERE id = ?").bind(id).first()) as { t: number }).t;
    expect(used).toBeGreaterThan(1);
    await getDoc(s.yeni);
    expect(((await env.DB.prepare("SELECT last_used_at AS t FROM yeni_tokens WHERE id = ?").bind(id).first()) as { t: number }).t).toBe(used);
  });
});

describe("CORS", () => {
  it("echoes an allowed Origin on the bearer routes, with no credentials", async () => {
    const s = await reader();
    const r = await getDoc(s.yeni);
    expect(r.headers.get("Access-Control-Allow-Origin")).toBe(READER);
    expect(r.headers.get("Vary")).toBe("Origin");
    expect(r.headers.get("Access-Control-Allow-Credentials")).toBeNull();
  });

  it("sends no Allow-Origin to another origin", async () => {
    const s = await reader();
    const r = await getDoc(s.yeni, "https://evil.example");
    expect(r.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(r.headers.get("Vary")).toBe("Origin");
  });

  it("answers the preflight with 204", async () => {
    const pre = (origin: string, path = "/api/yeni/doc") => SELFfetch(path, { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "PUT", "Access-Control-Request-Headers": "authorization, content-type" } });
    const ok = await pre("https://yeni.shab.boo");
    expect(ok.status).toBe(204);
    expect(ok.headers.get("Access-Control-Allow-Origin")).toBe("https://yeni.shab.boo");
    expect(ok.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, DELETE, OPTIONS");
    expect(ok.headers.get("Access-Control-Allow-Headers")).toBe("Authorization, Content-Type");
    expect(ok.headers.get("Access-Control-Max-Age")).toBe("86400");
    const post = await SELFfetch("/api/yeni/token", { method: "OPTIONS", headers: { Origin: READER, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" } });
    expect(post.status).toBe(204);
    expect(post.headers.get("Access-Control-Allow-Origin")).toBe(READER);
    expect(post.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    const no = await pre("https://evil.example");
    expect(no.status).toBe(204);
    expect(no.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("is not sent on the other routes", async () => {
    const s = await signup();
    const r = await api("/api/me", { token: s.token, headers: { Origin: READER } });
    expect(r.headers.get("Access-Control-Allow-Origin")).toBeNull();
    const t = await api("/api/yeni/tokens", { token: s.token, headers: { Origin: READER } });
    expect(t.headers.get("Access-Control-Allow-Origin")).toBeNull();
    const c = await api("/api/yeni/codes", { method: "POST", token: s.token, body: {}, headers: { Origin: READER } });
    expect(c.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("revoking", () => {
  it("the reader disconnects itself with DELETE /api/yeni/token", async () => {
    const s = await reader();
    const r = await api("/api/yeni/token", { method: "DELETE", token: s.yeni, headers: { Origin: READER } });
    expect(r.status).toBe(204);
    expect(r.headers.get("Access-Control-Allow-Origin")).toBe(READER);
    expect((await getDoc(s.yeni)).status).toBe(401);
  });

  it("the Account card lists and revokes connections, only the caller's", async () => {
    const s = await reader(), other = await signup();
    const list = (await api("/api/yeni/tokens", { token: s.token })).json;
    expect(list).toEqual([{ id: expect.any(String), label: null, created_at: expect.any(Number), last_used_at: expect.any(Number) }]);
    expect((await api(`/api/yeni/tokens/${list[0].id}`, { method: "DELETE", token: other.token })).status).toBe(404);
    expect((await getDoc(s.yeni)).status).toBe(200);
    expect((await api(`/api/yeni/tokens/${list[0].id}`, { method: "DELETE", token: s.token })).status).toBe(204);
    expect((await getDoc(s.yeni)).status).toBe(401);
    expect((await api("/api/yeni/tokens", { token: s.token })).json).toEqual([]);
  });

  it("a password change or recovery disconnects every reader", async () => {
    const s = await reader();
    expect((await api("/api/password", { token: s.token, body: { current: s.password, next: "another horse" } })).status).toBe(200);
    expect((await getDoc(s.yeni)).status).toBe(401);
    const t = (await connect(s.token)).json.token;
    expect((await api("/api/recover", { body: { username: s.user.username, recovery: s.recovery, password: "third horse!" } })).status).toBe(200);
    expect((await getDoc(t)).status).toBe(401);
  });
});

describe("pending codes", () => {
  const pending = async (id: string) => (await env.DB.prepare("SELECT COUNT(*) AS n FROM yeni_codes WHERE user_id = ?").bind(id).first("n")) as number;

  it("a password change drops them", async () => {
    const s = await signup(), p = await pkce();
    const c = await newCode(s.token, RETURN, p.challenge);
    expect(await pending(s.user.id)).toBe(1);
    expect((await api("/api/password", { token: s.token, body: { current: s.password, next: "another horse" } })).status).toBe(200);
    expect(await pending(s.user.id)).toBe(0);
    expect((await exchange({ code: c.json.code, verifier: p.verifier, return: RETURN })).json).toEqual({ error: "invalid_grant" });
  });

  it("a recovery drops them", async () => {
    const s = await signup(), p = await pkce();
    await newCode(s.token, RETURN, p.challenge);
    expect(await pending(s.user.id)).toBe(1);
    expect((await api("/api/recover", { body: { username: s.user.username, recovery: s.recovery, password: "third horse!" } })).status).toBe(200);
    expect(await pending(s.user.id)).toBe(0);
  });

  it("deleting the account drops them", async () => {
    const s = await signup(), p = await pkce();
    await newCode(s.token, RETURN, p.challenge);
    expect((await api("/api/delete", { token: s.token, body: { password: s.password } })).status).toBe(204);
    expect(await pending(s.user.id)).toBe(0);
  });

  it("the nightly sweep removes the expired ones", async () => {
    const s = await signup(), p = await pkce();
    await newCode(s.token, RETURN, p.challenge);
    await newCode(s.token, RETURN, p.challenge);
    await env.DB.prepare("UPDATE yeni_codes SET expires = ? WHERE rowid = (SELECT MIN(rowid) FROM yeni_codes)").bind(Date.now() - 1).run();
    await sweep(env);
    expect(await pending(s.user.id)).toBe(1);
  });
});

describe("export and delete", () => {
  it("the export carries the notebook and the connections", async () => {
    const s = await reader();
    await putDoc(s.yeni, 0, { v: 1, note: "merhaba" });
    const r = await api("/api/export", { token: s.token });
    expect(r.json.docs.yeni).toMatchObject({ rev: 1, body: { v: 1, note: "merhaba" } });
    expect(r.json.yeniTokens).toHaveLength(1);
    expect(JSON.stringify(r.json)).not.toContain(s.yeni);
  });

  it("deleting the account stops the reader at once, and the purge removes the notebook", async () => {
    const s = await reader();
    await putDoc(s.yeni, 0, { v: 1 });
    expect((await api("/api/delete", { token: s.token, body: { password: s.password } })).status).toBe(204);
    expect((await getDoc(s.yeni)).status).toBe(401);
    expect(await env.DB.prepare("SELECT COUNT(*) AS n FROM yeni_tokens WHERE user_id = ?").bind(s.user.id).first("n")).toBe(0);
    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(s.user.id).run();   // what the sweep does after 7 days
    expect(await env.DB.prepare("SELECT COUNT(*) AS n FROM docs WHERE user_id = ?").bind(s.user.id).first("n")).toBe(0);
  });
});

describe("GET /api/yeni/notebook (Kumru's own page reads the learner's notebook)", () => {
  const nb = (token: string, since?: number | string, headers?: Record<string, string>) =>
    api("/api/yeni/notebook" + (since === undefined ? "" : "?since=" + since), { token, headers });
  const limitsRows = async () => (await env.DB.prepare("SELECT COUNT(*) AS n FROM limits").first<{ n: number }>())!.n;

  it("answers rev 0 and no doc for a learner without a notebook", async () => {
    const s = await signup();
    const r = await nb(s.token);
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ rev: 0, doc: null });
    expect(r.headers.get("Cache-Control")).toBe("no-store");
    expect((await nb(s.token, 0)).json).toEqual({ rev: 0, doc: null });
  });

  it("returns the stored notebook as it was written, with its rev", async () => {
    const s = await reader();
    const doc = { app: "yeni-defter", v: 1, units: { "a1/ders/03_Unite_3_x": { pages: { "41": 5 }, done: { v: true, at: 9 } } }, meta: { days: ["2026-01-01"] } };
    expect((await putDoc(s.yeni, 0, doc)).status).toBe(200);
    const r = await nb(s.token);
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ rev: 1, doc });
    expect(r.headers.get("Content-Type")).toContain("application/json");
  });

  it("is 304 with an empty body when since is the stored rev, and 200 again once it moved on", async () => {
    const s = await reader();
    await putDoc(s.yeni, 0, { v: 1, n: 1 });
    const same = await SELFfetch("/api/yeni/notebook?since=1", { headers: { Authorization: `Bearer ${s.token}` } });
    expect(same.status).toBe(304);
    expect(await same.text()).toBe("");
    expect((await nb(s.token, 0)).json.rev).toBe(1);
    expect((await nb(s.token, "nonsense")).status).toBe(200);
    await wait(1100);
    await putDoc(s.yeni, 1, { v: 1, n: 2 });
    const r = await nb(s.token, 1);
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ rev: 2, doc: { v: 1, n: 2 } });
  });

  it("only ever returns the caller's own notebook", async () => {
    const a = await reader(), b = await reader();
    await putDoc(a.yeni, 0, { who: "a" });
    await putDoc(b.yeni, 0, { who: "b" });
    expect((await nb(a.token)).json.doc).toEqual({ who: "a" });
    expect((await nb(b.token)).json.doc).toEqual({ who: "b" });
    const c = await signup();
    expect((await nb(c.token)).json).toEqual({ rev: 0, doc: null });
  });

  it("needs a signed-in session: no token, a bad one, or a reader token are all 401", async () => {
    const s = await reader();
    await putDoc(s.yeni, 0, { who: "a" });
    expect((await nb(undefined as unknown as string)).status).toBe(401);
    expect((await nb("not-a-session")).status).toBe(401);
    expect((await nb(s.yeni)).status).toBe(401);
  });

  it("is same-origin only: no CORS headers, even for a reader origin", async () => {
    const s = await reader();
    const r = await nb(s.token, undefined, { Origin: READER });
    expect(r.status).toBe(200);
    expect(r.headers.get("Access-Control-Allow-Origin")).toBeNull();
    const pre = await SELFfetch("/api/yeni/notebook", { method: "OPTIONS", headers: { Origin: READER } });
    expect(pre.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("writes nothing: no limits row, no rev change", async () => {
    const s = await reader();
    await putDoc(s.yeni, 0, { v: 1 });
    const before = await limitsRows();
    for (let i = 0; i < 5; i++) await nb(s.token, i % 2 ? 1 : undefined);
    expect(await limitsRows()).toBe(before);
    expect(await env.DB.prepare("SELECT rev FROM docs WHERE user_id = ? AND kind = 'yeni'").bind(s.user.id).first("rev")).toBe(1);
  });
});
