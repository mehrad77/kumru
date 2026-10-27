/* Request bodies (docs/SPECS_API.md sections 1.2 and 1.8). */
import { HttpError } from "./http.ts";

export const MAX_BODY = 256 * 1024;

export async function readJson<T = Record<string, unknown>>(req: Request, limit = MAX_BODY): Promise<T> {
  const len = Number(req.headers.get("Content-Length") || 0);
  if (len > limit) throw new HttpError("too_large", `The body is over ${limit} bytes.`);
  const text = await req.text();
  if (new TextEncoder().encode(text).length > limit) throw new HttpError("too_large", `The body is over ${limit} bytes.`);
  let v: unknown;
  try { v = JSON.parse(text); } catch { throw new HttpError("invalid", "The body is not JSON."); }
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new HttpError("invalid", "The body must be a JSON object.");
  return v as T;
}

export function str(o: Record<string, unknown>, field: string, opts: { min?: number; max?: number; optional?: boolean } = {}): string {
  const v = o[field];
  if (v === undefined && opts.optional) return "";
  if (typeof v !== "string") throw new HttpError("invalid", `${field} must be a string.`, { field });
  if (opts.min !== undefined && v.length < opts.min) throw new HttpError("invalid", `${field} is too short.`, { field });
  if (opts.max !== undefined && v.length > opts.max) throw new HttpError("invalid", `${field} is too long.`, { field });
  return v;
}

/** The optional tz and label every sign-in route accepts. */
export function device(o: Record<string, unknown>): { tz: string | null; label: string } {
  const tz = typeof o.tz === "string" && /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(o.tz) && o.tz.length <= 64 ? o.tz : null;
  const label = typeof o.label === "string" ? o.label.slice(0, 60) : "";
  return { tz, label };
}
