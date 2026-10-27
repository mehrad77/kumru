// The runner's imperative API: what a question (or a session kind's own step) calls to set the footer, give feedback, move on and
// count. It writes the signals in state.ts, which Runner.tsx draws. Loaded with the first session (session.ts); only signals-core here.
import { $, el } from "../../core/dom.ts";
import { S } from "../../core/store.ts";
import { PUP, pupLine, rndOf } from "../../ui/kerim/kerim.ts";
import { hideToast } from "../../ui/toast.ts";
import { addXp } from "../progress/index.ts";
import { fmtClock } from "./model/time.ts";
import { requeue as requeueStep } from "./model/requeue.ts";
import { prepareStep } from "./prepare.ts";
import { foot, progress, view } from "./state.ts";
import type { Child, Driver, Progress, Session, Step } from "./types.ts";

export { foot, progress, view };

let driver: Driver | null = null, serial = 0, unmountRunner: (() => void) | null = null;

/** Praise for a flawless answer, and for one that needed a slip forgiven: Turkish with its Persian echo. */
export const PRAISE: [string, string][] = [["Harika!", "عالی!"], ["Süper!", "فوق‌العاده!"], ["Çok iyi!", "خیلی خوب!"], ["Aferin!", "آفرین!"], ["Mükemmel!", "بی‌نقص!"], ["Bravo!", "براوو!"]];
export const NEAR_PRAISE: [string, string][] = [["Az kaldı!", "خیلی نزدیک بود!"], ["Neredeyse!", "تقریباً درست!"], ["Çok yakın!", "کم‌مونده بود!"]];
/** A cheer line appears when the run of right answers reaches one of these. */
const COMBOS = [3, 5, 8, 12, 16, 20, 25, 30, 40, 50];

/** The top bar for the running session: steps of a path node or a fixed list, or the clock of a timed one. */
export function computeProgress(s: Session): Progress {
  const timed = s.kind === "custom" && s.mins && !s.node, byStep = s.node || s.fixed;
  const pct = byStep ? Math.min(100, s.i / Math.max(1, s.total) * 100) : timed ? Math.min(100, (Date.now() - (s.start as number)) / ((s.endAt as number) - (s.start as number)) * 100) : 0;
  const count = byStep ? Math.min(s.i + 1, s.total) + " / " + s.total : timed ? (s.timeUp ? "Time's up" : fmtClock((s.endAt as number) - Date.now())) : "";
  return { count, pct, now: s.i, max: s.total };
}

/** Redraw the top bar from the session (a timed session calls this every second). */
export function refreshProgress(): void {
  if (S.session) progress.value = computeProgress(S.session);
}

/** Put the runner on screen (session.ts), then draw the first step. */
export async function mount(s: Session, d: Driver, alive: () => boolean): Promise<void> {
  driver = d;
  view.value = { t: "none" };
  foot.value = { t: "none" };
  progress.value = computeProgress(s);
  const [{ mountIsland }, { Runner }] = await Promise.all([import("../../ui/mount.ts"), import("./Runner.tsx")]);
  if (!alive()) return;
  const un = await mountIsland($("#session"), Runner);
  if (!alive()) { un(); return; }
  unmountRunner = un;
  renderStep();
}

export function unmount(): void {
  unmountRunner?.();
  unmountRunner = null;
  view.value = { t: "none" };
  foot.value = { t: "none" };
}

/** Draw the session's next step: the driver chooses it. The step the driver returns is asked here (a question, an intro or lesson card, a report). */
export function renderStep(): void {
  const s = S.session as Session | null;
  if (!s || !driver) return;
  foot.value = { t: "none" };
  if ($("#toast").classList.contains("has-undo")) hideToast();
  window.scrollTo(0, 0);
  const st = driver.step();
  if (!st || S.session !== s) return;
  const prep = prepareStep(st);
  /* a report names its own count and fills the bar */
  progress.value = st.bar ? { ...computeProgress(s), count: st.bar.count, pct: st.bar.pct } : computeProgress(s);
  view.value = { t: "step", n: ++serial, st, prep };
}

/** To the step after this one. */
export function next(): void {
  if (!S.session) return;
  S.session.i++;
  renderStep();
}

/** The close button. */
export function closeSession(): boolean {
  return !!driver && driver.close();
}

/** The footer is a Check-style button. `ready` says whether it is enabled; the returned function asks again (call it when the answer changes). */
export function footCheck(label: string | undefined, ready: () => boolean, onCheck: () => void): () => void {
  let cur: Extract<typeof foot.value, { t: "check" }> = { t: "check", label: label || "Check", ready: ready(), run: onCheck };
  foot.value = cur;
  return () => { if (foot.value === cur) foot.value = cur = { ...cur, ready: ready() }; };
}

/** The footer is a line of hint (Tap an answer). */
export function footHint(text: string): void {
  foot.value = { t: "hint", text };
}

/** The footer rates a flashcard. */
export function footRate(rate: (k: "a" | "g" | "e", ev: string) => void): void {
  foot.value = { t: "rate", rate };
}

/** A path step answered wrong comes back later (model/requeue.ts). */
export function requeue(st: Step | null | undefined): void {
  requeueStep(S.session, st);
}

/** Count an answer and show its result: right or wrong, the head, what explains it, Continue. A retry counts for neither stars nor XP. */
export function feedback(ok: boolean, head: string, ...body: Child[]): void {
  const s = S.session as Session, retry = s.cur && s.cur.retry;
  if (!retry) { if (ok) { s.right++; addXp(1); } else s.wrong++; }
  if (!ok) requeue(s.cur);
  s.combo = ok ? (s.combo || 0) + 1 : 0;
  s.best = Math.max(s.best || 0, s.combo);
  if (ok && COMBOS.includes(s.combo)) {
    const [t, f] = rndOf(PUP.cheer);
    body.push(pupLine("cheer", t + " " + s.combo + " in a row!", f + " " + s.combo + " تا پشت سر هم!"));
  }
  /* an answer with a slip is not flawless: it gets a "nearly" line */
  foot.value = { t: "fb", ok, head, praise: ok ? rndOf(head === "Almost" ? NEAR_PRAISE : PRAISE) : null, body };
}

/** Remember what was missed for the report. */
export function markMiss(tr: string, mean: string): void {
  if (S.session) S.session.missed.push([tr, mean]);
}

/** A node of praise for the end of a lesson (Turkish and its Persian echo). */
export function praiseEl(tag = "div", cls = "praise", list: [string, string][] = PRAISE): HTMLElement {
  const [tr, fa] = rndOf(list);
  return el(tag, { class: cls }, el("span", { lang: "tr", text: tr }), el("span", { lang: "fa", text: fa }));
}
