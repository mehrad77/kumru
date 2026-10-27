/* Book progress for classes (docs/SPECS_SCHEMA.md 2.10b, docs/SPECS_API.md sections 5 and 7): share_book, the `book` row that rides along with a
   progress save, and the teacher view. */
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { api, signup } from "./helpers.ts";

const BOOK = { v: 1, at: 1_700_000_000_000, units: { A1_1: { d: 1, p: 1, s: [10, 9, 12] }, A1_3: { d: 0, p: 0.4, s: [2, 1, 14] } }, last: { ref: "A1_3", at: 1_700_000_100_000 } };

/** Save progress with a book summary, letting the 1 s save interval and the one-a-minute book interval pass first. */
async function save(token: string, userId: string, book: unknown, baseRev?: number) {
  await env.DB.prepare("UPDATE docs SET updated = updated - 5000 WHERE user_id = ?").bind(userId).run();
  await env.DB.prepare("UPDATE book SET updated = updated - 120000 WHERE user_id = ?").bind(userId).run();
  const rev = baseRev ?? ((await api("/api/doc/progress", { token })).json.rev as number);
  return api("/api/doc/progress", { method: "PUT", token, body: { baseRev: rev, body: { v: 5 }, ...(book === undefined ? {} : { book }) } });
}
const bookRow = (id: string) => env.DB.prepare("SELECT body, updated FROM book WHERE user_id = ?").bind(id).first<{ body: string; updated: number }>();
const members = async (token: string, classId: string) =>
  (await api(`/api/classes/${classId}/members`, { token })).json.members as Array<Record<string, unknown> & { username: string }>;

async function classWith(names: string[]) {
  const t = await signup(names[0] + "t");
  const cls = (await api("/api/classes", { token: t.token, body: { name: "Book " + names[0] } })).json.class;
  const students = [];
  for (const n of names) {
    const s = await signup(n);
    await api("/api/classes/join", { token: s.token, body: { code: cls.code, share: true } });
    students.push(s);
  }
  return { t, cls, students };
}

describe("share_book on a class membership", () => {
  it("starts off on join, is toggled alone or with share, and shows in the class lists", async () => {
    const { t, cls, students: [s] } = await classWith(["bk1"]);
    expect(cls.shareBook).toBe(false);
    const list = (await api("/api/classes", { token: s.token })).json.classes;
    expect(list[0]).toMatchObject({ share: true, shareBook: false });
    expect((await env.DB.prepare("SELECT share_book FROM class_members WHERE user_id = ?").bind(s.user.id).first<number>("share_book"))).toBe(0);

    const on = await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: s.token, body: { shareBook: true } });
    expect(on.status).toBe(200);
    expect(on.json.class).toMatchObject({ share: true, shareBook: true });
    const both = await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: s.token, body: { share: false } });
    expect(both.json.class).toMatchObject({ share: false, shareBook: true });   // a missing field keeps its value
    expect((await api("/api/classes", { token: s.token })).json.classes[0]).toMatchObject({ share: false, shareBook: true });
    const off = await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: s.token, body: { share: true, shareBook: false } });
    expect(off.json.class).toMatchObject({ share: true, shareBook: false });
    // a teacher always shares; their own book switch is separate
    expect((await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: t.token, body: { share: false } })).json.class.share).toBe(true);
  });

  it("needs at least one boolean", async () => {
    const { cls, students: [s] } = await classWith(["bk2"]);
    const p = (body: unknown) => api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: s.token, body });
    expect((await p({})).status).toBe(400);
    expect((await p({ shareBook: "yes" })).json.error.field).toBe("shareBook");
    expect((await p({ share: 1 })).json.error.field).toBe("share");
  });

  it("is not set by a join, even a repeat one", async () => {
    const t = await signup("bk3t"), s = await signup("bk3");
    const cls = (await api("/api/classes", { token: t.token, body: { name: "J" } })).json.class;
    const j = await api("/api/classes/join", { token: s.token, body: { code: cls.code, share: true, shareBook: true } });
    expect(j.json.class.shareBook).toBe(false);
  });
});

