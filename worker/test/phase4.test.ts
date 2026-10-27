import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { backupStep } from "../features/owner/backup.ts";
import { SITE, localParts, reminderPayload, sendReminders } from "../features/reminders/cron.ts";
import { encryptPayload, vapidAuth } from "../features/reminders/webpush.ts";
import { b64url } from "../core/crypto.ts";
import { api, signup } from "./helpers.ts";

async function makeOwner(name = "boss") {
  const s = await signup(name);
  await env.DB.prepare("UPDATE users SET role = 'owner' WHERE id = ?").bind(s.user.id).run();
  return s;
}
const week = "2026-W41";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("owner routes", () => {
  it("answer 403 to a learner and 401 to nobody", async () => {
    const s = await signup("plain");
    for (const p of ["/api/admin/stats", "/api/admin/weak", "/api/admin/backups", "/api/admin/users?q=ab"]) {
      expect((await api(p, { token: s.token })).status).toBe(403);
      expect((await api(p)).status).toBe(401);
    }
    expect((await api("/api/admin/backup", { method: "POST", token: s.token })).status).toBe(403);
  });

  it("stats count the tables", async () => {
    const o = await makeOwner();
    await signup("one");
    const r = await api("/api/admin/stats", { token: o.token });
    expect(r.status).toBe(200);
    expect(r.json.users).toMatchObject({ total: 2, deleted: 0, signups7d: 2 });
    expect(r.json.backup).toBeNull();
  });

  it("backs up on demand and lists it", async () => {
    const o = await makeOwner();
    const r = await api("/api/admin/backup", { method: "POST", token: o.token });
    expect(r.status).toBe(200);
    expect(r.json.rows).toBeGreaterThan(0);
    const list = await api("/api/admin/backups", { token: o.token });
    expect(list.json.backups[0].date).toBe(r.json.date);
    expect((await api("/api/admin/stats", { token: o.token })).json.backup.date).toBe(r.json.date);
  });

  it("lists learners with their details, newest activity first", async () => {
    const o = await makeOwner();
    const a = await signup("detail");
    await api("/api/doc/progress", { method: "PUT", token: a.token, body: { baseRev: 0, body: { v: 5 } } });
    await api("/api/profile", { method: "PUT", token: a.token, body: { week, doc: { v: 1, nick: "Dee", char: null, code: "", following: [o.user.id], xp: 120, xpWeek: { [week]: 40 }, streak: 3, lastDay: "2026-10-06", pos: { lv: "A1", u: 4 }, unitsDone: [], storiesDone: 0, cheers: {}, updatedAt: 1 } } });
    const r = await api("/api/admin/users", { token: o.token });
    expect(r.status).toBe(200);
    expect(r.json.users[0]).toMatchObject({ username: "detail", nick: "Dee", xp: 120, xpWeek: 40, streak: 3, lv: "A1", unit: 4, saves: 1, devices: 1, followers: 0, following: 1, classes: 0, reminders: 0, tz: "Europe/Istanbul" });
    expect(r.json.users[0].progressBytes).toBeGreaterThan(0);
    const boss = r.json.users.find((u: { username: string }) => u.username === "boss");
    expect(boss.followers).toBe(1);
  });

  it("finds users by prefix and undeletes", async () => {
    const o = await makeOwner();
    const u = await signup("zeynep");
    await api("/api/delete", { token: u.token, body: { password: u.password } });
    const f = await api("/api/admin/users?q=zey", { token: o.token });
    expect(f.json.users[0]).toMatchObject({ username: "zeynep" });
    expect(f.json.users[0].deleted).toBeGreaterThan(0);
    expect((await api(`/api/admin/users/${u.user.id}/undelete`, { method: "POST", token: o.token })).status).toBe(200);
    expect((await api("/api/login", { body: { username: "zeynep", password: u.password } })).json.restored).toBeUndefined();
  });
});

