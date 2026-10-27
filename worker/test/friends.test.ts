import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { BASE, api, signup } from "./helpers.ts";

const WEEK = "2026-W41";
const doc = (nick: string, over: Record<string, unknown> = {}) => ({ v: 1, nick, char: null, code: "", following: [], xp: 10,
  xpWeek: { [WEEK]: 5 }, streak: 1, lastDay: "2026-10-06", pos: null, unitsDone: [], storiesDone: 0, cheers: {}, updatedAt: 1, ...over });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const save = (token: string, d: unknown) => api("/api/profile", { method: "PUT", token, body: { doc: d, week: WEEK } });

describe("friends", () => {
  it("returns me, who I follow, who follows me, the weekly board and their names", async () => {
    const a = await signup("asli"), b = await signup("baran"), c = await signup("cem");
    await save(a.token, doc("Aslı", { following: [b.user.id], xpWeek: { [WEEK]: 30 } }));
    await save(b.token, doc("Baran", { xpWeek: { [WEEK]: 50 } }));
    await save(c.token, doc("Cem", { following: [a.user.id], xpWeek: { "2026-W40": 99 } }));
    const r = await api(`/api/friends?week=${WEEK}`, { token: a.token });
    expect(r.status).toBe(200);
    expect(r.json.me.nick).toBe("Aslı");
    expect(r.json.following).toEqual([b.user.id]);
    expect(r.json.followers).toEqual([c.user.id]);
    expect(r.json.board).toEqual([b.user.id, a.user.id]);
    expect(Object.keys(r.json.profiles).sort()).toEqual([b.user.id, c.user.id].sort());
    expect(r.json.names[c.user.id]).toBe("cem");
  });

  it("shows a character only to mutual follows, unless it is public", async () => {
    const AV = { v: 1, kit: "sahne-kit@1", body: { build: "adult", height: 0.5, shape: "average" }, skin: "skin_04", face: {}, hair: { style: "hair_short", color: "hair_02" }, outfit: {} };
    const a = await signup("hale"), b = await signup("ilker"), c = await signup("jale"), d = await signup("kaan");
    await save(a.token, doc("Hale", { following: [b.user.id, c.user.id, d.user.id] }));
    await save(b.token, doc("İlker", { char: AV, following: [a.user.id] }));          // mutual with Hale
    await save(c.token, doc("Jale", { char: AV }));                                   // Hale follows, Jale does not follow back
    await save(d.token, doc("Kaan", { char: AV, charPublic: true }));                 // public
    const r = await api(`/api/friends?week=${WEEK}`, { token: a.token });
    expect(r.json.profiles[b.user.id].char).toEqual(AV);
    expect(r.json.profiles[c.user.id].char).toBeNull();
    expect(r.json.profiles[d.user.id].char).toEqual(AV);
    const s = await api("/api/profiles/search?q=jale", { token: a.token });
    expect(s.json.profiles[c.user.id].char).toBeNull();
  });

  it("finds a learner by code (even off the board) and by name, and spots my own code", async () => {
    const a = await signup("deniz"), b = await signup("ezgi");
    const mine = (await save(a.token, doc("Deniz"))).json.code;
    const theirs = (await save(b.token, doc("Ezgi Şahin", { xpWeek: {} }))).json.code;
    const byCode = await api(`/api/profiles/search?q=${theirs.toLowerCase()}`, { token: a.token });
    expect(byCode.json.code).toBe(b.user.id);
    expect(byCode.json.profiles[b.user.id].nick).toBe("Ezgi Şahin");
    expect((await api(`/api/profiles/search?q=${mine}`, { token: a.token })).json.self).toBe(true);
    expect((await api("/api/profiles/search?q=sahin", { token: a.token })).json.ids).toEqual([b.user.id]);
    expect((await api("/api/profiles/search?q=ez", { token: a.token })).json.ids).toEqual([]);
  });

  it("names ids and leaves soft-deleted accounts out", async () => {
    const a = await signup("fatih"), b = await signup("gul");
    expect((await api(`/api/users?ids=${b.user.id},nobody`, { token: a.token })).json.names).toEqual({ [b.user.id]: "gul" });
    await api("/api/delete", { token: b.token, body: { password: b.password } });
    expect((await api(`/api/users?ids=${b.user.id}`, { token: a.token })).json.names).toEqual({});
  });

  it("updates follows when the following list changes", async () => {
    const a = await signup("hale"), b = await signup("ilker");
    await save(a.token, doc("Hale", { following: [b.user.id] }));
    expect((await api(`/api/friends?week=${WEEK}`, { token: b.token })).json.followers).toEqual([a.user.id]);
    await wait(1050);
    await save(a.token, doc("Hale", { following: [] }));
    expect((await api(`/api/friends?week=${WEEK}`, { token: b.token })).json.followers).toEqual([]);
  });
});

