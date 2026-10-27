// Test out: a locked section opens only after a short adaptive check of the sections being skipped (docs/PROGRESS.md, section 8).
// Same climb as Jump here, one section per step: start at the section before the target, drop one section after each failed probe,
// at most 5 probes.
import "../path.css";
import { useState } from "preact/hooks";
import { Lazy } from "../../../ui/Lazy.tsx";
import { Pup } from "../../../ui/Pup.tsx";
import { closeSheet } from "../../../ui/sheet.ts";
import { type PlacementResult, loadClimb, plSectionItems } from "../../placement/index.ts";
import { treeSecs } from "../course.ts";
import { applyTreeTestNow } from "../testout.ts";

type Stage = { t: "intro" } | { t: "quiz" } | { t: "fail" } | { t: "pass"; R: PlacementResult; to: number };

/** `C` is the index of the learner's section, `T` that of the one to open, both in `treeSecs()` when the sheet was opened. */
export function TestOutSheet({ C, T }: { C: number; T: number }) {
  const secs = treeSecs(), [stage, setStage] = useState<Stage>({ t: "intro" });
  const result = (R: PlacementResult) => {
    const to = Math.min(R.idx, T);
    if (to <= C) { applyTreeTestNow(R, C, C); setStage({ t: "fail" }); }
    else setStage({ t: "pass", R, to });
  };
  if (stage.t === "intro") {
    return (
      <>
        <p class="hint">{"Section " + secs[T].order + " · " + secs[T].title + ". To skip ahead, show you know the sections in between: a short check, a few minutes. The words you miss stay on your list."}</p>
        <button class="btn primary block" type="button" onClick={() => setStage({ t: "quiz" })}>Start the check</button>
        <button class="btn block" type="button" onClick={closeSheet}>Cancel</button>
      </>
    );
  }
  if (stage.t === "quiz") return <div class="pl-body"><Lazy load={loadClimb} props={{ startIdx: T - 1, onDone: result, bounds: { lo: C - 1, hi: T }, opt: { items: plSectionItems, max: secs.length - 1 } }} /></div>;
  if (stage.t === "fail") {
    return (
      <>
        <Pup mood="sad" size={88} />
        <p class="hint">Not yet. These sections still have words and endings to meet, so keep going from where you are. Your answers were saved.</p>
        <button class="btn primary block" type="button" onClick={closeSheet}>OK</button>
      </>
    );
  }
  const { R, to } = stage;
  return (
    <>
      <Pup mood="cheer" size={88} />
      <p class="hint">{to === T ? "You know enough of the sections in between. Section " + secs[T].order + " is open for you." : "You did well through section " + secs[to - 1].order + ". Section " + secs[to].order + " looks like the right place to start."}</p>
      <button class="btn primary block" type="button" onClick={() => { applyTreeTestNow(R, C, to); closeSheet(); }}>{"Open section " + secs[to].order}</button>
      <button class="btn block" type="button" onClick={() => { applyTreeTestNow(R, C, C); closeSheet(); }}>Stay where I am</button>
    </>
  );
}
