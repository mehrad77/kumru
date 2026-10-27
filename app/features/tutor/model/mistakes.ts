// The tutor's list of saved fixes ("Fix my mistakes"). Pure: the document is passed in.
import { normW } from "./diff.ts";

export interface Mistake { orig: string; fixed: string; lesson?: string; fa?: string; en?: string; src?: string; at?: number; n?: number }

/** The most fixes kept. */
export const MAX_MISTAKES = 60;

/** The list with `m` added (a fix for the same sentence is replaced); `null` when `m` has nothing to fix. */
export function withMistake(list: Mistake[] | undefined, m: Mistake, now: number): Mistake[] | null {
  if (!m.orig || !m.fixed) return null;
  return [...(list || []).filter((x) => normW(x.orig) !== normW(m.orig)), { ...m, at: now, n: 0 }].slice(-MAX_MISTAKES);
}

/** A fix to practise, not one already used in this session (`used` is emptied when all were); `null` for an empty list. */
export function pickMistake(pool: Mistake[], used: Set<string>, rnd: () => number = Math.random): Mistake | null {
  if (!pool.length) return null;
  let c = pool.filter((m) => !used.has(m.orig));
  if (!c.length) { used.clear(); c = pool; }
  const m = c[Math.floor(rnd() * c.length)];
  used.add(m.orig);
  return m;
}

/** After an answer: a right one counts, and two right answers retire the fix. Returns the list to keep. */
export function afterAnswer(list: Mistake[], m: Mistake, ok: boolean): Mistake[] {
  if (!ok) return list;
  m.n = (m.n || 0) + 1;
  return m.n >= 2 ? list.filter((x) => x !== m) : list;
}
