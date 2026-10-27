/* Typed D1 helpers (docs/SPECS_SCHEMA.md section 1). Each D1 failure caused by a free-plan daily cap becomes
   503 quota_exceeded, so the client keeps its dirty flag and retries. */
import { HttpError } from "./http.ts";

export type Row = Record<string, unknown>;

function wrap(e: unknown): never {
  const msg = String(e);
  if (/limit|quota|exceeded/i.test(msg) && !/SQLITE_CONSTRAINT/.test(msg)) {
    throw new HttpError("quota_exceeded", "The database's daily limit was reached; try again after 00:00 UTC.", { retryAfter: 3600 });
  }
  throw e;
}

export async function first<T = Row>(db: D1Database, sql: string, ...args: unknown[]): Promise<T | null> {
  try { return await db.prepare(sql).bind(...args).first<T>(); } catch (e) { return wrap(e); }
}

export async function all<T = Row>(db: D1Database, sql: string, ...args: unknown[]): Promise<T[]> {
  try { return (await db.prepare(sql).bind(...args).all<T>()).results; } catch (e) { return wrap(e); }
}

export async function run(db: D1Database, sql: string, ...args: unknown[]): Promise<D1Result> {
  try { return await db.prepare(sql).bind(...args).run(); } catch (e) { return wrap(e); }
}

export async function batch(db: D1Database, stmts: D1PreparedStatement[]): Promise<D1Result[]> {
  try { return await db.batch(stmts); } catch (e) { return wrap(e); }
}

export function isUniqueViolation(e: unknown): boolean {
  return /UNIQUE constraint failed/i.test(String(e));
}

/** D1 binds at most 100 parameters per statement: split id lists. */
export function chunks<T>(list: T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export const marks = (n: number) => Array.from({ length: n }, () => "?").join(",");
