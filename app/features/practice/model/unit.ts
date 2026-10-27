// How far along a unit of the books is: a unit is done at 80%, 70% weight on its words known (level 3+), 30% on its grammar lessons learned.
// Pure: the cards and lessons come in as arguments.

export interface UnitEnv {
  /** The unit's word cards and grammar lessons (those whose `ref` is `<lv>_<u>`). */
  words(ref: string): { id: string }[];
  lessons(ref: string): { id: string }[];
  isKnown(c: { id: string }): boolean;
  tries(id: string): number;
  learned(id: string): boolean;
  unitTitle(lv: string, u: number): string;
}

export interface UnitInfo { lv: string; u: number; ref: string; title: string; n: number; known: number; seen: number; lessons: number; learned: number; pct: number; done: boolean }

export function unitInfo(env: UnitEnv, lv: string, u: number): UnitInfo {
  const ref = lv + "_" + u, words = env.words(ref), lessons = env.lessons(ref);
  const known = words.filter(env.isKnown).length, seen = words.filter((c) => env.tries(c.id)).length, learned = lessons.filter((d) => env.learned(d.id)).length;
  const parts = ([[known, words.length, 0.7], [learned, lessons.length, 0.3]] as const).filter((p) => p[1]);
  const w = parts.reduce((a, p) => a + p[2], 0);
  const pct = w ? Math.round(100 * parts.reduce((a, p) => a + p[2] * p[0] / p[1], 0) / w) : 0;
  return { lv, u, ref, title: env.unitTitle(lv, u), n: words.length, known, seen, lessons: lessons.length, learned, pct, done: !!w && pct >= 80 };
}