describe("classes", () => {
  it("create, join by code, board of members only, leave", async () => {
    const t = await signup("teacher"), s = await signup("student"), x = await signup("outsider");
    await save(t.token, doc("Teacher"));
    await save(s.token, doc("Student", { xpWeek: { [WEEK]: 40 } }));
    await save(x.token, doc("Outsider", { xpWeek: { [WEEK]: 90 } }));
    const created = await api("/api/classes", { token: t.token, body: { name: "A1 Tuesday" } });
    expect(created.status).toBe(201);
    const cls = created.json.class;
    expect(cls).toMatchObject({ name: "A1 Tuesday", owner: t.user.id, members: 1, share: true });
    const joined = await api("/api/classes/join", { token: s.token, body: { code: cls.code.toLowerCase(), share: false } });
    expect(joined.json.class.members).toBe(2);
    expect((await api("/api/classes/join", { token: s.token, body: { code: cls.code, share: false } })).status).toBe(200);
    const board = await api(`/api/classes/${cls.id}/board?week=${WEEK}`, { token: s.token });
    expect(board.json.board).toEqual([s.user.id, t.user.id]);
    expect((await api(`/api/classes/${cls.id}/board?week=${WEEK}`, { token: x.token })).status).toBe(403);
    expect((await api(`/api/classes/${cls.id}/leave`, { method: "POST", token: t.token })).status).toBe(403);
    expect((await api(`/api/classes/${cls.id}/leave`, { method: "POST", token: s.token })).status).toBe(204);
    expect((await api("/api/classes", { token: s.token })).json.classes).toEqual([]);
  });

  it("the teacher view shows details only for members who opted in", async () => {
    const t = await signup("hoca"), s1 = await signup("ogr1"), s2 = await signup("ogr2");
    await save(s1.token, doc("Bir", { pos: { lv: "A1", u: 3 }, streak: 4 }));
    await save(s2.token, doc("Iki", { pos: { lv: "A2", u: 1 }, streak: 9 }));
    const cls = (await api("/api/classes", { token: t.token, body: { name: "Hoca" } })).json.class;
    await api("/api/classes/join", { token: s1.token, body: { code: cls.code, share: true } });
    await api("/api/classes/join", { token: s2.token, body: { code: cls.code, share: false } });
    const r = await api(`/api/classes/${cls.id}/members`, { token: t.token });
    const by = Object.fromEntries(r.json.members.map((m: { username: string }) => [m.username, m]));
    expect(by.ogr1).toMatchObject({ share: true, pos: { lv: "A1", u: 3 }, streak: 4 });
    expect(by.ogr2).toEqual({ id: s2.user.id, username: "ogr2", nick: "Iki", joined: expect.any(Number), share: false, shareBook: false });
    expect((await api(`/api/classes/${cls.id}/members`, { token: s1.token })).status).toBe(403);
    await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: s2.token, body: { share: true } });
    expect((await api(`/api/classes/${cls.id}/members`, { token: t.token })).json.members.find((m: { username: string }) => m.username === "ogr2").pos).toEqual({ lv: "A2", u: 1 });
  });

  it("only the owner renames, removes members and deletes", async () => {
    const t = await signup("sahip"), s = await signup("uye");
    const cls = (await api("/api/classes", { token: t.token, body: { name: "Old" } })).json.class;
    await api("/api/classes/join", { token: s.token, body: { code: cls.code, share: false } });
    expect((await api(`/api/classes/${cls.id}`, { method: "PATCH", token: s.token, body: { name: "Mine" } })).status).toBe(403);
    expect((await api(`/api/classes/${cls.id}`, { method: "PATCH", token: t.token, body: { name: "New" } })).json.class.name).toBe("New");
    expect((await api(`/api/classes/${cls.id}/members/${t.user.id}`, { method: "DELETE", token: t.token })).status).toBe(403);
    expect((await api(`/api/classes/${cls.id}/members/${s.user.id}`, { method: "DELETE", token: t.token })).status).toBe(204);
    expect((await api(`/api/classes/${cls.id}`, { method: "DELETE", token: t.token })).status).toBe(204);
    expect((await api("/api/classes/join", { token: s.token, body: { code: cls.code, share: false } })).status).toBe(404);
  });
});

describe("invite pages", () => {
  it("serve the page with a preview naming the inviter", async () => {
    const a = await signup("davet");
    const code = (await save(a.token, doc("Davetçi"))).json.code;
    const r = await SELF.fetch(`${BASE}/f/${code}`);
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('property="og:title" content="Davetçi invites you to Kumru"');
    expect(html).toContain("<title>Kumru");
    const unknown = await (await SELF.fetch(`${BASE}/c/ZZZZZZ`)).text();
    expect(unknown).toContain("Join a class on Kumru");
  });

  it("serve /@username with the learner's name, and the plain page for an unknown one", async () => {
    const a = await signup("linkme");
    await save(a.token, doc("Linkli"));
    const html = await (await SELF.fetch(`${BASE}/@linkme`)).text();
    expect(html).toContain('property="og:title" content="Linkli on Kumru"');
    const upper = await SELF.fetch(`${BASE}/@LinkMe`);
    expect((await upper.text())).toContain("Linkli on Kumru");
    const none = await SELF.fetch(`${BASE}/@nobody.here`);
    expect(none.status).toBe(200);
    expect(await none.text()).toContain("Learn Turkish with Kumru");
  });

  it("find exactly one learner for @username in search", async () => {
    const a = await signup("exact1"), b = await signup("exact12");
    await save(b.token, doc("Other"));
    const r = await api("/api/profiles/search?q=@exact12", { token: a.token });
    expect(r.status).toBe(200);
    expect(r.json.ids).toEqual([b.user.id]);
    expect((await api("/api/profiles/search?q=@exact1", { token: a.token })).json.self).toBe(true);
    expect((await api("/api/profiles/search?q=@nope", { token: a.token })).json.ids).toEqual([]);
  });
});
