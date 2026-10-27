/* Notebook sync (docs/SPECS_API.md section 11a), Kumru's side. Connecting is code + PKCE + state
   (docs/AUTH.md): the reader sends a signed-in learner to /connect/yeni?return=&state=&code_challenge=&code_challenge_method=S256;
   Allow asks the Worker for a one-time code bound to that challenge and return URL, and goes back to the reader with
   #yk_code=<code>&state=<state> (#yk_error=denied&state=<state> on Cancel). The reader trades the code for a token itself.
   The Account card lists and revokes connections. Nothing here calls the bearer routes. */
import type { YeniTokenInfo } from "../../../shared/api.ts";
import { lsDel, lsGet, lsSet } from "../../host/storage.ts";
import { api } from "../../host/transport.ts";

/** The `return` URL of /connect/yeni when its origin is one the Worker allows, else null. */
export function yeniReturn(ret: string, origins: string[]): string | null {
  try {
    const u = new URL(ret);
    if ((u.protocol === "https:" || u.protocol === "http:") && origins.includes(u.origin)) { u.hash = ""; return u.href; }
  } catch { /* not a URL */ }
  return null;
}

/** An Error with a message fit to show a learner and a `code` the page can key its Turkish text on. */
function linkError(message: string, code: "bad_return" | "bad_link") {
  return Object.assign(new Error(message), { code });
}

/** What the consent page needs from its address: the validated return URL, the reader's `state` and its PKCE challenge.
 * Throws a linkError (`bad_return`: not an allowed reader address; `bad_link`: state or challenge missing or malformed).
 * `search` is `location.search`. */
export function parseConnect(search: string, origins: string[]): { ret: string; state: string; challenge: string } {
  const q = new URLSearchParams(search);
  const ret = yeniReturn(q.get("return") || "", origins);
  if (!ret) throw linkError("This link doesn't come from Notebook, so nothing was connected.", "bad_return");
  const state = q.get("state") || "";
  const challenge = q.get("code_challenge") || "";
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(state) || !/^[A-Za-z0-9_-]{43}$/.test(challenge) || q.get("code_challenge_method") !== "S256") {
    throw linkError("This connect link is incomplete or out of date. Go back to the reader and press Connect again.", "bad_link");
  }
  return { ret, state, challenge };
}

/* The learner's own reader notebook, read-only (docs/SPECS_API.md section 11a): GET /api/yeni/notebook?since=<rev>. The rev and
   the parsed notebook are cached under `kumru:yeni:rev` and `kumru:yeni:doc` (the notebook can reach 512 KiB, so a
   full localStorage keeps it in memory instead), tagged with the account in `kumru:yeni:uid` so another account on
   the same phone never sees it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the reader's notebook is an open document
export type NotebookDoc = Record<string, any>;
interface Cached { uid: string; rev: number; doc: NotebookDoc }
let mem: Cached | null = null;

/** The signed-in account's id, "" when unknown. */
function meId(): string {
  try { const m = lsGet("me"); return m ? String(JSON.parse(m).id || "") : ""; } catch { return ""; }
}

/** The cached notebook for this account, or null. */
export function notebookCached(): Cached | null {
  const uid = meId();
  if (mem && mem.uid === uid) return mem;
  if (lsGet("yeni:uid") !== uid) return null;
  const rev = Number(lsGet("yeni:rev"));
  let doc = null;
  try { doc = JSON.parse(lsGet("yeni:doc") || "null"); } catch { /* corrupt: fetch again */ }
  if (!(rev > 0 && doc && typeof doc === "object")) return null;
  mem = { uid, rev, doc };
  return mem;
}

function notebookStore(uid: string, rev: number, doc: NotebookDoc | null): void {
  if (!doc) { mem = null; for (const k of ["yeni:uid", "yeni:rev", "yeni:doc"]) lsDel(k); return; }
  mem = { uid, rev, doc };
  lsDel("yeni:doc");   // a failed write below must not leave an older copy behind
  lsSet("yeni:uid", uid); lsSet("yeni:rev", String(rev));
  lsSet("yeni:doc", JSON.stringify(doc));
}

/** The learner's notebook (what the reader synced), or null when there is none. Asks with the cached rev, so an
 * unchanged notebook costs a 304 and no body. Rejects like any `api` call (offline, unauthorized). */
async function notebook(): Promise<NotebookDoc | null> {
  const uid = meId(), have = notebookCached();
  const r = await api("GET", "/api/yeni/notebook" + (have ? "?since=" + have.rev : ""));
  if (r.status === 304 && have) return have.doc;
  const out = r.json || { rev: 0, doc: null };
  notebookStore(uid, out.rev, out.doc);
  return out.doc || null;
}

export const yeni = {
  notebook,
  cached: () => { const c = notebookCached(); return c ? c.doc : null; },
  /** Public: the gate needs it before sign-in. */
  origins: (): Promise<string[]> => api("GET", "/api/yeni/origins").then((r) => r.json.origins),
  /** A one-time code for the reader at `ret`, bound to its PKCE challenge. */
  code: (ret: string, challenge: string): Promise<string> => api("POST", "/api/yeni/codes", { return: ret, challenge }).then((r) => r.json.code),
  list: (): Promise<YeniTokenInfo[]> => api("GET", "/api/yeni/tokens").then((r) => r.json),
  revoke: (id: string): Promise<void> => api("DELETE", "/api/yeni/tokens/" + encodeURIComponent(id)).then(() => undefined),
  returnUrl: yeniReturn,
  parseConnect,
};
