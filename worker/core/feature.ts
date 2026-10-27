// The server feature contract (worker/README.md). A feature's index.ts exports a `feature`; features/index.ts lists them and
// core/registry.ts holds the list. Core knows no feature: everything a feature adds reaches core through this one door.
import type { Env } from "./env.ts";
import type { Route, Ctx } from "./router.ts";
import type { UserRow } from "./session.ts";

/** A private document kind served at /api/doc/:kind (docs/SPECS_SCHEMA.md section 3). */
export interface DocKindSpec {
  /** The largest body, in bytes. */
  limit: number;
  /** The allowed top-level keys. */
  keys: ReadonlySet<string>;
  /** Extra checks on the body; throw an HttpError to refuse it. */
  validate?: (body: Record<string, unknown>) => void;
}

/** What a feature may add to a `PUT /api/doc/:kind` (the hard-words summary, the class-shared book progress rides along with progress). */
export interface DocPut {
  ctx: Ctx;
  userId: string;
  kind: string;
  /** The whole request body: the extras are the fields beside `baseRev` and `body`. */
  extras: Record<string, unknown>;
  now: number;
}

export interface ServerFeature {
  id: string;
  routes?: Route[];
  /** Pages the Worker renders (invite pages): the app with link-preview tags. */
  pages?: Route[];
  docs?: {
    kinds?: Record<string, DocKindSpec>;
    /** Runs after a document was saved. A bad extra is dropped, never an error. */
    onPut?: (put: DocPut) => Promise<void>;
  };
  /** Hourly jobs: run when `when(hourUtc)` is true. Each must be idempotent: a tick that runs twice does no harm. */
  cron?: { when: (hourUtc: number) => boolean; run: (env: Env, time: number) => Promise<unknown> }[];
  /** Part of the 04:00 UTC sweep: every feature's statements run in one batch, in `order` (account's hard delete of users runs last). */
  sweep?: { order: number; statements: (env: Env, now: number) => D1PreparedStatement[] };
  /** What the account export includes (merged into the export's top level) and what deleting the account removes at once (one atomic batch). */
  account?: {
    export?: (who: { user: UserRow; env: Env }) => Promise<Record<string, unknown>>;
    remove?: (who: { user: UserRow; env: Env }) => D1PreparedStatement[];
  };
  /** Rate-limit rules this feature owns; their keys must be unique across features. */
  rules?: Record<string, import("./limits.ts").Rule>;
}
