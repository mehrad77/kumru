import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { backupStep } from "../features/owner/backup.ts";
import { sweep } from "../core/sweep.ts";
import { api, signup } from "./helpers.ts";

describe("sweep", () => {
  it("purges accounts deleted more than 7 days ago, with their rows", async () => {
    const s = await signup("gone");
    await api("/api/doc/progress", { method: "PUT", token: s.token, body: { baseRev: 0, body: { v: 5 } } });
    await env.DB.prepare("UPDATE users SET deleted = ? WHERE id = ?").bind(Date.now() - 8 * 86_400_000, s.user.id).run();
    await sweep(env);
    expect(await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first("n")).toBe(0);
    expect(await env.DB.prepare("SELECT COUNT(*) AS n FROM docs").first("n")).toBe(0);
  });
});

describe("backup", () => {
  it("copies every table to R2 and marks the day complete", async () => {
    await signup("bee1");
    await signup("bee2");
    let manifest = null;
    for (let i = 0; i < 10 && !manifest; i++) manifest = await backupStep(env, "2026-10-06");
    expect(manifest).not.toBeNull();
    expect(manifest!.tables.users.rows).toBe(2);
    expect(manifest!.tables.sessions.rows).toBe(2);
    const part = await env.BACKUPS.get("backups/2026-10-06/users.000.jsonl");
    const rows = (await part!.text()).trim().split("\n").map((l) => JSON.parse(l));
    expect(rows[0].pw_hash).toHaveProperty("$b64");
    expect(await backupStep(env, "2026-10-06")).toBeNull();
    expect(await env.BACKUPS.head("backups/2026-10-06/state.json")).toBeNull();
  });
});
