/* eslint-disable @typescript-eslint/no-explicit-any -- a session, its focus and a node are open records (types.ts) */
// The session kinds: what chooses the steps of a session and what it ends with. A timed or review session builds blocks of one focus
// until time is up; a path node plays a fixed queue and ends with its stars and XP; a ready-made list (the Lab's Prove it) ends with
// its report. Each builds the `S.session` object, registers itself as the runner's driver, and hands both to `startSession`. The
// questions are the runner's (steps/); the intro and lesson cards and the two reports are steps of their own (steps/Lesson.tsx,
// steps/Report.tsx) that this file gives their data to.
import { setTab } from "../../core/router.ts";
import { S } from "../../core/store.ts";
import { dayKey } from "../../lib/progress.ts";
import { idxUnit, unitIdx, unitLabel } from "../../lib/units.ts";
import { shuffle } from "../../lib/random.ts";
import { hasVoice } from "../../ui/speech.ts";
import { toast } from "../../ui/toast.ts";
import { nextUnitIdx, openReviewSheet, treeSyncPos } from "../path/index.ts";
import { addXp, curIdx, saveProgress, todayKey, unitDone, xpToday } from "../progress/index.ts";
import { nodeEnv } from "./env.ts";
import { fmtMin } from "./model/time.ts";
import { confMoved } from "./model/report.ts";
import { missedList, nodeQueue, nodeStars } from "./model/nodes.ts";
import { nodeWords } from "./model/queues.ts";
import { endSession, runner, runnerLoaded, setDriver, startSession } from "./session.ts";
import type { Session, Step } from "./types.ts";

export interface Action { label: string; primary?: boolean; run: () => void }
interface ReportBase { bar: { count: string; pct: number }; missed: [string, string][]; actions: Action[] }
/** The data of a timed or Lab session's report. */
export interface CustomReport extends ReportBase {
  kind: "custom";
  headline: string;
  studied: string;
  lab: boolean;
  gained: number;
  moved: { n: number; up: number; dn: number };
  tot: number;
  acc: number;
  best: number;
  missedTitle: string;
}
/** The data of a path node's report. */
export interface NodeReport extends ReportBase {
  kind: "node";
  ok: boolean;
  stars: number;
  bonus: number;
  advanced: boolean;
  title: string;
  next: string;
  gained: number;
  tot: number;
  acc: number;
  newWords: any[];
  goal: { xp: number; max: number };
}

let cTimer: ReturnType<typeof setInterval> | undefined;

/* dev only (window.__DEV, set by app/host/dev.ts; the published page never has it): ?only=build,type limits practice to those question
   kinds (flash choice type listen match build drill learn), and a node session then loops its skill instead of finishing */
let devOnlySet: Set<string> | null | undefined;
function devOnly(): Set<string> | null {
  if (devOnlySet === undefined) {
    const o = window.__DEV ? new URLSearchParams(location.search).get("only") : null;
    devOnlySet = o ? new Set(o.split(",").map((x) => x.trim()).filter(Boolean)) : null;
  }
  return devOnlySet;
}
function devQueue(q: Step[]): Step[] {
  const only = devOnly();
  if (!only) return q;
  const r = q.filter((x) => only.has(x.k));
  if (only.has("build") && !r.some((x) => x.k === "build")) r.push({ k: "build", label: "Dev" }, { k: "build", label: "Dev" });   /* a skill without sentences still gets build steps */
  return r.length ? r : [{ k: [...only][0], label: "Dev" }];
}

/** Start a timed (or, with 0 minutes, open-ended) session. `focus` says what kind: a path node, a ready-made list of steps, or a deck. */
export function startCustom(mins: number, focus?: Record<string, any> | null): void {
  const s: Session = {
    kind: "custom", mins, total: Infinity, i: 0, right: 0, wrong: 0, missed: [], start: Date.now(), endAt: mins ? Date.now() + mins * 60000 : Infinity, used: new Set(),
    queue: [], blockN: 0, combo: 0, best: 0, newWords: [], lessonsDone: [], lessonsTried: [], dtCounts: {}, focus: focus || null, xp0: S.xp || 0, lab: !!(focus && focus.lab), conf0: { ...S.conf },
    onEnd: () => clearInterval(cTimer),
  };
  S.session = s;
  if (focus && focus.kind === "node") { s.node = focus.node; s.queue = devQueue(nodeQueue(nodeEnv, focus.node)); s.total = s.queue.length; }
  /* a ready-made list of steps (the Lab's Prove it): the session ends with its report when the list runs out */
  else if (focus && focus.steps) { s.fixed = true; s.queue = focus.steps.slice(); s.total = s.queue.length; }
  clearInterval(cTimer);
  if (mins) cTimer = setInterval(tickCustom, 1000);
  setDriver({ step: customStep, close: closeStep });
  startSession(s);
}

