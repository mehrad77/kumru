// What a finished climb does to the learner's progress: scores the answers, marks lessons learned, moves the position and keeps
// the audit in `S.placed`.
import { S } from "../../core/store.ts";
import { idxUnit, unitIdx } from "../../lib/units.ts";
import { closeUnits, treeSync, useTree } from "../path/index.ts";
import { bumpConf, saveProgress } from "../progress/index.ts";

export interface Recs { words: { id: string; ok: boolean }[]; drills: { k: string; lesson: string; vg: string; ok: boolean }[] }
export interface ProbeOutcome { ref: string; pass: boolean; w: [number, number]; g: [number, number] }
/** The result of a climb: the unit (or section) index it ends on, the probes asked and the answers given. */
export interface PlacementResult { idx: number; probes: ProbeOutcome[]; recs: Recs }
/** What the onboarding adds: the self-report and the writing sample's level. */
export type PlacementInput = PlacementResult & { self?: string; ai?: { level: string; unit: number } | null };

/** Scores a probe's answers (words right +2, wrong -3; drills counted) and returns the drill results by lesson id. */
export function scoreRecs(recs: Recs): Record<string, boolean[]> {
  for (const r of recs.words) {
    const s = S.stats[r.id] || (S.stats[r.id] = {}), k = r.ok ? "r" : "w";
    s[k] = (s[k] || 0) + 1;
    s.t = Date.now();
    s.l = r.ok ? 1 : 0;
    bumpConf(r.id, r.ok ? "right" : "wrong");
  }
  const by: Record<string, boolean[]> = {};
  for (const d of recs.drills) {
    const s = S.drill[d.k] || (S.drill[d.k] = { r: 0, w: 0 }), g = S.drill["v:" + d.vg] || (S.drill["v:" + d.vg] = { r: 0, w: 0 });
    for (const x of [s, g]) x[d.ok ? "r" : "w"]++;
    (by[d.lesson] || (by[d.lesson] = [])).push(d.ok);
  }
  return by;
}

/**
 * Scores the answered words and marks a lesson learned only when its own drills were all right, at least two were asked, its unit passed and the unit
 * lies below the new position. `pick` = the unit to move to, or null to stay put (a jump the learner declined, or a failed one). `opts.jump` =
 * {from, target} logs a jump in `placed.jumps` instead of replacing the placement audit. Returns the lessons marked learned.
 */
export function applyPlacement(R: PlacementInput, pick: { lv: string; u: number } | null, opts: { jump?: { from: number; target: number } } = {}): string[] {
  const { idx, probes, recs } = R, pi = pick ? unitIdx(pick.lv, pick.u) : -1, bound = pick ? Math.min(idx, pi) : -1;
  const by = scoreRecs(recs);
  const lm: Record<string, string> = Object.fromEntries(S.grammar.map((g: { id: string; ref?: string }) => [g.id, g.ref || ""]));
  const passed = new Set(probes.filter((p) => p.pass).map((p) => p.ref)), learned: string[] = [];
  for (const id in by) {
    const ref = lm[id], m = /^([A-Z]\d)_(\d+)$/.exec(ref || "");
    if (!m) continue;
    if (by[id].length >= 2 && by[id].every(Boolean) && passed.has(ref) && unitIdx(m[1], +m[2]) < bound) { S.learned[id] = 1; learned.push(id); }
  }
  const pr = probes.map((p) => ({ ref: p.ref, pass: p.pass, w: p.w, g: p.g })), old = S.placed || {};
  if (pick) { S.pos = { lv: pick.lv, u: pick.u }; closeUnits(); }
  if (opts.jump) S.placed = { ...old, jumps: [...(old.jumps || []), { from: opts.jump.from, to: pick ? pi : opts.jump.from, target: opts.jump.target, probes: pr, learned: learned.length, at: Date.now() }] };
  else {
    const at = idxUnit(idx);
    S.placed = { lv: pick!.lv, u: pick!.u, self: R.self || "", probes: pr, test: { lv: at.lv, u: at.u }, ai: R.ai ? { lv: R.ai.level, u: R.ai.unit } : null, learned: learned.length, at: Date.now(), v: 1, ...(old.jumps ? { jumps: old.jumps } : {}) };
  }
  if (pick && useTree()) treeSync(pi, { place: true });   // the skills before the new unit are placed past
  saveProgress();
  return learned;
}
