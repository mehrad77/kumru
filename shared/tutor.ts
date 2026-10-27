/* The two-device merge of the tutor document (docs/SPECS_SCHEMA.md section 3.2); same rules as progress.ts: commutative and idempotent. */
import { type Doc, num, keysOf, cmp, later, clone, maxCounters } from "./merge-util.ts";

/** Merge two tutor documents (docs/SPECS_SCHEMA.md section 3.2).
 */
export function mergeTutor(a: Doc | null | undefined, b: Doc | null | undefined): Doc {
  if (!a) return clone(b || {});
  if (!b) return clone(a);
  const norm = (m: any) => String((m && m.orig) || "").trim().toLocaleLowerCase("tr");
  const mistakes = new Map();
  for (const m of [...(a.mistakes || []), ...(b.mistakes || [])]) {
    const k = norm(m), cur = mistakes.get(k);
    if (!cur) { mistakes.set(k, m); continue; }
    const win = later(cur, num(cur.at), m, num(m.at));
    mistakes.set(k, { ...win, n: Math.max(num(cur.n), num(m.n)) });
  }
  const talk: Doc = {};
  for (const id of keysOf(a.talk, b.talk)) {
    const x = (a.talk || {})[id], y = (b.talk || {})[id];
    if (!x || !y) { talk[id] = clone(x || y); continue; }
    const base = clone(later(x, num(x.at), y, num(y.at)));
    if (x.done || y.done) base.done = x.done || y.done;
    for (const f of ["stars", "turns", "hints", "tries"]) if (x[f] !== undefined || y[f] !== undefined) base[f] = Math.max(num(x[f]), num(y[f]));
    talk[id] = base;
  }
  return {
    mistakes: [...mistakes.values()].sort((x, y) => num(y.at) - num(x.at) || cmp(x, y)).slice(0, 60).map(clone),
    tries: maxCounters(a.tries, b.tries),
    talk,
  };
}
