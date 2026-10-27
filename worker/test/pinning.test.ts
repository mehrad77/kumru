// Pins the cross-feature behaviour the registry refactor must not change: the shape of the account export, what deleting an account
// removes at once, what the nightly sweep removes, the 404 and 426 answers, and the reader's flat errors. They ran green before
// the central route table, sweep, export and delete were split into per-feature hooks, and they must stay green.
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { sweep } from "../core/sweep.ts";
import { api, signup } from "./helpers.ts";

const DAY = 86_400_000;
const n = (sql: string, ...args: unknown[]) => env.DB.prepare(sql).bind(...args).first<number>("n");

describe("the account export", () => {
  it("has the frozen v1 shape: every section, in the same nesting", async () => {
    const s = await signup("exporter");
    await api("/api/doc/progress", { method: "PUT", token: s.token, body: { baseRev: 0, body: { v: 5, nick: "E" }, weak: { v: 1, cards: [{ id: "c", tries: 3, wrong: 2 }], lessons: [] } } });
    const r = await api("/api/export", { token: s.token });
    expect(r.status).toBe(200);
    expect(r.headers.get("Content-Disposition")).toMatch(/^attachment; filename="kumru-exporter-\d{4}-\d{2}-\d{2}\.json"$/);
    const e = r.json;
    expect(Object.keys(e).sort()).toEqual(["book", "classes", "docs", "exported", "follows", "format", "profile", "push", "user", "v", "weak", "yeniTokens"]);
    expect([e.format, e.v]).toEqual(["kumru-export", 1]);
    expect(Object.keys(e.user).sort()).toEqual(["created", "id", "plan", "role", "tz", "username"]);
    expect(Object.keys(e.docs)).toEqual(["progress"]);
    expect(Object.keys(e.docs.progress).sort()).toEqual(["body", "rev", "updated"]);
    expect(e.docs.progress.body).toEqual({ v: 5, nick: "E" });
    expect(e.profile).toBeNull();
    expect(e.follows).toEqual({ following: [], followers: [] });
    expect(Object.keys(e.weak).sort()).toEqual(["body", "updated"]);
    expect(e.book).toBeNull();
    expect([e.push, e.yeniTokens, e.classes]).toEqual([0, [], []]);
  });
});

describe("deleting an account", () => {
  it("marks the account, ends its sessions and reader connections at once, and keeps the rest for the sweep", async () => {
    const s = await signup("leaver");
    const other = await signup("stayer");
    await api("/api/doc/progress", { method: "PUT", token: s.token, body: { baseRev: 0, body: { v: 5 } } });
    await env.DB.prepare("INSERT INTO yeni_tokens (id, user_id, token_hash, label, created_at, last_used_at) VALUES ('t1', ?, x'00', 'r', 1, 1)").bind(s.user.id).run();
    await env.DB.prepare("INSERT INTO yeni_codes (code_hash, user_id, challenge, return_url, expires) VALUES (x'01', ?, 'c', 'o', 9e15)").bind(s.user.id).run();
    expect((await api("/api/delete", { body: { password: "wrong password" }, token: s.token })).status).toBe(400);
    expect((await api("/api/delete", { body: { password: s.password }, token: s.token })).status).toBe(204);
    expect(await n("SELECT COUNT(*) AS n FROM users WHERE id = ? AND deleted IS NOT NULL", s.user.id)).toBe(1);
    expect(await n("SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?", s.user.id)).toBe(0);
    expect(await n("SELECT COUNT(*) AS n FROM yeni_tokens WHERE user_id = ?", s.user.id)).toBe(0);
    expect(await n("SELECT COUNT(*) AS n FROM yeni_codes WHERE user_id = ?", s.user.id)).toBe(0);
    expect(await n("SELECT COUNT(*) AS n FROM docs WHERE user_id = ?", s.user.id)).toBe(1);
    expect(await n("SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?", other.user.id)).toBe(1);
    expect((await api("/api/me", { token: s.token })).status).toBe(401);
  });
});

