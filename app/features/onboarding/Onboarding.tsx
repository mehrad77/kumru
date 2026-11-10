// The onboarding flow: a full-screen walk through steps, one choice per screen (model/flow.ts says which, per mode). Each step is a
// component that draws its own progress, middle and footer (Flow.tsx); the answers live in `O` here, so going back finds them again.
// A step that throws while drawing is caught here and offers to go on: a new learner cannot leave the flow, so a broken step must
// never leave a blank screen.
import "./onboarding.css";
import type { ComponentChildren, ComponentType } from "preact";
import { useEffect, useErrorBoundary, useLayoutEffect, useRef, useState } from "preact/hooks";
import { helpLang } from "../../core/lang.ts";
import { S } from "../../core/store.ts";
import { toast } from "../../ui/toast.ts";
import { CharStep, dropKit } from "./steps/Character.tsx";
import { HomeStep } from "./steps/Home.tsx";
import { LangStep } from "./steps/Lang.tsx";
import { NameStep } from "./steps/Name.tsx";
import { QuizStep, ResultStep, SelfStep, WritingStep } from "./steps/Place.tsx";
import { CastStep, ClassStep, RemindStep, WhatsNewStep } from "./steps/Rest.tsx";
import { FlowCtx, Nav, StepView, useFlow, type Answers, type Flow } from "./Flow.tsx";
import { initAnswers } from "./model/answers.ts";
import { ORDER, type CharScreen, type Mode, type StepKey } from "./model/flow.ts";
import { fill } from "./model/words.ts";
import { charKind } from "../../lib/char.ts";
import { hasFa } from "./model/names.ts";
import { aiState } from "../tutor/index.ts";

const pendingClass = (): boolean => { try { return !!localStorage.getItem("kumru:pending-class"); } catch { return false; } };

/** A character screen: left out on an update for a learner who already has a Sahne character, and once the builder failed to load. */
const char = (screen: CharScreen) => ({
  Comp: () => <CharStep screen={screen} />,
  skip: (O: Answers, mode: Mode) => (mode === "update" && charKind(S.char) === "avatar") || O.kit === "failed",
});

/** A step and when it is left out: a learner who already has a Latin name skips the name step on an update, and so on. */
const STEPS: Record<StepKey, { Comp: ComponentType; skip?: (O: Answers, mode: Mode) => boolean }> = {
  whatsnew: { Comp: WhatsNewStep },
  lang: { Comp: LangStep },
  name: { Comp: NameStep, skip: (O, mode) => mode === "update" && !!O.name && !hasFa(O.name) },
  body: char("body"), face: char("face"), hair: char("hair"), clothes: char("clothes"), extras: char("extras"),
  home: { Comp: HomeStep },
  self: { Comp: SelfStep },
  quiz: { Comp: QuizStep, skip: (O) => O.skipPlace || O.self === "new" },
  writing: { Comp: WritingStep, skip: (O) => O.skipPlace || O.self === "new" || aiState() !== "ready" },
  result: { Comp: ResultStep, skip: (O) => O.skipPlace },
  class: { Comp: ClassStep, skip: (O) => !!O.classOut || pendingClass() },
  remind: { Comp: RemindStep },
  cast: { Comp: CastStep },
};

/** A step that threw while drawing: say so, and go on. */
function Broken() {
  const f = useFlow();
  return <StepView dots foot={<Nav onClick={f.go} />}><p role="status">{f.t("oops")}</p></StepView>;
}

/** Catches a step that throws while drawing (keyed by step, so the next step starts clean). */
function Guard({ k, children }: { k: StepKey; children: ComponentChildren }) {
  const [err] = useErrorBoundary((e) => console.warn("onboarding step " + k, e));
  return err ? <Broken /> : <>{children}</>;
}

export function Onboarding({ mode, finish }: { mode: Mode; finish: (after?: () => void) => void }) {
  const [O] = useState(() => initAnswers(mode, S, helpLang(), navigator.languages || [navigator.language]));
  const [, tick] = useState(0);
  // the builder lives as long as the flow
  useEffect(() => () => dropKit(O), []);
  const keys = ORDER[mode], skipped = (k: StepKey) => !!STEPS[k].skip?.(O, mode);
  const after = (from: number) => { let j = from + 1; while (j < keys.length && skipped(keys[j])) j++; return j; };
  const before = (from: number) => { let j = from - 1; while (j >= 0 && skipped(keys[j])) j--; return j; };
  const [si, setSi] = useState(() => after(-1));
  // an answer from a step that was just left must not land on the next one
  const at = useRef(si);
  at.current = si;
  // the dialog speaks the learner's language: Persian right to left
  const host = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const back = host.current?.closest(".onb-back") as HTMLElement | null;
    if (back) { back.dir = O.lang === "fa" ? "rtl" : "ltr"; back.lang = O.lang; }
  });
  const go = () => {
    const j = after(at.current);
    if (j >= keys.length) { finish(); toast(mode === "place" ? "Start unit saved" : fill(O.lang, "allSet")); return; }
    setSi(j);
  };
  const vis = keys.filter((k) => !skipped(k));
  const flow: Flow = {
    mode, first: mode === "full", O, go, finish,
    t: (k, vars) => fill(O.lang, k, vars),
    setLang: (l) => { O.lang = l; tick((n) => n + 1); },
    goBack: () => { const j = before(at.current); if (j >= 0) setSi(j); },
    skipCheck: () => { O.skipPlace = true; go(); },
    hasPrev: before(si) >= 0,
    pos: { i: Math.max(0, vis.indexOf(keys[si])), n: vis.length },
  };
  const { Comp } = STEPS[keys[si]];
  return (
    <FlowCtx.Provider value={flow}>
      <span ref={host} hidden />
      <Guard key={keys[si]} k={keys[si]}><Comp /></Guard>
    </FlowCtx.Provider>
  );
}
