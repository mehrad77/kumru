/* A small method + path router. Patterns are literal segments and `:name` parameters. */
import type { Authed } from "./session.ts";
import type { Env } from "./env.ts";

export interface Ctx {
  req: Request;
  env: Env;
  url: URL;
  params: Record<string, string>;
  requestId: string;
  exec: ExecutionContext;
  /** Set by requireUser once looked up (null = no valid session). */
  authed?: Authed | null;
}

export type Handler = (ctx: Ctx) => Promise<Response> | Response;
/** Per-route options: `cors: "yeni"` answers cross-origin for the reader's origins (and its preflight); `errors: "flat"` answers `{ error: code }`. */
export interface RouteOpts { cors?: "yeni"; errors?: "flat" }
export type Route = [method: string, pattern: string, handler: Handler, opts?: RouteOpts];

export interface Match { handler: Handler; params: Record<string, string>; pattern: string; opts?: RouteOpts }

const splitPath = (path: string) => path.split("/").filter(Boolean);
function params(pattern: string, segs: string[]): Record<string, string> | null {
  const ps = splitPath(pattern);
  if (ps.length !== segs.length) return null;
  const out: Record<string, string> = {};
  return ps.every((p, i) => (p.startsWith(":") ? ((out[p.slice(1)] = decodeURIComponent(segs[i])), true) : p === segs[i])) ? out : null;
}

/** The first route whose pattern fits `path`, whatever its method (CORS preflight and flat errors are decided by the path). */
export function matchPath(routes: Route[], path: string): Route | null {
  const segs = splitPath(path);
  return routes.find(([, pattern]) => params(pattern, segs)) ?? null;
}

export function match(routes: Route[], method: string, path: string): Match | "method" | null {
  const segs = splitPath(path);
  let wrongMethod = false;
  for (const [m, pattern, handler, opts] of routes) {
    const ps = params(pattern, segs);
    if (!ps) continue;
    if (m !== method) { wrongMethod = true; continue; }
    return { handler, params: ps, pattern, opts };
  }
  return wrongMethod ? "method" : null;
}
