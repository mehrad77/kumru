/* The two-device merge of the progress document (docs/SPECS.md section 9.5), used by the host (app/host/sync.ts) when a
   save answers 409 or a pull on focus brings a newer server copy, and by the page through
   window.kumru.merge. Pure functions: no clock, no storage, inputs are never mutated.

   Every rule is commutative and idempotent (merge(a, b) equals merge(b, a), merge(a, a) equals a), so two
   phones that merge in either order end on the same document. Ties on time are broken by comparing
   the values themselves, never by argument order. */

import type { BookDoc } from "./yeni.ts";
import { type Doc, num, keysOf, cmp, later, clone, maxCounters, byLater, placeRank } from "./merge-util.ts";

/** Merge two progress documents (docs/SPECS_SCHEMA.md section 3.1).
 */
export function mergeProgress(a: Doc | null | undefined, b: Doc | null | undefined): Doc {
  if (!a) return clone(b || {});
  if (!b) return clone(a);
  const out: Doc = {};
  // fields this merge does not know: keep either side's, deterministically
  for (const k of keysOf(a, b)) if (!(k in RULES)) out[k] = clone(a[k] === undefined ? b[k] : b[k] === undefined ? a[k] : later(a[k], 0, b[k], 0));
  for (const k of Object.keys(RULES)) {
    if (a[k] === undefined && b[k] === undefined && !ALWAYS.has(k)) continue;
    const v = RULES[k](a, b);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

const ALWAYS = new Set(["v"]);
const atOf = (d: Doc, f: string) => num((d.at || {})[f]);

const RULES: Record<string, (a: Doc, b: Doc) => any> = {
  v: (a, b) => Math.max(num(a.v), num(b.v), 5),
  conf: (a, b) => {
    const out: Doc = {};
    for (const id of keysOf(a.conf, b.conf)) {
      const ta = num((a.confAt || {})[id]), tb = num((b.confAt || {})[id]);
      const va = num((a.conf || {})[id]), vb = num((b.conf || {})[id]);
      const v = ta !== tb ? (ta > tb ? va : vb) : Math.max(va, vb);
      if (v) out[id] = v;
    }
    return out;
  },
  confAt: (a, b) => {
    const out: Doc = {};
    for (const id of keysOf(a.confAt, b.confAt)) out[id] = Math.max(num((a.confAt || {})[id]), num((b.confAt || {})[id]));
    return out;
  },
  stats: (a, b) => {
    const out: Doc = {};
    for (const id of keysOf(a.stats, b.stats)) {
      const x = (a.stats || {})[id], y = (b.stats || {})[id];
      if (!x || !y) { out[id] = clone(x || y); continue; }
      const rec = clone(later(x, num(x.t), y, num(y.t)));
      const seen = Math.max(num(x.v), num(y.v));
      if (seen) rec.v = seen;
      out[id] = rec;
    }
    return out;
  },
  drill: (a, b) => maxCounters(a.drill, b.drill),
  ex: (a, b) => maxCounters(a.ex, b.ex),
  gram: (a, b) => {
    const out: Doc = {};
    for (const id of keysOf(a.gram, b.gram)) if ((a.gram || {})[id] || (b.gram || {})[id]) out[id] = 1;
    return out;
  },
  days: (a, b) => maxCounters(a.days, b.days),
  xpDays: (a, b) => maxCounters(a.xpDays, b.xpDays),
  xp: (a, b) => {
    const days = maxCounters(a.xpDays, b.xpDays);
    return Math.max(num(a.xp), num(b.xp), Object.values(days).reduce((s, x) => s + num(x), 0));
  },
  log: (a, b) => {
    const seen = new Map();
    for (const e of [...(a.log || []), ...(b.log || [])]) {
      const k = `${e && e.d}|${e && e.q}|${e && e.min}`;
      if (!seen.has(k) || cmp(e, seen.get(k)) > 0) seen.set(k, e);
    }
    return [...seen.values()].sort((x, y) => (String(x.d) < String(y.d) ? -1 : String(x.d) > String(y.d) ? 1 : cmp(x, y))).slice(-30).map(clone);
  },
  st: (a, b) => {
    const out: Doc = {};
    for (const id of keysOf(a.st, b.st)) {
      const x = (a.st || {})[id], y = (b.st || {})[id];
      if (!x || !y) { out[id] = clone(x || y); continue; }
      const base = clone(later(x, num(x.at), y, num(y.at)));
      if (x.done || y.done) base.done = x.done || y.done;
      for (const f of ["stars", "reads"]) if (x[f] !== undefined || y[f] !== undefined) base[f] = Math.max(num(x[f]), num(y[f]));
      base.at = Math.max(num(x.at), num(y.at)) || base.at;
      out[id] = base;
    }
    return out;
  },
  nd: (a, b) => {
    const out: Doc = {};
    for (const id of keysOf(a.nd, b.nd)) {
      const x = (a.nd || {})[id], y = (b.nd || {})[id];
      if (!x || !y) { out[id] = clone(x || y); continue; }
      const base = clone(later(x, num(x.at), y, num(y.at)));
      for (const f of ["stars", "n"]) if (x[f] !== undefined || y[f] !== undefined) base[f] = Math.max(num(x[f]), num(y[f]));
      out[id] = base;
    }
    return out;
  },
  tree: (a, b) => {
    const x = a.tree || {}, y = b.tree || {};
    const out: Doc = { v: 1 };
    out.sk = {};
    for (const id of keysOf(x.sk, y.sk)) {
      const p = (x.sk || {})[id], q = (y.sk || {})[id];
      out.sk[id] = clone(!p || !q ? p || q : num(p.l) !== num(q.l) ? (num(p.l) > num(q.l) ? p : q) : later(p, num(p.at), q, num(q.at)));
    }
    out.sec = byLater(x.sec, y.sec, (v) => num(v && v.at));
    if (x.mig || y.mig) out.mig = 1;
    if (x.tests || y.tests) {
      const tests = new Map();
      for (const t of [...(x.tests || []), ...(y.tests || [])]) {
        const k = `${t && t.from}|${t && t.to}`;
        if (!tests.has(k) || cmp(t, tests.get(k)) > 0) tests.set(k, t);
      }
      out.tests = [...tests.values()].sort(cmp).map(clone);
    }
    return out;
  },
  pos: (a, b) => {
    if (!a.pos || !b.pos) return clone(a.pos || b.pos);
    const ta = atOf(a, "pos"), tb = atOf(b, "pos");
    if (ta !== tb) return clone(ta > tb ? a.pos : b.pos);
    return clone(placeRank(a.pos) >= placeRank(b.pos) ? a.pos : b.pos);
  },
  placed: (a, b) => {
    if (!a.placed || !b.placed) return clone(a.placed || b.placed);
    const ta = atOf(a, "placed") || num(a.placed.at), tb = atOf(b, "placed") || num(b.placed.at);
    return clone(later(a.placed, ta, b.placed, tb));
  },
  onb: (a, b) => Math.max(num(a.onb), num(b.onb)),
  cheerSeen: (a, b) => Math.max(num(a.cheerSeen), num(b.cheerSeen)),
  nick: (a, b) => sideField(a, b, "nick"),
  char: (a, b) => sideField(a, b, "char"),
  profile: (a, b) => sideField(a, b, "profile"),
  prefs: (a, b) => sideField(a, b, "prefs"),
  at: (a, b) => {
    const out: Doc = {};
    for (const f of keysOf(a.at, b.at)) out[f] = Math.max(num((a.at || {})[f]), num((b.at || {})[f]));
    return out;
  },
  box: (a, b) => clone(a.box === undefined ? b.box : b.box === undefined ? a.box : later(a.box, 0, b.box, 0)),
};

/** nick, char, profile, prefs: the side that set it later (`at.<field>`). */
function sideField(a: Doc, b: Doc, f: string) {
  if (a[f] === undefined) return clone(b[f]);
  if (b[f] === undefined) return clone(a[f]);
  return clone(later(a[f], atOf(a, f), b[f], atOf(b, f)));
}

// ---------- route and document types (docs/SPECS_API.md section 5) ----------

export type DocKind = "progress" | "tutor";       // `docs.kind` also holds "yeni", reached only through /api/yeni/doc
export interface DocGet { rev: number; updated: number; body: unknown | null }
export interface DocPut { baseRev: number; body: unknown; weak?: WeakDoc; book?: BookDoc }
export interface DocPutOk { rev: number; updated: number }
export interface WeakCard { id: string; tries: number; wrong: number }
export interface WeakDoc { v: 1; at: number; cards: WeakCard[]; lessons: { id: string; tries: number; misses: number }[] }
