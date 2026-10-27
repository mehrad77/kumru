import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { api, signup } from "../../test/helpers.ts";

// migration 0005 ran in setup.ts with no `admin` yet; running its statements again is how a deploy after admin exists looks
const rerun = async () => {
  const m = env.TEST_MIGRATIONS.find((x) => x.name.startsWith("0005"));
  if (!m) throw new Error("0005 missing");
  for (const q of m.queries) await env.DB.prepare(q).run();
};

describe("suggested classes (migration 0005)", () => {
  it("adds nothing while admin does not exist", async () => {
    await rerun();
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM classes").first<{ n: number }>())?.n).toBe(0);
  });

  it("adds 504 and 506 owned by admin, joinable by code, and is idempotent", async () => {
    const admin = await signup("admin");
    await rerun();
    await rerun();
    const rows = await env.DB.prepare("SELECT name, code, owner FROM classes ORDER BY name").all<{ name: string; code: string; owner: string }>();
    expect(rows.results.map((r) => [r.name, r.code, r.owner])).toEqual([["504", "YK0504", admin.user.id], ["506", "YK0506", admin.user.id]]);
    const member = await env.DB.prepare("SELECT share FROM class_members WHERE user_id = ?").bind(admin.user.id).all<{ share: number }>();
    expect(member.results.length).toBe(2);
    expect(member.results.every((r) => r.share === 1)).toBe(true);

    const learner = await signup("newbie");
    const j = await api("/api/classes/join", { token: learner.token, body: { code: "YK0504", share: true } });
    expect(j.status).toBe(200);
    expect(j.json.class.name).toBe("504");
    const mine = await api("/api/classes/" + j.json.class.id + "/members", { token: admin.token });
    expect(mine.json.members.some((m: { username?: string }) => m.username === "newbie")).toBe(true);
  });
});
