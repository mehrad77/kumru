// What finishing a story writes (docs/stories/STORIES_SCHEMA.md §9, docs/SPECS_SCHEMA.md §3.1 `st`), the order the
// reader shows options in, and the quiz's stars. Pure.

export interface StRecord { done?: boolean; stars?: number; reads?: number; at?: number; picks?: number; ch?: Record<string, number | string>; fu?: boolean }
interface ChoiceLike { choice?: { id: string; options: { ok?: boolean }[] } }

/** How many of the story's own choices the learner answered with the `ok` option (the "great picks"; follow-ups are not counted). */
export function okPicks(steps: readonly unknown[], ch: Record<string, number | string>): number {
  let n = 0;
  for (const s of steps as ChoiceLike[]) {
    const c = s && s.choice, i = c ? ch[c.id] : undefined;
    if (c && typeof i === "number" && c.options[i]?.ok) n++;
  }
  return n;
}

/** Stars from the quiz: the questions right at the first try, at least one (reading to the end is worth a star). */
export const quizStars = (firstTry: number): number => Math.max(1, Math.min(3, firstTry));

/** The record after a reading: done, the best stars, one more read, this reading's picks. `first` is the first time it was finished. */
export function finishRecord(prev: StRecord | undefined, o: { stars: number; picks: number; ch: Record<string, number | string>; fu: boolean; now: number }): { rec: StRecord; first: boolean } {
  const p = prev ?? {};
  const rec: StRecord = { done: true, stars: Math.max(p.stars ?? 0, o.stars), reads: (p.reads ?? 0) + 1, at: o.now, picks: o.picks, ch: { ...o.ch }, ...(o.fu || p.fu ? { fu: true } : {}) };
  return { rec, first: !p.done };
}

/** A fixed shuffle of `n` items for `seed` (story, question and reading): the order to show options in; each entry is an authored index. */
export function shuffled(n: number, seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rnd = () => { h = (h + 0x6d2b79f5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
