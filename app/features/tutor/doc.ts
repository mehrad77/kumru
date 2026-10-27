// The tutor's private record, data/users/<me>/tutor: the saved fixes ("Fix my mistakes"), how often "Try it" was right per
// lesson, and the chats' bookkeeping. Signed in it syncs through the host's `tutor` document (window.kumru.merge.tutor joins two
// devices'); signed out it lives on the device under `kumru:tutor`.
import { S } from "../../core/store.ts";
import { bumpDay, recordEx } from "../progress/index.ts";
import { type Mistake, afterAnswer, withMistake } from "./model/mistakes.ts";
import type { CheckResult, Lesson, PlaceResult } from "./model/prompts.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TutorDoc { mistakes: Mistake[]; tries: Record<string, { n: number; ok: number }>; talk: Record<string, unknown>; [k: string]: unknown }
const blank = (): TutorDoc => ({ mistakes: [], tries: {}, talk: {} });

let doc: TutorDoc | null = null;
let chain: Promise<unknown> = Promise.resolve();
let saveT: ReturnType<typeof setTimeout> | null = null;
const path = () => "data/users/" + S.me + "/tutor";

/** The tutor document, loaded once (the server's copy, kept in step by its snapshots; or the device's). */
export async function loadTutorDoc(): Promise<TutorDoc> {
  if (doc) return doc;
  const d = doc = blank();
  if (S.db && S.me) {
    const ref = (S.db as any).doc(path());
    try { const s = await ref.get(); if (s.exists) doc = { ...blank(), ...s.data() }; } catch { /* the device's copy of nothing */ }
    if (ref.onSnapshot) ref.onSnapshot((r: any) => { const x = r.data(); if (x) doc = { ...blank(), ...window.kumru!.merge.tutor(doc as any, x) }; });
  } else {
    try { doc = { ...d, ...JSON.parse(localStorage.getItem("kumru:tutor") || "{}") }; } catch { /* keep the blank one */ }
  }
  return doc ?? d;
}

/** The saved fixes (empty until the document has loaded). */
export const mistakes = (): Mistake[] => doc?.mistakes || [];

export function saveTutorDoc(): void {
  if (!doc) return;
  const snap = JSON.parse(JSON.stringify(doc));
  if (S.db && S.me && !S.localOnly) chain = chain.catch(() => {}).then(() => (S.db as any).doc(path()).set(snap));
  else { try { localStorage.setItem("kumru:tutor", JSON.stringify(snap)); } catch { /* storage is full or off */ } }
}
/** Saves in a moment (several answers in a row make one write). */
export function saveTutorSoon(): void {
  if (saveT) clearTimeout(saveT);
  saveT = setTimeout(saveTutorDoc, 1500);
}

/** Adds a fix to the list (a sentence already there is replaced). The caller saves. */
export function addMistake(m: Mistake): void {
  if (!doc) return;
  const l = withMistake(doc.mistakes, m, Date.now());
  if (l) doc.mistakes = l;
}

/** After one answer to a saved fix: two right answers retire it. */
export function mistakeSeen(m: Mistake, ok: boolean): void {
  if (doc) doc.mistakes = afterAnswer(doc.mistakes, m, ok);
  saveTutorSoon();
}

/** A "Try it" check: the lesson's counters, a new saved fix for a wrong Turkish sentence, today's practice. */
export async function recordCheck(lesson: Lesson, text: string, res: CheckResult): Promise<void> {
  const d = await loadTutorDoc();
  const t = d.tries[lesson.id] || (d.tries[lesson.id] = { n: 0, ok: 0 });
  t.n++;
  if (res.ok) t.ok++;
  if (!res.ok && res.language === "tr") {
    const n0 = res.notes[0] || { fa: "", en: "", lesson: "" };
    addMistake({ orig: text, fixed: res.corrected, lesson: n0.lesson || lesson.id, fa: n0.fa, en: n0.en, src: "try" });
  }
  bumpDay();
  recordEx("write", res.ok);
  saveTutorDoc();
}

/** The mistakes of the placement writing sample join the list. */
export async function seedPlacementMistakes(ai: PlaceResult | null | undefined): Promise<void> {
  if (!ai) return;
  await loadTutorDoc();
  for (const s of ai.sentences) {
    if (!s.ok && s.fixed && s.orig) { const n = s.notes[0] || { fa: "", en: "", lesson: "" }; addMistake({ orig: s.orig, fixed: s.fixed, lesson: n.lesson, fa: n.fa, en: n.en, src: "placement" }); }
  }
  saveTutorDoc();
}