/** Play a path node. */
export function startNode(n: any): void {
  if (n.type === "words" && !nodeWords(nodeEnv, nodeEnv.coreWords(n.lv, n.u)).length) { toast("No words in this unit yet."); return; }
  startCustom(0, { kind: "node", node: n, title: n.title });
}

function tickCustom(): void {
  const s = S.session as Session | null;
  if (!s || s.kind !== "custom" || !s.mins) { clearInterval(cTimer); return; }
  const left = (s.endAt as number) - Date.now();
  if (left <= 0 && !s.timeUp) { s.timeUp = true; toast("Time's up. Finish this one to see your report."); clearInterval(cTimer); }
  else if (!s.half && left < ((s.endAt as number) - (s.start as number)) / 2) { s.half = true; toast("Halfway there. Keep going!"); }
  if (runnerLoaded()) runner().refreshProgress();
}

/** One block of a review session: its focus asked a few times. */
function buildBlock(s: Session): void {
  const q = s.queue, f = s.focus || { kind: "smart", title: "Practice", label: "Practice" };
  if (!s.blockN) q.push({ k: "intro", title: f.title, sub: fmtMin(s.mins as number) + " of focused practice. Stop any time to see your report.", icon: f.kind === "drill" ? "spark" : "target" });
  s.blockN++;
  let ks: string[] = f.kind === "mist" ? ["spot", "fixit", "spot", "fixit"] : f.kind === "smart" ? shuffle(["flash", "choice", "type", hasVoice() ? "listen" : "choice", "match", "build", "drill"]).slice(0, 4) : [f.kind, f.kind, f.kind];
  const only = devOnly();
  if (only) { const a = [...only]; ks = ks.filter((k) => only.has(k)); if (!ks.length) ks = [a[0], a[0], a[0]]; }
  ks.forEach((k) => q.push({ k, pool: f.pool, spool: f.spool, dtype: f.dtype || "", label: f.label }));
}

/** The driver the runner asks for each step: the next queued step, or a report once the session is over. */
function customStep(): Step | null {
  const s = S.session as Session;
  if (s.timeUp) return customReport(s);
  if (!s.queue.length) {
    if (s.node) {
      if (!devOnly()) return finishNode(s);
      s.queue.push(...devQueue(nodeQueue(nodeEnv, s.node)));
      s.total += s.queue.length;
    } else if (s.fixed) { s.timeUp = true; return customReport(s); }
    else buildBlock(s);
  }
  let st = s.queue.shift() as Step;
  if (st.k === "read" || (st.k === "card" && st.i === 0)) s.lessonCheckStart = [s.right, s.wrong];
  if (st.k === "lessonDone") st = lessonDone(s, st);
  s.cur = st;
  s.pool = st.pool || null;
  s.spool = st.spool || null;
  s.stepDtype = st.dtype !== undefined ? st.dtype : "";
  return st;
}

/** A lesson's last card: learned when at least half of its check was right. */
function lessonDone(s: Session, st: Step): Step {
  const [r0, w0] = s.lessonCheckStart || [s.right, s.wrong], r = s.right - r0, w = s.wrong - w0, ok = r + w === 0 || r / (r + w) >= 0.5;
  if (ok && !S.learned[st.L.id]) { S.learned[st.L.id] = 1; saveProgress(); s.lessonsDone.push(st.L); }
  return { ...st, ok, r, w };
}

/** The close button: a timed or Lab session with answers ends with its report, anything else just ends. */
function closeStep(): boolean {
  const s = S.session as Session, timed = s.kind === "custom" && s.mins && !s.node;
  if ((timed || (s.lab && !s.node)) && !s.reported && s.right + s.wrong > 0) {
    s.reported = true;
    s.timeUp = true;
    runner().renderStep();
    return true;
  }
  return false;
}

const idxUnitLabel = (): string => (S.pos ? S.pos.lv + " · " + unitLabel(S.pos.lv, S.pos.u) : "");