describe("the hard-words report", () => {
  it("aggregates the learners' summaries, at most one save a minute each", async () => {
    const o = await makeOwner(), a = await signup("wordsa"), b = await signup("wordsb");
    const w = (cards: unknown[]) => ({ v: 1, at: 1, cards, lessons: [{ id: "g_a1_1_soru", tries: 4, misses: 3 }] });
    await api("/api/doc/progress", { method: "PUT", token: a.token, body: { baseRev: 0, body: { v: 5 }, weak: w([{ id: "a1-w-ekmek", tries: 6, wrong: 4 }]) } });
    await api("/api/doc/progress", { method: "PUT", token: b.token, body: { baseRev: 0, body: { v: 5 }, weak: w([{ id: "a1-w-ekmek", tries: 3, wrong: 2 }, { id: "a1-w-su", tries: 3, wrong: 1 }]) } });
    await wait(1100);
    await api("/api/doc/progress", { method: "PUT", token: a.token, body: { baseRev: 1, body: { v: 5 }, weak: w([{ id: "a1-w-IGNORED", tries: 9, wrong: 9 }]) } });
    const r = await api("/api/admin/weak", { token: o.token });
    expect(r.json.cards[0]).toEqual({ id: "a1-w-ekmek", learners: 2, tries: 9, wrong: 6 });
    expect(r.json.cards.map((c: { id: string }) => c.id)).not.toContain("a1-w-IGNORED");
    expect(r.json.lessons[0]).toMatchObject({ id: "g_a1_1_soru", learners: 2, misses: 6 });
  });

  it("shows the owner of a class the weakest words of members who share", async () => {
    const t = await signup("tch"), s = await signup("stu");
    await api("/api/doc/progress", { method: "PUT", token: s.token, body: { baseRev: 0, body: { v: 5 }, weak: { v: 1, at: 1, cards: [{ id: "a1-w-ekmek", tries: 5, wrong: 4 }], lessons: [] } } });
    const cls = (await api("/api/classes", { token: t.token, body: { name: "W" } })).json.class;
    await api("/api/classes/join", { token: s.token, body: { code: cls.code, share: true } });
    const m = (await api(`/api/classes/${cls.id}/members`, { token: t.token })).json.members.find((x: { username: string }) => x.username === "stu");
    expect(m.weak).toEqual([{ id: "a1-w-ekmek", tries: 5, wrong: 4 }]);
  });
});

