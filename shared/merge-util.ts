/* The helpers both merges share. Pure: no clock, no storage, inputs are never mutated. */
export type Doc = Record<string, any>;

export const isObj = (x: unknown) => !!x && typeof x === "object" && !Array.isArray(x);
export const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
export const keysOf = (a: any, b: any) => [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])].sort();
/** A stable order for two values, used only to break exact ties. */
export const cmp = (x: unknown, y: unknown) => {
  const sx = JSON.stringify(x) ?? "", sy = JSON.stringify(y) ?? "";
  return sx < sy ? -1 : sx > sy ? 1 : 0;
};
/** The value whose time is later; on a tie, the larger value. */
export function later(va: any, ta: number, vb: any, tb: number) {
  if (ta !== tb) return ta > tb ? va : vb;
  return cmp(va, vb) >= 0 ? va : vb;
}
export const clone = (x: any) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

/** Per key, max of every numeric field (counters such as {r, w}). */
export function maxCounters(a: any, b: any) {
  const out: Doc = {};
  for (const k of keysOf(a, b)) {
    const x = (a || {})[k], y = (b || {})[k];
    if (isObj(x) && isObj(y)) {
      const m: Doc = {};
      for (const f of keysOf(x, y)) m[f] = typeof x[f] === "number" || typeof y[f] === "number" ? Math.max(num(x[f]), num(y[f])) : later(x[f], 0, y[f], 0);
      out[k] = m;
    } else if (typeof x === "number" || typeof y === "number") out[k] = Math.max(num(x), num(y));
    else out[k] = clone(x === undefined ? y : y === undefined ? x : later(x, 0, y, 0));
  }
  return out;
}

/** Per key, the entry with the later `at` (or the key's own time from `timeOf`). */
export function byLater(a: any, b: any, timeOf: (v: any) => number) {
  const out: Doc = {};
  for (const k of keysOf(a, b)) {
    const x = (a || {})[k], y = (b || {})[k];
    out[k] = clone(x === undefined ? y : y === undefined ? x : later(x, timeOf(x), y, timeOf(y)));
  }
  return out;
}

export const PLACE = ["A1", "A2", "B1"];
export const placeRank = (p: any) => (p ? PLACE.indexOf(p.lv) * 10 + num(p.u) : -1);
