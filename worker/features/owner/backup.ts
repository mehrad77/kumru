/* The nightly backup to R2 (docs/SPECS.md section 10.8, docs/SPECS_SCHEMA.md section 5). A cron run on the free
   plan gets 10 ms of CPU, so the backup is resumable: each hourly tick from 03:00 UTC copies a bounded
   number of rows and records where it stopped in backups/<date>/state.json; the tick that finishes the
   last table writes manifest.json, which marks the folder complete.

   Every user table is copied (found in sqlite_master, so later migrations are covered), in rowid order,
   as parts backups/<date>/<table>.<NNN>.jsonl with one JSON object per row; BLOB columns are base64. */
import { all } from "../../core/db.ts";
import type { Env } from "../../core/env.ts";

const ROW_BUDGET = 2000;               // rows per tick, all tables together
const HEAVY = new Set(["docs"]);       // big JSON bodies: each row counts as 20
const PART_ROWS = 1000;

interface TableState { rows: number; bytes: number; parts: number; after: number; done: boolean }
interface State { date: string; started: number; tables: Record<string, TableState> }
export interface BackupManifest { date: string; started: number; finished: number; schema: number;
  tables: Record<string, { rows: number; bytes: number; parts: number }>; rows: number; bytes: number }

function b64(bytes: ArrayBuffer | Uint8Array | number[]): string {
  const u = bytes instanceof Uint8Array ? bytes : Array.isArray(bytes) ? Uint8Array.from(bytes) : new Uint8Array(bytes);
  let s = "";
  for (const x of u) s += String.fromCharCode(x);
  return btoa(s);
}

export async function userTables(env: Env): Promise<string[]> {
  const rows = await all<{ name: string }>(env.DB,
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'd1_%' ORDER BY name");
  return rows.map((r) => r.name);
}

/** Run one tick of the backup for `date`. Returns the manifest when this tick completed it. */
export async function backupStep(env: Env, date: string, now = Date.now()): Promise<BackupManifest | null> {
  const prefix = `backups/${date}/`;
  if (await env.BACKUPS.head(prefix + "manifest.json")) return null;
  const stateObj = await env.BACKUPS.get(prefix + "state.json");
  const state: State = stateObj ? await stateObj.json<State>() : { date, started: now, tables: {} };
  const tables = await userTables(env);
  for (const t of tables) state.tables[t] ??= { rows: 0, bytes: 0, parts: 0, after: 0, done: false };
  let budget = ROW_BUDGET;
  for (const t of tables) {
    const ts = state.tables[t];
    while (!ts.done && budget > 0) {
      const weight = HEAVY.has(t) ? 20 : 1;
      const n = Math.max(1, Math.min(PART_ROWS, Math.floor(budget / weight)));
      const rows = await all<Record<string, unknown>>(env.DB, `SELECT rowid AS _rowid, * FROM "${t}" WHERE rowid > ? ORDER BY rowid LIMIT ?`, ts.after, n);
      if (rows.length) {
        const lines = rows.map((r) => {
          const o: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(r)) {
            if (k === "_rowid") continue;
            // D1 returns BLOBs as byte arrays; no other column is an array (JSON lives in TEXT)
            o[k] = v instanceof ArrayBuffer || v instanceof Uint8Array || Array.isArray(v) ? { $b64: b64(v as number[]) } : v;
          }
          return JSON.stringify(o);
        }).join("\n") + "\n";
        await env.BACKUPS.put(`${prefix}${t}.${String(ts.parts).padStart(3, "0")}.jsonl`, lines);
        ts.parts++;
        ts.rows += rows.length;
        ts.bytes += lines.length;
        ts.after = rows[rows.length - 1]._rowid as number;
        budget -= rows.length * weight;
      }
      if (rows.length < n) ts.done = true;
    }
    if (budget <= 0) break;
  }
  if (tables.every((t) => state.tables[t].done)) {
    const schema = (await all<{ n: number }>(env.DB, "SELECT COUNT(*) AS n FROM d1_migrations").catch(() => [{ n: 0 }]))[0]?.n ?? 0;
    const manifest: BackupManifest = {
      date, started: state.started, finished: Date.now(), schema,
      tables: Object.fromEntries(tables.map((t) => [t, { rows: state.tables[t].rows, bytes: state.tables[t].bytes, parts: state.tables[t].parts }])),
      rows: tables.reduce((n, t) => n + state.tables[t].rows, 0),
      bytes: tables.reduce((n, t) => n + state.tables[t].bytes, 0),
    };
    await env.BACKUPS.put(prefix + "manifest.json", JSON.stringify(manifest));
    await env.BACKUPS.delete(prefix + "state.json");
    return manifest;
  }
  await env.BACKUPS.put(prefix + "state.json", JSON.stringify(state));
  return null;
}
