/* Responses, errors and the per-request log line (docs/SPECS_API.md sections 1.4, 1.5; docs/SPECS.md section 11.6). */
import type { ApiError, ErrorCode } from "../../shared/api.ts";

export const STATUS: Record<ErrorCode, number> = {
  invalid: 400, invalid_grant: 400, unauthorized: 401, forbidden: 403, not_found: 404, taken: 409, conflict: 409, gone: 410,
  too_large: 413, upgrade_required: 426, rate_limited: 429, payment_required: 402, not_implemented: 501,
  quota_exceeded: 503, internal: 500, offline: 503, aborted: 499,
};

type Extra = Omit<ApiError["error"], "code" | "message">;

/** Thrown by a handler; the router turns it into the error envelope. */
export class HttpError extends Error {
  constructor(public code: ErrorCode, message: string, public extra: Extra = {}) {
    super(message);
  }
}

const BASE_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...BASE_HEADERS, ...headers } });
}

export function errorResponse(err: HttpError, requestId: string): Response {
  const body: ApiError = { error: { code: err.code, message: err.message, ...err.extra } };
  if (err.code === "internal") body.error.requestId = requestId;
  const headers: Record<string, string> = {};
  if (err.extra.retryAfter) headers["Retry-After"] = String(err.extra.retryAfter);
  return json(body, STATUS[err.code], headers);
}

/** Routes marked `errors: "flat"` (the reader's bearer routes, docs/SPECS_API.md section 11a) answer `{ error: code }`, plus `retryAfter` on 429. */
export function flatError(err: HttpError, requestId: string): Response {
  const headers: Record<string, string> = {};
  if (err.extra.retryAfter) headers["Retry-After"] = String(err.extra.retryAfter);
  return json({ error: err.code, ...(err.extra.retryAfter ? { retryAfter: err.extra.retryAfter } : {}),
    ...(err.code === "internal" ? { requestId } : {}) }, STATUS[err.code], headers);
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

/** `n` random characters of lower-case base32. */
export function randomId(n: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  let out = "";
  for (const b of bytes) out += ALPHABET[b & 31];
  return out;
}

export interface LogLine { route: string; status: number; ms: number; user: boolean; code?: ErrorCode; id: string }

/** One JSON line per request to Workers Logs: never bodies, never tokens. */
export function logRequest(line: LogLine): void {
  console.log(JSON.stringify(line));
}
