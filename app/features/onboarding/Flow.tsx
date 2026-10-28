// What every step of the flow shares: the context, the step's frame (a slim header, a scrolling middle, a sticky footer) and its small
// parts. The markup and class names are onboarding.css's.
import { createContext, toChildArray, type ComponentChildren } from "preact";
import { useContext, useEffect, useRef } from "preact/hooks";
import { ICON } from "../../core/dom.ts";
import { Pup } from "../../ui/Pup.tsx";
import type { PlacementResult } from "../placement/index.ts";
import type { About, Mode, WritingResult } from "./model/flow.ts";

/** The answers the flow collects; kept here, not in a step, so going back finds them again. */
export interface Answers {
  name: string; char: unknown; ans: About;
  self: string | null; res: PlacementResult | null; ai: WritingResult | null;
  skipPlace: boolean; useAlt: string;
  classOut?: boolean; classPicked?: boolean;
}

export interface Flow {
  mode: Mode;
  /** A first-time learner can't skip: no skip links, and Escape / the back button don't close it. */
  first: boolean;
  O: Answers;
  go(): void;
  goBack(): void;
  /** Close the flow; `after` runs a moment later (the cast step's "Start a 10-minute study plan"). */
  finish(after?: () => void): void;
  skipCheck(): void;
  hasPrev: boolean;
  /** The step's place among the steps that are not skipped. */
  pos: { i: number; n: number };
}

export const FlowCtx = createContext<Flow>(null as unknown as Flow);
export const useFlow = (): Flow => useContext(FlowCtx);

/** A step: header (back button, progress), scrolling middle (`cls` on its `.onb`) and sticky footer. The footer shows only if it holds something. */
export function StepView({ cls, dots, foot, children }: { cls?: string; dots?: boolean; foot?: ComponentChildren; children?: ComponentChildren }) {
  const f = useFlow(), scroll = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = 0; }, []);
  return (
    <>
      <div class="onb-head">
        {f.hasPrev ? <button class="onb-bk" type="button" aria-label="Back to the previous step" onClick={f.goBack} dangerouslySetInnerHTML={{ __html: ICON.back }} /> : <span />}
        {dots ? <Dots /> : <span />}
        <span />
      </div>
      <div class="onb-scroll" ref={scroll}><div class={"onb" + (cls ? " " + cls : "")}>{children}</div></div>
      {toChildArray(foot).length ? <div class="onb-foot">{foot}</div> : null}
    </>
  );
}

function Dots() {
  const { pos } = useFlow();
  return (
    <div class="onb-dots">
      <span class="onb-pips" aria-hidden="true">{Array.from({ length: pos.n }, (_, j) => <i class={j === pos.i ? "on" : ""} />)}</span>
      <span class="onb-step">{"Step " + (pos.i + 1) + " of " + pos.n}</span>
    </div>
  );
}

/** The primary footer button. */
export const Next = ({ text, onClick, disabled }: { text?: string; onClick: () => void; disabled?: boolean }) =>
  <button class="btn primary" type="button" disabled={disabled || undefined} onClick={onClick}>{text || "Continue"}</button>;

/** A quiet "Skip for now" link; first-time learners don't get it unless `keep`. */
export function Skip({ text, onClick, keep }: { text?: string; onClick?: () => void; keep?: boolean }) {
  const f = useFlow();
  return f.first && !keep ? null : <button class="linkish" type="button" onClick={onClick || f.go}>{text || "Skip for now"}</button>;
}

/** The waiting view while the tutor works; `stop` adds a Stop link. */
export function Think({ msg, stop }: { msg: string; stop?: () => void }) {
  return (
    <StepView foot={stop ? <Skip text="Stop" onClick={stop} keep /> : null}>
      <Pup mood="think" size={96} />
      <p aria-live="polite">{msg}</p>
      <div class="think-bar"><span /></div>
    </StepView>
  );
}
