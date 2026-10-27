// Where each unit of the books stands on the Path (the page's lock rules as plain data) for Notebook book box: its offers and
// the /unit/<REF> link. Pure.
import type { FlowSection } from "./tree.ts";
import type { RoadNode, RoadUnit } from "./road.ts";

export type Where = "cur" | "past" | "later" | "done";
export interface BookRef { where: Where; cp: boolean }
export interface BookTarget { sec?: FlowSection<unknown>; unit?: RoadUnit; cpNode?: RoadNode }

/** `sections` is the skill tree's flow (null without the tree), `units` the old road; the tree covers the levels in `treeLevels`. */
export function bookPathState(a: { sections: FlowSection<unknown>[] | null; treeLevels: Set<string>; units: RoadUnit[]; secRefs: (sec: FlowSection<unknown>["sec"]) => string[] }): { refs: Record<string, BookRef>; targets: Record<string, BookTarget> } {
  const refs: Record<string, BookRef> = {}, targets: Record<string, BookTarget> = {};
  const rank = { done: 0, later: 1, cur: 2 } as const;
  for (const s of a.sections || []) {
    const where = s.passed ? "done" : s.state === "cur" ? "cur" : "later";
    for (const ref of a.secRefs(s.sec)) {
      const r = refs[ref], here: BookRef = { where, cp: where === "cur" && s.cp === "cur" };
      // a unit shared by two sections (A1 Ünite 3 and 5): the current one wins, else the first locked one, done only when all are
      if (!r || rank[where] > rank[r.where as keyof typeof rank]) { refs[ref] = here; targets[ref] = { sec: s }; }
    }
  }
  for (const x of a.units) {
    if (a.treeLevels.has(x.lv)) continue;
    const ref = x.lv + "_" + x.u, cpNode = x.nodes.find((n) => n.type === "checkpoint");
    refs[ref] = { where: x.done ? "done" : x.state === "cur" ? "cur" : x.state === "past" ? "past" : "later", cp: x.state === "cur" ? !!cpNode && cpNode.state !== "locked" : x.state === "past" };
    targets[ref] = { unit: x, cpNode };
  }
  return { refs, targets };
}