describe("the book summary on a progress save", () => {
  it("is stored only while the learner shares it with a class, and never parsed", async () => {
    const { cls, students: [s] } = await classWith(["bk4"]);
    expect((await save(s.token, s.user.id, BOOK, 0)).status).toBe(200);
    expect(await bookRow(s.user.id)).toBeNull();                      // not sharing: dropped
    await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: s.token, body: { shareBook: true } });
    expect((await save(s.token, s.user.id, BOOK)).status).toBe(200);
    expect(JSON.parse((await bookRow(s.user.id))!.body)).toEqual(BOOK);
  });

  it("drops a book that is not an object or is over 4 KB, without failing the save", async () => {
    const { cls, students: [s] } = await classWith(["bk5"]);
    await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: s.token, body: { shareBook: true } });
    expect((await save(s.token, s.user.id, [1, 2], 0)).status).toBe(200);
    expect((await save(s.token, s.user.id, "text")).status).toBe(200);
    expect((await save(s.token, s.user.id, { ...BOOK, pad: "x".repeat(4097) })).status).toBe(200);
    expect(await bookRow(s.user.id)).toBeNull();
    const edge = { v: 1, pad: "" };
    edge.pad = "x".repeat(4096 - JSON.stringify(edge).length);
    expect(JSON.stringify(edge).length).toBe(4096);
    expect((await save(s.token, s.user.id, edge)).status).toBe(200);
    expect(await bookRow(s.user.id)).not.toBeNull();
  });

  it("is stored at most once a minute", async () => {
    const { cls, students: [s] } = await classWith(["bk6"]);
    await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: s.token, body: { shareBook: true } });
    await save(s.token, s.user.id, BOOK, 0);
    const first = (await bookRow(s.user.id))!;
    // a second save a few seconds later: the progress document takes it, the book is skipped
    await env.DB.prepare("UPDATE docs SET updated = updated - 5000 WHERE user_id = ?").bind(s.user.id).run();
    const r = await api("/api/doc/progress", { method: "PUT", token: s.token, body: { baseRev: 1, body: { v: 5 }, book: { ...BOOK, at: 2 } } });
    expect(r.status).toBe(200);
    expect(JSON.parse((await bookRow(s.user.id))!.body).at).toBe(BOOK.at);
    expect((await bookRow(s.user.id))!.updated).toBe(first.updated);
    // after a minute it is replaced
    await save(s.token, s.user.id, { ...BOOK, at: 3 });
    expect(JSON.parse((await bookRow(s.user.id))!.body).at).toBe(3);
  });

  it("is removed when the learner stops sharing, leaves, or is removed from their last sharing class", async () => {
    const { t, cls, students: [a, b, c] } = await classWith(["bk7a", "bk7b", "bk7c"]);
    for (const s of [a, b, c]) {
      await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: s.token, body: { shareBook: true } });
      await save(s.token, s.user.id, BOOK, 0);
      expect(await bookRow(s.user.id)).not.toBeNull();
    }
    await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: a.token, body: { shareBook: false } });
    expect(await bookRow(a.user.id)).toBeNull();
    await api(`/api/classes/${cls.id}/leave`, { method: "POST", token: b.token });
    expect(await bookRow(b.user.id)).toBeNull();
    await api(`/api/classes/${cls.id}/members/${c.user.id}`, { method: "DELETE", token: t.token });
    expect(await bookRow(c.user.id)).toBeNull();
  });

  it("is kept while another class still has the switch on, and swept after a class is deleted", async () => {
    const t1 = await signup("bk8t1"), t2 = await signup("bk8t2"), s = await signup("bk8");
    const c1 = (await api("/api/classes", { token: t1.token, body: { name: "One" } })).json.class;
    const c2 = (await api("/api/classes", { token: t2.token, body: { name: "Two" } })).json.class;
    for (const c of [c1, c2]) {
      await api("/api/classes/join", { token: s.token, body: { code: c.code, share: true } });
      await api(`/api/classes/${c.id}/me`, { method: "PATCH", token: s.token, body: { shareBook: true } });
    }
    await save(s.token, s.user.id, BOOK, 0);
    await api(`/api/classes/${c1.id}/me`, { method: "PATCH", token: s.token, body: { shareBook: false } });
    expect(await bookRow(s.user.id)).not.toBeNull();
    await api(`/api/classes/${c2.id}`, { method: "DELETE", token: t2.token });
    const { sweep } = await import("../core/sweep.ts");
    await sweep(env);
    expect(await bookRow(s.user.id)).toBeNull();
  });
});

