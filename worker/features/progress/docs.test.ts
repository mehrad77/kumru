import { describe, expect, it } from "vitest";
import { api, signup } from "../../test/helpers.ts";

const put = (token: string, baseRev: number, body: unknown, kind = "progress") =>
  api(`/api/doc/${kind}`, { method: "PUT", token, body: { baseRev, body } });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("documents with revisions", () => {
  it("starts empty, stores rev 1, then rev 2 against the right baseRev", async () => {
    const s = await signup();
    expect((await api("/api/doc/progress", { token: s.token })).json).toEqual({ rev: 0, updated: 0, body: null });
    expect((await put(s.token, 0, { v: 5, xp: 1 })).json.rev).toBe(1);
    await wait(1050);
    expect((await put(s.token, 1, { v: 5, xp: 2 })).json.rev).toBe(2);
    expect((await api("/api/doc/progress", { token: s.token })).json).toMatchObject({ rev: 2, body: { xp: 2 } });
  });

  it("answers 409 with the server copy when baseRev is behind", async () => {
    const s = await signup();
    await put(s.token, 0, { v: 5, xp: 10 });
    await wait(1050);
    const r = await put(s.token, 0, { v: 5, xp: 3 });
    expect(r.status).toBe(409);
    expect(r.json.error).toMatchObject({ code: "conflict", rev: 1, body: { xp: 10 } });
  });

  it("answers 304 to a pull with the current rev", async () => {
    const s = await signup();
    await put(s.token, 0, { v: 5 });
    expect((await api("/api/doc/progress?since=1", { token: s.token })).status).toBe(304);
    expect((await api("/api/doc/progress?since=0", { token: s.token })).status).toBe(200);
  });

  it("enforces the minimum interval between saves", async () => {
    const s = await signup();
    await put(s.token, 0, { v: 5 });
    const r = await put(s.token, 1, { v: 5 });
    expect(r.status).toBe(429);
    expect(r.json.error.retryAfter).toBe(1);
  });

  it("rejects unknown fields, old versions, bad kinds and oversized bodies", async () => {
    const s = await signup();
    expect((await put(s.token, 0, { v: 5, hack: 1 })).json.error.code).toBe("invalid");
    expect((await put(s.token, 0, { v: 3 })).json.error.code).toBe("invalid");
    expect((await put(s.token, 0, { mistakes: [] }, "tutor")).status).toBe(200);
    expect((await put(s.token, 0, {}, "journal")).status).toBe(404);
    expect((await put(s.token, 0, { v: 5, nick: "x".repeat(300_000) })).json.error.code).toBe("too_large");
  });

  it("checks the character (shared/char.ts)", async () => {
    const AV = { v: 1, kit: "sahne-kit@1", body: { build: "adult", height: 0.5, shape: "average" }, skin: "skin_04", face: {},
      hair: { style: "hair_short", color: "hair_02" }, outfit: { top: { id: "top_tee" } } };
    const ok: unknown[] = [null, { skin: 2, hair: 3 }, AV, { ...AV, outfit: { top: { id: "top_from_a_later_kit" } } }];
    const bad: unknown[] = [{ skin: "x" }, { ...AV, pad: "x".repeat(2100) }, { ...AV, outfit: { top: { id: "top_shirt_uniform" } } },
      { ...AV, wear: { waist: { id: "apron_pockets" } } }, { ...AV, custom: [] }, { ...AV, kit: "other-kit@1" }];
    const s = await signup();
    for (const char of bad) {
      const r = await put(s.token, 0, { v: 5, char });
      expect(r.json.error, JSON.stringify(char).slice(0, 80)).toMatchObject({ code: "invalid", field: "char" });
    }
    let rev = 0;
    for (const char of ok) {
      if (rev) await wait(1050);
      const r = await put(s.token, rev, { v: 5, char });
      expect(r.status, JSON.stringify(char).slice(0, 80)).toBe(200);
      rev = r.json.rev;
    }
  });

  it("keeps each learner's documents to themselves", async () => {
    const a = await signup(), b = await signup();
    await put(a.token, 0, { v: 5, xp: 99 });
    expect((await api("/api/doc/progress", { token: b.token })).json.body).toBeNull();
  });
});

describe("profile", () => {
  const doc = (over: Record<string, unknown> = {}) => ({ v: 1, nick: "Şükrü", char: null, code: "ABC234", following: [], xp: 50,
    xpWeek: { "2026-W41": 20 }, streak: 2, lastDay: "2026-10-06", pos: null, unitsDone: [], storiesDone: 0, cheers: {}, updatedAt: 1, ...over });

  it("keeps the first friend code forever and derives follows", async () => {
    const a = await signup(), b = await signup();
    const r = await api("/api/profile", { method: "PUT", token: a.token, body: { doc: doc({ following: [b.user.id, "nobody"] }), week: "2026-W41" } });
    expect(r.status).toBe(200);
    expect(r.json.code).toBe("ABC234");
    const taken = await api("/api/profile", { method: "PUT", token: b.token, body: { doc: doc(), week: "2026-W41" } });
    expect(taken.json.code).not.toBe("ABC234");
    await wait(1050);
    const again = await api("/api/profile", { method: "PUT", token: a.token, body: { doc: doc({ code: "ZZZ999" }), week: "2026-W41" } });
    expect(again.json.code).toBe("ABC234");
    expect(again.json.doc.code).toBe("ABC234");
  });

  it("validates the document", async () => {
    const a = await signup();
    expect((await api("/api/profile", { method: "PUT", token: a.token, body: { doc: doc({ v: 2 }), week: "2026-W41" } })).json.error.code).toBe("invalid");
    expect((await api("/api/profile", { method: "PUT", token: a.token, body: { doc: doc({ nick: "x".repeat(31) }), week: "2026-W41" } })).json.error.field).toBe("nick");
    expect((await api("/api/profile", { method: "PUT", token: a.token, body: { doc: doc(), week: "41" } })).json.error.field).toBe("week");
  });

  it("stores a character the rules refuse as none, and keeps a good one", async () => {
    const a = await signup(), b = await signup();
    const AV = { v: 1, kit: "sahne-kit@1", body: { build: "adult", height: 0.5, shape: "average" }, skin: "skin_04", face: {},
      hair: { style: "hair_short", color: "hair_02" }, outfit: {} };
    const cast = await api("/api/profile", { method: "PUT", token: a.token, body: { doc: doc({ char: { ...AV, wear: { waist: { id: "apron_pockets" } } } }), week: "2026-W41" } });
    expect(cast.status).toBe(200);
    expect(cast.json.doc.char).toBeNull();
    const good = await api("/api/profile", { method: "PUT", token: b.token, body: { doc: doc({ code: "XYZ234", char: AV }), week: "2026-W41" } });
    expect(good.json.doc.char).toEqual(AV);
  });
});
