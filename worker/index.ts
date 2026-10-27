/* The yakerim Worker (docs/SPECS.md sections 2-3): routes only. Static assets never reach this code except
   /f/* and /c/* (run_worker_first in wrangler.jsonc); every /api route is listed here, with the phase
   that added it in docs/SPECS_API.md. */
import type { ErrorCode } from "../shared/api.ts";
import { readerCors } from "./core/cors.ts";
import { scheduled } from "./core/cron.ts";
import type { Env } from "./core/env.ts";
import { health } from "./core/health.ts";
import { HttpError, errorResponse, flatError, logRequest, randomId } from "./core/http.ts";
import { pagesOf, routesOf, setFeatures } from "./core/registry.ts";
import { type Route, match, matchPath } from "./core/router.ts";
import { FEATURES } from "./features/index.ts";

setFeatures(FEATURES);

/** Every route: core's own (health), then each feature's, in the order of features/index.ts (a test checks for duplicates and shadowing). */
const routes: Route[] = [["GET", "/api/health", health], ...routesOf()];
/** Pages the Worker renders: the app with link-preview tags (docs/SPECS_API.md section 3). */
const pages: Route[] = pagesOf();

/** A page version listed in MIN_CLIENT must reload before it may write (docs/SPECS_API.md section 1.6). */
function retiredClient(req: Request, env: Env): boolean {
  const v = req.headers.get("X-Kumru-Client");
  return !!v && env.MIN_CLIENT.split(",").map((s) => s.trim()).filter(Boolean).includes(v);
}

export default {
  async fetch(req: Request, env: Env, exec: ExecutionContext): Promise<Response> {
    const t0 = Date.now();
    const url = new URL(req.url);
    const requestId = randomId(16);
    let route = url.pathname;
    let res: Response;
    let code: ErrorCode | undefined;
    let user = false;
    /* routes marked cors / flat answer the reader cross-origin (CORS for YENI_ORIGINS only) with `{ error: code }` bodies; the path decides, whatever the method */
    const opts = url.pathname.startsWith("/api/") ? matchPath(routes, url.pathname)?.[3] : undefined;
    const cors = opts?.cors === "yeni", flat = opts?.errors === "flat";
    if (cors && req.method === "OPTIONS") {
      res = new Response(null, { status: 204, headers: readerCors(env, req) });
      logRequest({ route: url.pathname, status: 204, ms: Date.now() - t0, user, id: requestId });
      return res;
    }
    try {
      if (!url.pathname.startsWith("/api/")) {
        const p = match(pages, req.method, url.pathname.replace(/^\/@/, "/@/"));
        res = p && p !== "method"
          ? await p.handler({ req, env, url, params: p.params, requestId, exec })
          : await env.ASSETS.fetch(new Request(new URL("/", url), req));
      } else {
        const m = match(routes, req.method, url.pathname);
        if (m === null) throw new HttpError("not_found", "No such route.");
        if (m === "method") throw new HttpError("not_found", `${req.method} is not allowed here.`);
        route = m.pattern;
        if (retiredClient(req, env)) throw new HttpError("upgrade_required", "This version of Kumru is retired; reload.");
        const ctx = { req, env, url, params: m.params, requestId, exec, authed: undefined };
        try {
          res = await m.handler(ctx);
        } finally {
          user = !!ctx.authed;
        }
      }
    } catch (e) {
      const err = e instanceof HttpError ? e : new HttpError("internal", "Something went wrong.");
      if (!(e instanceof HttpError)) console.error(JSON.stringify({ id: requestId, route, error: String(e) }));
      code = err.code;
      res = flat ? flatError(err, requestId) : errorResponse(err, requestId);
    }
    if (url.pathname.startsWith("/api/")) {
      res = new Response(res.body, res);
      res.headers.set("X-Request-Id", requestId);
      if (cors) for (const [k, v] of Object.entries(readerCors(env, req))) res.headers.set(k, v);
      logRequest({ route, status: res.status, ms: Date.now() - t0, user, id: requestId, ...(code ? { code } : {}) });
    }
    return res;
  },

  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    await scheduled(controller.scheduledTime, env);
  },
} satisfies ExportedHandler<Env>;
