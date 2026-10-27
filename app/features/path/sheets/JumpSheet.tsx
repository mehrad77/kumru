// Jump here: a locked unit opens only after a short adaptive check of the units being skipped (docs/PROGRESS.md, section 5). Same
// climb as onboarding's: start at the unit before the target and drop one unit after each failed probe.
import "../path.css";
import { useState } from "preact/hooks";
import { idxUnit, unitLabel } from "../../../lib/units.ts";
import { Lazy } from "../../../ui/Lazy.tsx";
import { Pup } from "../../../ui/Pup.tsx";
import { closeSheet } from "../../../ui/sheet.ts";
import { type PlacementResult, applyPlacement, loadClimb } from "../../placement/index.ts";
import { curIdx } from "../../progress/index.ts";
import type { RoadUnit } from "../course.ts";

type Stage = { t: "intro" } | { t: "quiz" } | { t: "fail" } | { t: "pass"; R: PlacementResult; to: number };

export function JumpSheet({ x }: { x: RoadUnit }) {
  const [C] = useState(curIdx), T = x.i, [stage, setStage] = useState<Stage>({ t: "intro" });
  const jump = { jump: { from: C, target: T } };
  const result = (R: PlacementResult) => {
    const to = Math.min(R.idx, T);
    if (to <= C) { applyPlacement(R, null, jump); setStage({ t: "fail" }); }
    else setStage({ t: "pass", R, to });
  };
  if (stage.t === "intro") {
    return (
      <>
        <p class="hint">{x.lv + " · " + unitLabel(x.lv, x.u) + ". To jump, show you know the units in between: a short check, a few minutes. The words you miss stay on your list."}</p>
        <button class="btn primary block" type="button" onClick={() => setStage({ t: "quiz" })}>Start the check</button>
        <button class="btn block" type="button" onClick={closeSheet}>Cancel</button>
      </>
    );
  }
  if (stage.t === "quiz") return <div class="pl-body"><Lazy load={loadClimb} props={{ startIdx: T - 1, onDone: result, bounds: { lo: C - 1, hi: T } }} /></div>;
  if (stage.t === "fail") {
    return (
      <>
        <Pup mood="sad" size={88} />
        <p class="hint">Not yet. These units still have words and endings to meet, so keep going from where you are. Your answers were saved.</p>
        <button class="btn primary block" type="button" onClick={closeSheet}>OK</button>
      </>
    );
  }
  const { R, to } = stage, at = idxUnit(to), before = idxUnit(to - 1);
  return (
    <>
      <Pup mood="cheer" size={88} />
      <p class="hint">{to === T ? "You know enough of the units in between. " + x.lv + " Unit " + x.u + " is open for you." : "You did well through " + unitLabel(before.lv, before.u) + ". " + at.lv + " · " + unitLabel(at.lv, at.u) + " looks like the right place to start."}</p>
      <button class="btn primary block" type="button" onClick={() => { applyPlacement(R, at, jump); closeSheet(); }}>{"Jump to Unit " + at.u + (at.lv !== x.lv ? " (" + at.lv + ")" : "")}</button>
      <button class="btn block" type="button" onClick={() => { applyPlacement(R, null, jump); closeSheet(); }}>Stay where I am</button>
    </>
  );
}