describe("the teacher view of book progress", () => {
  it("gives book only for members with share_book on, and only to the owner", async () => {
    const { t, cls, students: [a, b, c] } = await classWith(["bk9a", "bk9b", "bk9c"]);
    await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: a.token, body: { shareBook: true } });
    await save(a.token, a.user.id, BOOK, 0);
    // b has a stored row from an earlier time but has switched off in this class: it must not show (the row is forced in directly)
    await env.DB.prepare("INSERT INTO book (user_id, body, updated) VALUES (?, ?, 1)").bind(b.user.id, JSON.stringify({ v: 1, units: { A1_1: { d: 1, p: 1, s: [1, 1, 1] } } })).run();
    // c shares book but has not synced anything yet
    await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: c.token, body: { shareBook: true } });

    const ms = await members(t.token, cls.id);
    const by = Object.fromEntries(ms.map((m) => [m.username, m]));
    expect(by.bk9a).toMatchObject({ share: true, shareBook: true, book: BOOK });
    expect(by.bk9b).toMatchObject({ share: true, shareBook: false });
    expect(by.bk9b).not.toHaveProperty("book");
    expect(by.bk9c).toMatchObject({ shareBook: true });
    expect(by.bk9c).not.toHaveProperty("book");
    expect(by.bk9at).toMatchObject({ shareBook: false });    // the teacher row
    expect((await api(`/api/classes/${cls.id}/members`, { token: a.token })).status).toBe(403);
    expect((await api(`/api/classes/${cls.id}/members`)).status).toBe(401);
  });

  it("shows book progress without the place and streak when only the book switch is on", async () => {
    const { t, cls, students: [a] } = await classWith(["bk10"]);
    await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: a.token, body: { share: false, shareBook: true } });
    await save(a.token, a.user.id, BOOK, 0);
    const m = (await members(t.token, cls.id)).find((x) => x.username === "bk10")!;
    expect(m).toMatchObject({ share: false, shareBook: true, book: BOOK });
    expect(m).not.toHaveProperty("pos");
    expect(m).not.toHaveProperty("weak");
  });

  it("reads every member's book in one query", async () => {
    const { t, cls, students } = await classWith(["bk11a", "bk11b", "bk11c", "bk11d"]);
    for (const s of students) {
      await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: s.token, body: { shareBook: true } });
      await save(s.token, s.user.id, BOOK, 0);
    }
    // count prepared statements that touch `book` while the members route runs
    const prepare = env.DB.prepare.bind(env.DB);
    const seen: string[] = [];
    (env.DB as unknown as { prepare: (q: string) => unknown }).prepare = (q: string) => { if (/\bbook\b/i.test(q)) seen.push(q); return prepare(q); };
    try {
      const r = await api(`/api/classes/${cls.id}/members`, { token: t.token });
      expect(r.status).toBe(200);
      expect(r.json.members.filter((m: { book?: unknown }) => m.book).length).toBe(4);
    } finally {
      (env.DB as unknown as { prepare: unknown }).prepare = prepare;
    }
    expect(seen.length).toBe(1);
  });
});

describe("export and delete", () => {
  it("exports the learner's own book and the per-class switch", async () => {
    const { cls, students: [s] } = await classWith(["bk12"]);
    await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: s.token, body: { shareBook: true } });
    await save(s.token, s.user.id, BOOK, 0);
    const x = (await api("/api/export", { token: s.token })).json;
    expect(x.book).toEqual({ updated: expect.any(Number), body: BOOK });
    expect(x.classes[0]).toMatchObject({ share: true, shareBook: true });
    const none = (await api("/api/export", { token: (await signup("bk12b")).token })).json;
    expect(none.book).toBeNull();
  });

  it("cascades the book row when the account is purged", async () => {
    const { cls, students: [s] } = await classWith(["bk13"]);
    await api(`/api/classes/${cls.id}/me`, { method: "PATCH", token: s.token, body: { shareBook: true } });
    await save(s.token, s.user.id, BOOK, 0);
    await api("/api/delete", { token: s.token, body: { password: s.password } });
    await env.DB.prepare("UPDATE users SET deleted = ? WHERE id = ?").bind(Date.now() - 8 * 86_400_000, s.user.id).run();
    const { sweep } = await import("../core/sweep.ts");
    await sweep(env);
    expect(await bookRow(s.user.id)).toBeNull();
    expect(await env.DB.prepare("SELECT COUNT(*) AS n FROM class_members WHERE user_id = ?").bind(s.user.id).first("n")).toBe(0);
  });
});
