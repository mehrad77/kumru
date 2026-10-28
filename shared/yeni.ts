/* Notebook sync (docs/SPECS_API.md section 11a) and the book progress shared with a class. */

// Notebook (docs/SPECS_API.md §11a). Session routes for the connect page and the Account card:
export interface YeniOrigins { origins: string[] }
// Connecting is code + PKCE (docs/AUTH.md): the consent page asks for a one-time code bound to the reader's challenge and return
// URL, hands it back in the fragment (#yk_code=<code>&state=<state>), and the reader trades it for a token at POST /api/yeni/token.
export interface YeniCodeNew { return: string; challenge: string }
export interface YeniCodeOk { code: string }
export interface YeniTokenInfo { id: string; label: string | null; created_at: number; last_used_at: number }
export type YeniTokenList = YeniTokenInfo[];
// Routes called cross-origin by the reader (the exchange and the bearer routes); their errors are flat, `{ error: code }`:
export interface YeniExchange { code: string; verifier: string; return: string; label?: string }
export interface YeniExchangeOk { token: string; username: string }
export type YeniErrorCode = "invalid" | "invalid_grant" | "unauthorized" | "too_large" | "rate_limited" | "conflict" | "quota_exceeded" | "internal" | "not_found";
export interface YeniError { error: YeniErrorCode; retryAfter?: number; requestId?: string }
export interface YeniDocGet { rev: number; doc: Record<string, unknown> | null }
export interface YeniDocPut { baseRev: number; doc: Record<string, unknown> }
export interface YeniDocPutOk { rev: number }
/** GET /api/yeni/notebook?since=<rev> (session): the learner's own reader notebook, read-only; 304 when unchanged. */
export interface YeniNotebook { rev: number; doc: Record<string, unknown> | null }
/** GET /api/yeni/check (reader token; server to server, the course repo's exam Worker): the token is live. `uid` is an opaque,
 *  stable id for the learner (HMAC of the user id, 22 characters), naming no account. */
export interface YeniCheckOk { uid: string }
export interface YeniDocConflict { error: "conflict"; rev: number; doc: Record<string, unknown> | null }
/** A learner's book progress from the reader's notebook, computed by their own page (app/features/yeni/book.ts) and shared only with classes
 *  they switched "book" sharing on for. Keys are Kumru unit refs ("A1_3"); never answers or writing. ≤ 4 KB. */
export interface BookUnit { d: 0 | 1; p: number; s: [tried: number, solved: number, total: number] }
export interface BookDoc { v: 1; at: number; units: Record<string, BookUnit>; last: { ref: string; at: number } | null }