describe("the nightly sweep", () => {
  it("removes what expired, unshared book summaries and old deleted accounts, and nothing else", async () => {
    const a = await signup("keeper"), b = await signup("shared");
    const old = Date.now() - 2 * DAY, now = Date.now();
    await env.DB.prepare("UPDATE sessions SET expires = ? WHERE user_id = ?").bind(old, a.user.id).run();
    await env.DB.prepare("INSERT INTO pairings (code_hash, user_id, expires) VALUES (x'0a', ?, ?), (x'0b', ?, ?)").bind(a.user.id, old, b.user.id, now + DAY).run();
    await env.DB.prepare("INSERT INTO yeni_codes (code_hash, user_id, challenge, return_url, expires) VALUES (x'01', ?, 'c', 'o', ?), (x'02', ?, 'c', 'o', ?)").bind(a.user.id, old, a.user.id, now + DAY).run();
    await env.DB.prepare("INSERT INTO limits (key, count, window_start) VALUES ('old:x', 1, ?), ('new:x', 1, ?)").bind(old - DAY, now).run();
    await env.DB.prepare("INSERT INTO classes (id, name, code, owner, created) VALUES ('c1', 'K', 'KKKKKK', ?, 1)").bind(b.user.id).run();
    await env.DB.prepare("INSERT INTO class_members (class_id, user_id, joined, share, share_book) VALUES ('c1', ?, 1, 1, 1)").bind(b.user.id).run();
    await env.DB.prepare("INSERT INTO book (user_id, body, updated) VALUES (?, '{}', 1), (?, '{}', 1)").bind(a.user.id, b.user.id).run();
    const gone = await signup("gone");
    await env.DB.prepare("UPDATE users SET deleted = ? WHERE id = ?").bind(now - 8 * DAY, gone.user.id).run();
    const soon = await signup("soon");
    await env.DB.prepare("UPDATE users SET deleted = ? WHERE id = ?").bind(now - DAY, soon.user.id).run();
    await sweep(env, now);
    expect(await n("SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?", a.user.id)).toBe(0);
    expect(await n("SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?", b.user.id)).toBe(1);
    expect(await n("SELECT COUNT(*) AS n FROM pairings")).toBe(1);
    expect(await n("SELECT COUNT(*) AS n FROM yeni_codes")).toBe(1);
    expect(await n("SELECT COUNT(*) AS n FROM limits WHERE key = 'old:x'")).toBe(0);
    expect(await n("SELECT COUNT(*) AS n FROM limits WHERE key = 'new:x'")).toBe(1);
    expect(await n("SELECT COUNT(*) AS n FROM book WHERE user_id = ?", a.user.id)).toBe(0);
    expect(await n("SELECT COUNT(*) AS n FROM book WHERE user_id = ?", b.user.id)).toBe(1);
    expect(await n("SELECT COUNT(*) AS n FROM users WHERE id = ?", gone.user.id)).toBe(0);
    expect(await n("SELECT COUNT(*) AS n FROM users WHERE id = ?", soon.user.id)).toBe(1);
  });
});

describe("how the Worker answers what is not a route", () => {
  it("an unknown /api route is a 404 not_found; a known path with another method says so", async () => {
    const a = await api("/api/nope");
    expect([a.status, a.json.error.code, a.json.error.message]).toEqual([404, "not_found", "No such route."]);
    const b = await api("/api/health", { method: "DELETE" });
    expect([b.status, b.json.error.code, b.json.error.message]).toEqual([404, "not_found", "DELETE is not allowed here."]);
  });

  it("the reader's bearer paths answer flat errors, even for the wrong method", async () => {
    const a = await api("/api/yeni/doc");
    expect([a.status, a.json]).toEqual([401, { error: "unauthorized" }]);
    const b = await api("/api/yeni/doc", { method: "PATCH" });
    expect([b.status, b.json]).toEqual([404, { error: "not_found" }]);
  });

  it("a retired client version is told to reload before it may call any /api route", async () => {
    const r = await api("/api/health", { headers: { "X-Kumru-Client": "retired-1" } });
    expect([r.status, r.json.error.code]).toEqual([426, "upgrade_required"]);
    expect((await api("/api/health", { headers: { "X-Kumru-Client": "current" } })).status).toBe(200);
    expect((await api("/api/health")).status).toBe(200);
  });

  it("every response from /api carries a request id", async () => {
    const r = await api("/api/health");
    expect(r.headers.get("X-Request-Id")).toMatch(/^[a-z2-7]{16}$/);
  });
});