/** A node ends when its queue is empty: stars from accuracy, XP, then the stored result; the step is its report. */
function finishNode(s: Session): Step {
  const n = s.node;
  clearInterval(cTimer);
  const { tot, acc, stars } = nodeStars(s.right, s.wrong), old = S.nd[n.id] || {};
  let ok = true, bonus = 0, advanced = false;
  if (n.type === "lesson") { ok = !!S.learned[n.L.id]; if (ok && s.lessonsDone.length) bonus = 10; }
  else if (n.type === "skill") {
    ok = n.part.t === "lesson" ? !!S.learned[n.part.g] : true;
    const rec = S.tp.sk[n.sk.id] || {};
    if (ok) {
      if ((rec.l || 0) <= n.i) bonus = 10;
      S.tp.sk[n.sk.id] = { ...rec, l: Math.max(rec.l || 0, n.i + 1), at: Date.now(), stars: Math.max(rec.stars || 0, stars) };
      treeSyncPos();
    }
  } else if (n.type === "treecp") {
    const rec = S.tp.sec[n.sec.id] || {};
    if (!rec.at) bonus = 20;
    S.tp.sec[n.sec.id] = { at: Date.now(), stars: Math.max(rec.stars || 0, stars), how: "cp" };
    advanced = treeSyncPos();
  } else if (n.type === "review") {
    const today = old.at && dayKey(new Date(old.at)) === todayKey();
    if (!today) bonus = 5;
    S.nd[n.id] = { at: Date.now(), stars: Math.max(old.stars || 0, stars), n: (old.n || 0) + 1 };
  } else {
    if (!old.at || old.migrated) bonus = n.type === "checkpoint" ? 20 : 10;
    S.nd[n.id] = { at: Date.now(), stars: Math.max(old.stars && !old.migrated ? old.stars : 0, stars), n: (old.n || 0) + 1 };
  }
  if (n.type === "checkpoint" && unitIdx(n.lv, n.u) === curIdx()) {
    const j = nextUnitIdx(curIdx());
    if (j !== curIdx()) { const x = idxUnit(j); S.pos = { lv: x.lv, u: x.u }; advanced = true; }
  }
  addXp(bonus);
  saveProgress();
  s.reported = true;
  const unitDoneNow = n.type === "checkpoint" && unitDone(n.lv, n.u), secDoneNow = n.type === "treecp";
  const data: NodeReport = {
    kind: "node", bar: { count: "Done", pct: 100 }, ok, stars: ok ? stars : 0, bonus, advanced, tot, acc: Math.round(acc * 100), gained: (S.xp || 0) - s.xp0,
    title: !ok ? "Almost there" : secDoneNow ? "Section " + n.sec.order + " complete!" : unitDoneNow ? "Unit " + n.u + " complete!" : "Step complete!",
    next: advanced ? idxUnitLabel() : "", newWords: s.newWords, missed: missedList(s.missed), goal: { xp: xpToday(), max: S.prefs.goal || 20 },
    actions: [
      ...(ok ? [] : [{ label: "Try again", run: () => { endSession(true); startNode(n); } }]),
      { label: "Continue", primary: true, run: () => { endSession(true); setTab("path"); } },
    ],
  };
  return { k: "report", data, bar: data.bar };
}

/** The report of a timed review session or a ready-made list (a node has its own). */
function customReport(s: Session): Step {
  if (s.node) return finishNode(s);
  clearInterval(cTimer);
  const tot = s.right + s.wrong, acc = tot ? Math.round(s.right / tot * 100) : 0, secs = Math.round((Date.now() - (s.start as number)) / 1000), prove = !!(s.focus && s.focus.prove);
  if (!s.lab) { S.log = (S.log || []).concat([{ d: todayKey(), min: Math.round(secs / 60), q: tot, acc, w: s.newWords.length, l: 0, st: 0 }]).slice(-30); saveProgress(); }
  s.reported = true;
  const f = s.focus, m = s.mins, lab = !!s.lab;
  const data: CustomReport = {
    kind: "custom", bar: { count: "Report", pct: 100 }, tot, acc, best: s.best || 0, lab, gained: (S.xp || 0) - s.xp0,
    moved: lab ? confMoved(s.conf0, S.conf) : { n: 0, up: 0, dn: 0 },
    headline: prove ? s.right + " of " + tot + " claims confirmed" : tot >= 20 && acc >= 80 ? "Mükemmel! Outstanding session" : acc >= 70 ? "Harika! Great session" : "Aferin! Good effort",
    studied: "You studied for " + fmtMin(Math.max(1, Math.round(secs / 60))) + (s.mins ? " of " + fmtMin(s.mins) : "") + ".",
    missedTitle: prove ? "These need another look" : "To review next time", missed: missedList(s.missed),
    actions: [
      lab ? { label: "Again", run: () => { endSession(true); if (f.again) f.again(); else startCustom(m as number, f); } }
        : { label: "Review again", run: () => { endSession(true); setTab("path"); openReviewSheet(); } },
      { label: "Done", primary: true, run: () => { endSession(true); setTab(lab ? "lab" : "path"); } },
    ],
  };
  return { k: "report", data, bar: data.bar };
}
