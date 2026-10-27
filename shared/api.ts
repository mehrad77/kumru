/* The HTTP contract of the yakerim Worker (docs/SPECS_API.md section 14, kept identical to it): every route's request and
   response types and the error-code union. The Worker and the client both import it; a route added without a type here does not
   compile. Each feature's types live in its own file (shared/<feature>.ts, the same id as app/features/<feature> and
   worker/features/<feature>); this file only re-exports them, so older imports keep working. */
export * from "./core.ts";
export * from "./account.ts";
export type { DocKind, DocGet, DocPut, DocPutOk, WeakCard, WeakDoc } from "./progress.ts";
export * from "./friends.ts";
export * from "./classes.ts";
export * from "./reminders.ts";
export * from "./owner.ts";
export * from "./yeni.ts";
