/* GET and PUT /api/doc/:kind (docs/SPECS_API.md section 5): the private documents, stored with a revision.
   The Worker never merges: a stale baseRev gets 409 with the current document and the client merges. */
import type { DocGet, DocPutOk, DocKind } from "../../../shared/api.ts";
import type { DocKindSpec } from "../../core/feature.ts";
import { afterDocPut, docKind } from "../../core/registry.ts";
import { requireUser } from "../../core/session.ts";
import { readJson } from "../../core/body.ts";
import { first, run } from "../../core/db.ts";
import { HttpError, json } from "../../core/http.ts";
import type { Ctx } from "../../core/router.ts";

const MIN_INTERVAL = 1000;

interface DocRow { body: string; rev: number; updated: number }

/** The kind in the URL, if some feature serves it (the progress and tutor features do; the reader's notebook has its own routes). */
function kindOf(ctx: Ctx): { kind: DocKind; spec: DocKindSpec } {
  const kind = ctx.params.kind as DocKind;
  return { kind, spec: docKind(kind) };
}

const current = (ctx: Ctx, userId: string, kind: string) =>
  first<DocRow>(ctx.env.DB, "SELECT body, rev, updated FROM docs WHERE user_id = ? AND kind = ?", userId, kind);

function conflict(row: DocRow | null): never {
  throw new HttpError("conflict", "Your copy is behind.", {
    rev: row?.rev ?? 0, updated: row?.updated ?? 0, body: row ? JSON.parse(row.body) : null,
  });
}

export async function getDoc(ctx: Ctx): Promise<Response> {
  const { kind } = kindOf(ctx);
  const { user } = await requireUser(ctx);
  const row = await current(ctx, user.id, kind);
  const since = ctx.url.searchParams.get("since");
  if (row && since !== null && Number(since) === row.rev) return new Response(null, { status: 304, headers: { "Cache-Control": "no-store" } });
  const out: DocGet = row ? { rev: row.rev, updated: row.updated, body: JSON.parse(row.body) } : { rev: 0, updated: 0, body: null };
  return json(out);
}

export async function putDoc(ctx: Ctx): Promise<Response> {
  const { kind, spec } = kindOf(ctx);
  const { user } = await requireUser(ctx);
  const o = await readJson<Record<string, unknown> & { baseRev?: unknown; body?: unknown }>(ctx.req, spec.limit + 16 * 1024);
  const baseRev = o.baseRev;
  if (!Number.isInteger(baseRev) || (baseRev as number) < 0) throw new HttpError("invalid", "baseRev must be a revision.", { field: "baseRev" });
  const body = o.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError("invalid", "body must be an object.", { field: "body" });
  const bad = Object.keys(body).find((k) => !spec.keys.has(k));
  if (bad) throw new HttpError("invalid", `body has an unknown field ${bad}.`, { field: "body" });
  spec.validate?.(body as Record<string, unknown>);
  const text = JSON.stringify(body);
  if (new TextEncoder().encode(text).length > spec.limit) throw new HttpError("too_large", "The document is too large.");

  const now = Date.now();
  const row = await current(ctx, user.id, kind);
  if (row && now - row.updated < MIN_INTERVAL) throw new HttpError("rate_limited", "Saving too fast.", { retryAfter: 1 });
  if ((row?.rev ?? 0) !== baseRev) conflict(row);
  const r = row
    ? await run(ctx.env.DB, "UPDATE docs SET body = ?, rev = rev + 1, updated = ? WHERE user_id = ? AND kind = ? AND rev = ?",
      text, now, user.id, kind, baseRev)
    : await run(ctx.env.DB, "INSERT INTO docs (user_id, kind, body, rev, updated) VALUES (?, ?, ?, 1, ?) ON CONFLICT DO NOTHING",
      user.id, kind, text, now);
  if (!r.meta.changes) conflict(await current(ctx, user.id, kind));
  await afterDocPut({ ctx, userId: user.id, kind, extras: o, now });
  const out: DocPutOk = { rev: (baseRev as number) + 1, updated: now };
  return json(out);
}

/** The hard-words summary that rides along (docs/SPECS_SCHEMA.md section 3.4): at most 8 KB, at most once a minute, and a bad one is dropped, not an error. */
export async function saveWeak(ctx: Ctx, userId: string, weak: unknown, now: number): Promise<void> {
  const w = weak as { v?: unknown; cards?: unknown; lessons?: unknown };
  if (!w || typeof w !== "object" || w.v !== 1 || !Array.isArray(w.cards) || !Array.isArray(w.lessons)) return;
  const text = JSON.stringify({ v: 1, at: now, cards: w.cards.slice(0, 50), lessons: w.lessons.slice(0, 20) });
  if (new TextEncoder().encode(text).length > 8192) return;
  const prev = await first<{ updated: number }>(ctx.env.DB, "SELECT updated FROM weak WHERE user_id = ?", userId);
  if (prev && now - prev.updated < 60_000) return;
  await run(ctx.env.DB, "INSERT INTO weak (user_id, body, updated) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET body = excluded.body, updated = excluded.updated", userId, text, now);
}
