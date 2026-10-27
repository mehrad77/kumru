// The registered server features, and what core derives from them (routes, pages, document kinds, jobs, sweep, export). The Worker
// entry registers the list once; everything else asks here, so core never imports a feature.
import { HttpError } from "./http.ts";
import type { DocKindSpec, DocPut, ServerFeature } from "./feature.ts";
import type { Env } from "./env.ts";
import type { Route } from "./router.ts";
import type { UserRow } from "./session.ts";

let list: ServerFeature[] = [];

export function setFeatures(features: ServerFeature[]): void {
  const seen = new Set<string>();
  for (const f of features) {
    if (seen.has(f.id)) throw new Error("feature registered twice: " + f.id);
    seen.add(f.id);
  }
  list = features;
}

export const features = (): ServerFeature[] => list;
export const routesOf = (): Route[] => list.flatMap((f) => f.routes ?? []);
export const pagesOf = (): Route[] => list.flatMap((f) => f.pages ?? []);

export function docKind(kind: string): DocKindSpec {
  for (const f of list) { const k = f.docs?.kinds?.[kind]; if (k) return k; }
  throw new HttpError("not_found", "No such document.");
}

export async function afterDocPut(put: DocPut): Promise<void> {
  for (const f of list) await f.docs?.onPut?.(put);
}

/** Every feature's sweep statements, in order, with core's own (the rate-limit windows) at 30. */
export function sweepStatements(env: Env, now: number, core: { order: number; statements: D1PreparedStatement[] }): D1PreparedStatement[] {
  const parts = [core, ...list.flatMap((f) => (f.sweep ? [{ order: f.sweep.order, statements: f.sweep.statements(env, now) }] : []))];
  return parts.sort((a, b) => a.order - b.order).flatMap((p) => p.statements);
}

/** The hourly jobs due at this UTC hour. */
export function cronJobs(hourUtc: number): ServerFeature["cron"] {
  return list.flatMap((f) => (f.cron ?? []).filter((j) => j.when(hourUtc)));
}

/** What every feature adds to the account export, merged into one object. */
export async function accountExport(who: { user: UserRow; env: Env }): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const f of list) if (f.account?.export) Object.assign(out, await f.account.export(who));
  return out;
}

/** The statements every feature wants run when an account is deleted (they join one atomic batch). */
export const accountRemoval = (who: { user: UserRow; env: Env }): D1PreparedStatement[] =>
  list.flatMap((f) => f.account?.remove?.(who) ?? []);
