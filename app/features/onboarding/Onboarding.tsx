// The onboarding flow: a full-screen walk through steps (model/flow.ts says which, per mode). Each step is a component that draws its own
// header, middle and footer (Flow.tsx); the answers live in `O` here, so going back finds them again.
import "./onboarding.css";
import type { ComponentType } from "preact";
import { useRef, useState } from "preact/hooks";
import { S } from "../../core/store.ts";
import { toast } from "../../ui/toast.ts";
import { AboutStep } from "./steps/About.tsx";
import { AvatarStep } from "./steps/Avatar.tsx";
import { NameStep } from "./steps/Name.tsx";
import { QuizStep, ResultStep, SelfStep, WritingStep } from "./steps/Place.tsx";
import { CastStep, ClassStep, GoalStep, RemindStep, WhatsNewStep } from "./steps/Rest.tsx";
import { FlowCtx, type Answers, type Flow } from "./Flow.tsx";
import { ORDER, type Mode, type StepKey } from "./model/flow.ts";
import { charKind } from "../../lib/char.ts";
import { hasFa } from "./model/names.ts";
import { aiState } from "../tutor/index.ts";

const pendingClass = (): boolean => { try { return !!localStorage.getItem("kumru:pending-class"); } catch { return false; } };

/** A step and when it is left out: a learner who already has a name and a Latin one skips the name step on an update, and so on. */
const STEPS: Record<StepKey, { Comp: ComponentType; skip?: (O: Answers, mode: Mode) => boolean }> = {
  whatsnew: { Comp: WhatsNewStep },
  name: { Comp: NameStep, skip: (O, mode) => mode === "update" && !!O.name && !hasFa(O.name) },
  avatar: { Comp: AvatarStep, skip: (_O, mode) => mode === "update" && charKind(S.char) === "avatar" },
  about: { Comp: AboutStep },
  self: { Comp: SelfStep },
  quiz: { Comp: QuizStep, skip: (O) => O.skipPlace || O.self === "new" },
  writing: { Comp: WritingStep, skip: (O) => O.skipPlace || O.self === "new" || aiState() !== "ready" },
  result: { Comp: ResultStep, skip: (O) => O.skipPlace },
  goal: { Comp: GoalStep },
  class: { Comp: ClassStep, skip: (O) => !!O.classOut || pendingClass() },
  remind: { Comp: RemindStep },
  cast: { Comp: CastStep },
};

/** What the flow starts from: the learner's name, character, profile answers and goal as they are now. */
function initAnswers(mode: Mode): Answers {
  const P0 = S.profile || {};
  return {
    name: S.nick || (S.profileName || "").trim().split(/\s+/)[0] || "",
    char: S.char ?? null,
    ans: { city: (P0.city || {}).raw || "", job: (P0.job || {}).raw || "", hobby: (P0.hobby || {}).raw || "", why: (P0.why || {}).raw || "" },
    self: mode === "update" ? "keep" : null, res: null, ai: null, goal: S.prefs.goal || 20, skipPlace: false, useAlt: "",
  };
}

export function Onboarding({ mode, finish }: { mode: Mode; finish: (after?: () => void) => void }) {
  const [O] = useState(() => initAnswers(mode));
  const keys = ORDER[mode], skipped = (k: StepKey) => !!STEPS[k].skip?.(O, mode);
  const after = (from: number) => { let j = from + 1; while (j < keys.length && skipped(keys[j])) j++; return j; };
  const before = (from: number) => { let j = from - 1; while (j >= 0 && skipped(keys[j])) j--; return j; };
  const [si, setSi] = useState(() => after(-1));
  // an answer from a step that was just left must not land on the next one
  const at = useRef(si);
  at.current = si;
  const go = () => {
    const j = after(at.current);
    if (j >= keys.length) { finish(); toast(mode === "place" ? "Start unit saved" : "All set!"); return; }
    setSi(j);
  };
  const vis = keys.filter((k) => !skipped(k));
  const flow: Flow = {
    mode, first: mode === "full", O, go, finish,
    goBack: () => { const j = before(at.current); if (j >= 0) setSi(j); },
    skipCheck: () => { O.skipPlace = true; go(); },
    hasPrev: before(si) >= 0,
    pos: { i: vis.indexOf(keys[si]), n: vis.length },
  };
  const { Comp } = STEPS[keys[si]];
  return <FlowCtx.Provider value={flow}><Comp key={keys[si]} /></FlowCtx.Provider>;
}
