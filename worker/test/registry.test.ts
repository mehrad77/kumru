// The server registry's own invariants: nothing the features add may collide or hide another route.
import { describe, expect, it } from "vitest";
import wrangler from "../../wrangler.jsonc?raw";
import { ANON } from "../core/limits.ts";
import { features, pagesOf, routesOf } from "../core/registry.ts";
import type { Route } from "../core/router.ts";

const segs = (p: string) => p.split("/").filter(Boolean);
/** `a` matches every path `b` matches (a is as general as b, position by position). */
const covers = (a: string, b: string) => {
  const x = segs(a), y = segs(b);
  return x.length === y.length && x.every((s, i) => s.startsWith(":") || s === y[i]);
};

describe("routes", () => {
  const routes: Route[] = [["GET", "/api/health", () => new Response()], ...routesOf()];

  it("has no method + pattern twice", () => {
    const keys = routes.map(([m, p]) => `${m} ${segs(p).map((s) => (s.startsWith(":") ? ":" : s)).join("/")}`);
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([]);
  });

  it("never lets an earlier pattern shadow a later one (a literal must come before the parameter that would catch it)", () => {
    const shadowed: string[] = [];
    routes.forEach(([m, p], i) => routes.forEach(([m2, p2], j) => {
      if (i < j && m === m2 && p !== p2 && covers(p, p2)) shadowed.push(`${m} ${p} hides ${p2}`);
    }));
    expect(shadowed).toEqual([]);
  });

  it("every /api route is under /api and every page is not", () => {
    expect(routesOf().filter(([, p]) => !p.startsWith("/api/"))).toEqual([]);
    expect(pagesOf().filter(([, p]) => p.startsWith("/api/"))).toEqual([]);
  });
});

describe("pages and wrangler.jsonc", () => {
  const globs: string[] = JSON.parse(wrangler.replace(/^\s*\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1")).assets.run_worker_first;
  const re = (g: string) => new RegExp("^" + g.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");

  it("run_worker_first covers every page the Worker renders, so the static asset does not answer first", () => {
    const sample = (p: string) => p.replace(/^\/@\//, "/@").replace(/:\w+/g, "x");
    const missed = pagesOf().map(([, p]) => sample(p)).filter((path) => !globs.filter((g) => !g.startsWith("!")).some((g) => re(g).test(path)));
    expect(missed).toEqual([]);
  });
});

describe("features", () => {
  it("have unique ids, document kinds and rate-limit keys", () => {
    const list = features();
    const ids = list.map((f) => f.id);
    expect(ids.filter((x, i) => ids.indexOf(x) !== i)).toEqual([]);
    const kinds = list.flatMap((f) => Object.keys(f.docs?.kinds ?? {}));
    expect(kinds.filter((x, i) => kinds.indexOf(x) !== i)).toEqual([]);
    const keys = [ANON.key, ...list.flatMap((f) => Object.values(f.rules ?? {}).map((r) => r.key))];
    expect(keys.filter((x, i) => keys.indexOf(x) !== i)).toEqual([]);
    expect(keys.length).toBeGreaterThan(10);
  });

  it("serve the document kinds the page reads", () => {
    const kinds = features().flatMap((f) => Object.keys(f.docs?.kinds ?? {}));
    expect(kinds.sort()).toEqual(["progress", "tutor"]);
  });
});
