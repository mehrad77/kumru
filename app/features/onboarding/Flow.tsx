// What every step of the flow shares: the context, the step's frame (the progress at the top, a scrolling middle, Back and Next
// at the bottom in thumb reach) and its small parts. The markup and class names are onboarding.css's.
import { createContext, toChildArray, type ComponentChildren } from "preact";
import { useContext, useEffect, useRef } from "preact/hooks";
import { ICON } from "../../core/dom.ts";
import { Pup } from "../../ui/Pup.tsx";
import type { PlacementResult } from "../placement/index.ts";
import type { About, Mode, WritingResult } from "./model/flow.ts";
import type { UiLang, WordKey } from "./model/words.ts";
import type { CharKit } from "./steps/Character.tsx";

/** The answers the flow collects; kept here, not in a step, so going back finds them again. */
export interface Answers {
  lang: UiLang; name: string; char: unknown; ans: About;
  self: string | null; res: PlacementResult | null; ai: WritingResult | null;
  skipPlace: boolean; useAlt: string;
  classOut?: boolean; classPicked?: boolean;
  /** The character screens' builder, loaded once (steps/Character.tsx); "failed" when it did not load. */
  kit?: CharKit | "failed";
}

export interface Flow {
  mode: Mode;
  /** A first-time learner can't leave the flow: Escape and the back button don't close it. */
  first: boolean;
  O: Answers;
  /** The flow's word in the learner's language (model/words.ts). */
  t(k: WordKey, vars?: Record<string, string | number>): string;
  setLang(l: UiLang): void;
  go(): void;
  goBack(): void;
  /** Close the flow; `after` runs a moment later (the cast step's "Read your first story"). */
  finish(after?: () => void): void;
  skipCheck(): void;
  hasPrev: boolean;
  /** The step's place among the steps that are not skipped. */
  pos: { i: number; n: number };
}

export const FlowCtx = createContext<Flow>(null as unknown as Flow);
export const useFlow = (): Flow => useContext(FlowCtx);

/** A step: the progress (`dots`), the scrolling middle (`cls` on its `.onb`; `fill`: a middle that does not scroll, for the builder,
 *  which scrolls its own panel under its preview) and the footer. */
export function StepView({ cls, dots, fill, foot, children }: { cls?: string; dots?: boolean; fill?: boolean; foot?: ComponentChildren; children?: ComponentChildren }) {
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = 0; }, []);
  return (
    <>
      <div class="onb-head">{dots ? <Progress /> : null}</div>
      <div class={"onb-scroll" + (fill ? " onb-fill" : "")} ref={scroll}><div class={"onb" + (cls ? " " + cls : "")}>{children}</div></div>
      {toChildArray(foot).length ? <div class="onb-foot">{foot}</div> : null}
    </>
  );
}

function Progress() {
  const { pos, t } = useFlow(), pc = pos.n ? Math.round(((pos.i + 1) / pos.n) * 100) : 0;
  return (
    <div class="onb-prog">
      <span class="onb-bar" role="progressbar" aria-valuemin={1} aria-valuemax={pos.n} aria-valuenow={pos.i + 1} aria-label={t("step", { i: pos.i + 1, n: pos.n })}><i style={`width:${pc}%`} /></span>
      <span class="onb-step" aria-hidden="true">{t("step", { i: pos.i + 1, n: pos.n })}</span>
    </div>
  );
}

/** The footer's row: Back (when there is a step before) and the primary button. */
export function Nav({ text, onClick, disabled }: { text?: string; onClick: () => void; disabled?: boolean }) {
  const f = useFlow();
  return (
    <div class="onb-nav">
      {f.hasPrev ? <button class="btn onb-bk" type="button" onClick={f.goBack}><span aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICON.back }} />{f.t("back")}</button> : null}
      <button class="btn primary" type="button" disabled={disabled || undefined} onClick={onClick}>{text || f.t("next")}</button>
    </div>
  );
}

/** A quiet link under the buttons ("Not now", "Skip"). */
export const Quiet = ({ text, onClick }: { text: string; onClick: () => void }) => <button class="linkish" type="button" onClick={onClick}>{text}</button>;

/** The placement steps' (`place` mode) name for the footer's row. */
export const Next = Nav;

/** A quiet "Skip for now" link (the placement steps); first-time learners don't get it unless `keep`. */
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
