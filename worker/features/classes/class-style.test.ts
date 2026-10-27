import { describe, expect, it } from "vitest";
import { api, signup } from "../../test/helpers.ts";

describe("class header (description, schedule, icon, colour)", () => {
  it("defaults, then is set on create and changed by the owner only", async () => {
    const t = await signup("teacher"), s = await signup("student");
    const plain = (await api("/api/classes", { token: t.token, body: { name: "Plain" } })).json.class;
    expect([plain.description, plain.schedule, plain.icon, plain.color]).toEqual(["", "", "book", "sage"]);

    const c = (await api("/api/classes", { token: t.token, body: { name: "Styled", description: "  Evening A1 group ", schedule: "Tue 18:00", icon: "flame", color: "sky" } })).json.class;
    expect([c.description, c.schedule, c.icon, c.color]).toEqual(["Evening A1 group", "Tue 18:00", "flame", "sky"]);

    const j = await api("/api/classes/join", { token: s.token, body: { code: c.code, share: true } });
    expect(j.json.class.icon).toBe("flame");
    expect((await api(`/api/classes/${c.id}`, { method: "PATCH", token: s.token, body: { color: "rose" } })).status).toBe(403);

    const u = await api(`/api/classes/${c.id}`, { method: "PATCH", token: t.token, body: { color: "rose", description: "New text" } });
    expect(u.status).toBe(200);
    expect([u.json.class.name, u.json.class.description, u.json.class.schedule, u.json.class.icon, u.json.class.color]).toEqual(["Styled", "New text", "Tue 18:00", "flame", "rose"]);
    const list = (await api("/api/classes", { token: s.token })).json.classes;
    expect(list[0].color).toBe("rose");
  });

  it("rejects an unknown icon or colour and over-long text", async () => {
    const t = await signup("teacher2");
    const bad = async (body: Record<string, unknown>, field: string) => {
      const r = await api("/api/classes", { token: t.token, body: { name: "X" + field, ...body } });
      expect(r.status).toBe(400);
      expect(r.json.error.field).toBe(field);
    };
    await bad({ icon: "skull" }, "icon");
    await bad({ color: "neon" }, "color");
    await bad({ description: "x".repeat(281) }, "description");
    await bad({ schedule: "x".repeat(61) }, "schedule");
  });

  it("lets the owner keep the same name on update but not take another class's name", async () => {
    const t = await signup("teacher3");
    const a = (await api("/api/classes", { token: t.token, body: { name: "One" } })).json.class;
    await api("/api/classes", { token: t.token, body: { name: "Two" } });
    expect((await api(`/api/classes/${a.id}`, { method: "PATCH", token: t.token, body: { name: "One", icon: "bulb" } })).status).toBe(200);
    expect((await api(`/api/classes/${a.id}`, { method: "PATCH", token: t.token, body: { name: "Two" } })).status).toBe(409);
  });
});

describe("class board size", () => {
  it("gives the teacher every member and a member the top 50", async () => {
    const { env } = await import("cloudflare:test");
    const t = await signup("boss1"), s = await signup("pupil1");
    const c = (await api("/api/classes", { token: t.token, body: { name: "Big" } })).json.class;
    await api("/api/classes/join", { token: s.token, body: { code: c.code, share: false } });
    const stmts = [];
    for (let i = 0; i < 60; i++) {
      stmts.push(env.DB.prepare("INSERT INTO users (id, username, pw_hash, pw_salt, pw_iter, recovery_hash, created) VALUES (?, ?, X'00', X'00', 1, X'00', 0)").bind(`bulk${i}`, `bulk${i}`));
      stmts.push(env.DB.prepare("INSERT INTO class_members (class_id, user_id, joined, share) VALUES (?, ?, 0, 0)").bind(c.id, `bulk${i}`));
    }
    await env.DB.batch(stmts);
    expect((await api(`/api/classes/${c.id}/board?week=2026-W41`, { token: t.token })).json.board.length).toBe(62);
    expect((await api(`/api/classes/${c.id}/board?week=2026-W41`, { token: s.token })).json.board.length).toBe(50);
  });
});