describe("push", () => {
  const sub = (endpoint: string, hour = 20) => ({ endpoint, keys: { p256dh: "x".repeat(87), auth: "y".repeat(22) }, tz: "Europe/Istanbul", hour });
  it("subscribes, upserts by endpoint, keeps at most five, and removes", async () => {
    const s = await signup("pusher");
    const first = await api("/api/push", { token: s.token, body: sub("https://push.example/1") });
    expect(first.status).toBe(200);
    expect((await api("/api/push", { token: s.token, body: sub("https://push.example/1", 8) })).json.id).toBe(first.json.id);
    for (let i = 2; i <= 6; i++) await api("/api/push", { token: s.token, body: sub(`https://push.example/${i}`) });
    const list = (await api("/api/push", { token: s.token })).json.subs;
    expect(list).toHaveLength(5);
    expect(list.map((x: { endpoint: string }) => x.endpoint)).not.toContain("https://push.example/1");
    expect((await api(`/api/push/${list[0].id}`, { method: "DELETE", token: s.token })).status).toBe(204);
    expect((await api(`/api/push/${list[0].id}`, { method: "DELETE", token: s.token })).status).toBe(404);
    expect((await api("/api/push", { token: s.token, body: { ...sub("http://insecure"), hour: 3 } })).json.error.code).toBe("invalid");
    expect((await api("/api/push", { token: s.token, body: sub("https://push.example/9", 30) })).json.error.field).toBe("hour");
  });

  it("works out the local hour and day in a time zone", () => {
    expect(localParts(Date.UTC(2026, 9, 6, 17, 30), "Europe/Istanbul")).toEqual({ hour: 20, day: "2026-10-06" });
    expect(localParts(Date.UTC(2026, 9, 6, 22, 0), "Europe/Istanbul")).toEqual({ hour: 1, day: "2026-10-07" });
    expect(localParts(Date.UTC(2026, 9, 6, 22, 0), "Not/AZone").hour).toBe(-1);
  });

  it("links a reminder to the absolute https://turk.shab.boo URL, so the old YaKerim service workers open the new site", () => {
    expect(SITE).toBe("https://turk.shab.boo");
    expect(reminderPayload(0).url).toBe("https://turk.shab.boo/");
    expect(reminderPayload(3)).toMatchObject({ title: "Kerim is waiting", body: "3 day streak — one lesson keeps it.", url: "https://turk.shab.boo/" });
  });

  it("sends nothing without VAPID keys", async () => {
    expect(await sendReminders(env)).toEqual({ sent: 0, removed: 0 });
  });

  it("encrypts a payload the subscriber's key can read, and signs VAPID", async () => {
    const ua = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const uaPub = new Uint8Array(await crypto.subtle.exportKey("raw", ua.publicKey));
    const auth = crypto.getRandomValues(new Uint8Array(16));
    const body = await encryptPayload({ p256dh: b64url(uaPub), auth: b64url(auth) }, JSON.stringify({ title: "hi" }));
    // decrypt as the user agent (RFC 8291)
    const salt = body.slice(0, 16), idLen = body[20], asPub = body.slice(21, 21 + idLen), cipher = body.slice(21 + idLen);
    const enc = new TextEncoder();
    const asKey = await crypto.subtle.importKey("raw", asPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
    const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: asKey }, ua.privateKey, 256));
    const hk = async (s: Uint8Array<ArrayBuffer>, ikm: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>, n: number) => new Uint8Array(await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: s, info }, await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]), n * 8));
    const cat = (...p: Uint8Array<ArrayBuffer>[]) => { const o = new Uint8Array(p.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of p) { o.set(x, i); i += x.length; } return o; };
    const ikm = await hk(auth, shared, cat(enc.encode("WebPush: info\0"), uaPub, asPub), 32);
    const key = await crypto.subtle.importKey("raw", await hk(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16), "AES-GCM", false, ["decrypt"]);
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: await hk(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12) }, key, cipher));
    expect(new TextDecoder().decode(plain.slice(0, -1))).toBe('{"title":"hi"}');
    expect(plain.at(-1)).toBe(2);

    const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
    const pub = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
    const header = await vapidAuth({ ...env, VAPID_PUBLIC: b64url(pub), VAPID_PRIVATE: jwk.d! }, "https://push.example/abc");
    expect(header).toMatch(/^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=/);
    const [h, c, sig] = header.slice(8, header.indexOf(",")).split(".");
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pair.publicKey, Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(sig.length / 4) * 4, "=")), (x) => x.charCodeAt(0)), enc.encode(`${h}.${c}`));
    expect(ok).toBe(true);
    expect(JSON.parse(atob(c.replace(/-/g, "+").replace(/_/g, "/")))).toMatchObject({ aud: "https://push.example" });
  });
});

describe("the paid-tier hook", () => {
  it("answers 402 to the free plan, 501 to a paid one, 401 to nobody", async () => {
    const s = await signup("freebie");
    expect((await api("/api/ai", { token: s.token, body: {} })).json.error.code).toBe("payment_required");
    expect((await api("/api/ai", { body: {} })).status).toBe(401);
    await env.DB.prepare("UPDATE users SET plan = 'pro' WHERE id = ?").bind(s.user.id).run();
    expect((await api("/api/ai", { token: s.token, body: {} })).status).toBe(501);
  });
});

describe("backup covers the new tables", () => {
  it("includes weak and push_subs", async () => {
    await signup("bkup1");
    let m = null;
    for (let i = 0; i < 10 && !m; i++) m = await backupStep(env, "2026-10-07");
    expect(Object.keys(m!.tables)).toEqual(expect.arrayContaining(["weak", "push_subs", "classes", "class_members"]));
  });
  it("is week-key independent", () => expect(week).toMatch(/W41/));
});
