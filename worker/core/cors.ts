/* CORS for Notebook (docs/SPECS_API.md section 11a): its bearer routes answer cross-origin, for the origins in
   YENI_ORIGINS only, never with credentials. A route opts in with `cors: "yeni"`. */
import type { Env } from "./env.ts";

export function readerOrigins(env: Env): string[] {
  return (env.YENI_ORIGINS || "").split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);
}

/** CORS headers for a response: the Origin echoed only when it is allowed. */
export function readerCors(env: Env, req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const h: Record<string, string> = { Vary: "Origin" };
  if (origin && readerOrigins(env).includes(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
    h["Access-Control-Expose-Headers"] = "Retry-After, X-Request-Id";
    h["Access-Control-Max-Age"] = "86400";
  }
  return h;
}
