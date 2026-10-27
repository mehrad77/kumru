// What a finished Test out does to the learner's progress (the rules are model/testout.ts).
import { S } from "../../core/store.ts";
import { type PlacementResult, scoreRecs, type Recs } from "../placement/index.ts";
import { saveProgress } from "../progress/index.ts";
import { skillParts, treeSecs, treeSyncPos } from "./course.ts";
import { applyTreeTest } from "./model/testout.ts";
import { closeUnits } from "./state.ts";

/** Marks sections `C`..`to`-1 and their skills as tested out (`to` = `C` marks nothing and records the attempt). */
export function applyTreeTestNow(R: PlacementResult, C: number, to: number): void {
  applyTreeTest({
    S: S as never, secs: treeSecs, scoreRecs: (recs) => scoreRecs(recs as Recs), parts: (sk) => skillParts(sk).length,
    syncPos: treeSyncPos, save: saveProgress, closeUnits, now: Date.now,
  }, R, C, to);
}
