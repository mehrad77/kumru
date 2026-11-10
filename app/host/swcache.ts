/* What the service worker (app/host/sw.ts) may keep. Pure, so app/host/swcache.test.ts covers it.

   The Worker's assets answer a path they do not have with the page (`not_found_handling: "single-page-application"`,
   wrangler.jsonc): a hashed file of an older build (/assets/Onboarding-OLD.js, asked for by a page loaded before a deploy) comes
   back as index.html with status 200. Kept as that file, the HTML stays in `kumru-lazy` across versions, and every import of it
   fails ("Expected a JavaScript module… text/html") however often the page reloads: the onboarding showed "Couldn't load this"
   instead of the flow. So a file is kept only when it is what its path says, and the page itself is never kept as a file. */

/** Whether a response for `path` is the file itself: OK, and not the HTML page standing in for a file it does not have. */
export function isFile(path: string, res: { ok: boolean; headers: { get(name: string): string | null } }): boolean {
  if (!res.ok) return false;
  if (path === "/" || path.endsWith(".html")) return true;
  return !/^text\/html\b/i.test(res.headers.get("content-type") || "");
}

/** The answer for a file the server does not have (its page came back instead): a plain 404, so an import fails at once and is
 *  not kept. */
export const missing = (): Response => new Response("", { status: 404, statusText: "Not Found" });
