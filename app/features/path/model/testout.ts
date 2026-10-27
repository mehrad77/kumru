// What a Test out does to progress: scores the answers (as placement does) and, when the learner moves on to section `to`, marks
// sections C..to-1 and their skills as tested out. Its state and effects come in through `TestDeps`, so it runs under node.
import type { Section, Skill, TreeProgress } from "./tree.ts";

export interface TestRecs { probes: { ref: string; pass: boolean; w: unknown; g: unknown }[]; recs: unknown }
export interface TestDeps {
  /** The page's progress: `tp` (the tree's marks) and `learned` (lessons). */
  S: { tp: TreeProgress & { tests?: unknown[] }; learned: Record<string, unknown> };
  secs(): Section[];
  /** The drill results by lesson id of the answers given. */
  scoreRecs(recs: unknown): Record<string, boolean[]>;
  /** How many parts a skill has. */
  parts(sk: Skill): number;
  syncPos(): void;
  save(): void;
  closeUnits(): void;
  now(): number;
}

/**
 * A lesson becomes learned only with at least two of its drills asked and all right, its section probe passed and the section below
 * `to`. Every skill of a skipped section that is not finished is marked tested; a declined or failed test marks nothing but is recorded.
 */
export function applyTreeTest(d: TestDeps, R: TestRecs, C: number, to: number): void {
  const { S } = d, { probes, recs } = R, by = d.scoreRecs(recs), secs = d.secs(), passed = new Set(probes.filter((p) => p.pass).map((p) => p.ref)), now = d.now();
  for (const id in by) {
    const si = secs.findIndex((s) => s.skills.some((k) => (k.lessons || []).includes(id)));
    if (si >= 0 && si < to && by[id].length >= 2 && by[id].every(Boolean) && passed.has("sec:" + secs[si].id)) S.learned[id] = 1;
  }
  const sk = { ...S.tp.sk }, sec = { ...S.tp.sec };
  for (let i = C; i < to; i++) {
    const s = secs[i];
    for (const k of s.skills) {
      const rec = sk[k.id];
      if (!(rec && (rec.l || 0) >= d.parts(k))) sk[k.id] = { ...(rec || {}), l: (rec && rec.l) || 0, at: now, how: "test" };
    }
    if (!sec[s.id]) sec[s.id] = { at: now, how: "test" };
  }
  S.tp = { ...S.tp, sk, sec, tests: [...(S.tp.tests || []), { from: C, to, probes: probes.map((p) => ({ ref: p.ref, pass: p.pass, w: p.w, g: p.g })), at: now }] };
  d.closeUnits();
  d.syncPos();
  d.save();
}
