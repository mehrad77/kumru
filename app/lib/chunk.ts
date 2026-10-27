// A list cut into lessons of up to `size` items (a skill's words, a unit's words). Pure.

/** ceil(n/size) lessons of nearly equal size, so none is left with one or two. */
export function chunkWords<T>(list: T[], size = 8): T[][] {
  const n = list.length;
  if (!n) return [];
  const k = Math.ceil(n / size), base = Math.floor(n / k), extra = n % k, out: T[][] = [];
  let at = 0;
  for (let i = 0; i < k; i++) {
    const m = base + (i < extra ? 1 : 0);
    out.push(list.slice(at, at + m));
    at += m;
  }
  return out;
}
