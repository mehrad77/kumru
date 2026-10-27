/* Invite pages: the app page itself with link-preview tags naming who invites (docs/SPECS_API.md section 3). */
import type { Ctx } from "./router.ts";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

export async function page(ctx: Ctx, title: string, description: string): Promise<Response> {
  const res = await ctx.env.ASSETS.fetch(new Request(new URL("/", ctx.url), ctx.req));
  const tags = `<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">`
    + `<meta property="og:url" content="${esc(ctx.url.href)}">`;
  return new HTMLRewriter().on("head", { element: (e) => { e.append(tags, { html: true }); } }).transform(res);
}
