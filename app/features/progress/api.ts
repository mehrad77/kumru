// What the rest of the app does with progress: build and apply the document, save it (device first, then the server, after a
// short pause), record answers, and read where the learner stands. The document's shape and rules are model/doc.ts.
import { PREF_DEFAULTS, S } from "../../core/store.ts";
import { CONF_KNOWN, confAdd, confBand as band, dayKey, isWeakStats, xpInWeek as weekXp } from "../../lib/progress.ts";
import { LEVELS, levelRank, unitIdx } from "../../lib/units.ts";
import { type AtSnap, type ProgressFields, applyDoc, atSnapshot, buildDoc, stampChanges, weakSummary as buildWeak } from "./model/doc.ts";
import { touch } from "./state.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------- the document ----------

let atSnap: AtSnap | null = null;
const fields = (): ProgressFields => S as unknown as ProgressFields;

export function progressDoc(): Record<string, any> {
  atSnap = stampChanges(fields(), atSnap, Date.now());
  return buildDoc(fields());
}

export function applyProgress(doc: Record<string, any> | null | undefined): void {
  const { legacy, mlang, ...assign } = applyDoc(doc, { prefDefaults: PREF_DEFAULTS, levels: LEVELS }) as Record<string, any>;
  Object.assign(S, assign);
  if (mlang) S.mlang = mlang;
  if (legacy) S.legacy = legacy;
  atSnap = atSnapshot(fields());
  touch();
}

// ---------- the device and the server ----------

const localKey = (): string => "kumru:progress:" + (S.me || "anon");

export function loadLocal(): Record<string, any> | null {
  try { const v = localStorage.getItem(localKey()); return v ? JSON.parse(v) : null; } catch { return null; }
}
export function saveLocal(): void {
  touch();
  try { localStorage.setItem(localKey(), JSON.stringify(progressDoc())); } catch { /* storage is full or off */ }
}

/** A feature that rides along with a progress save (the class-shared book progress) or wants to know it went through. */
export interface SaveHook {
  /** Extra fields sent with the document; `sent` runs once the server took them. */
  rider?: () => { data: Record<string, unknown>; sent?: () => void } | null;
  /** The document was saved on the server. */
  saved?: () => void;
}
const hooks: SaveHook[] = [];
export const addSaveHook = (h: SaveHook): void => { hooks.push(h); };

let timer: ReturnType<typeof setTimeout> | undefined;
export function saveProgress(): void {
  saveLocal();
  if (!S.db || !S.me || S.localOnly) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const riders = hooks.map((h) => h.rider?.()).filter((r): r is NonNullable<typeof r> => !!r);
    const extras = Object.assign({ weak: weakSummary() }, ...riders.map((r) => r.data));
    (S.db as any).doc("data/users/" + S.me + "/progress").set(progressDoc(), extras)
      .then(() => { for (const r of riders) r.sent?.(); for (const h of hooks) h.saved?.(); })
      .catch((e: { code?: string } | null) => { if (e && e.code === "unauthorized") S.localOnly = true; });
  }, 1200);
}

export const weakSummary = () => buildWeak(S.stats, S.ex, Date.now());

// ---------- recording answers ----------

/** Lab practice moves word confidence only: no XP and no active day. */
export const inLab = (): boolean => !!(S.session && S.session.lab);
/** A retry ("Once more") is practice only: it records no answer counts and moves no confidence. */
export const retrying = (): boolean => !!(S.session && S.session.cur && S.session.cur.retry);
export const todayKey = (): string => dayKey(new Date());

export function bumpDay(): void {
  if (inLab()) return;
  const k = todayKey();
  S.days[k] = (S.days[k] || 0) + 1;
}
export function recordCard(id: string, kind: string): void {
  if (retrying()) return;
  const s = S.stats[id] || (S.stats[id] = {});
  s[kind] = (s[kind] || 0) + 1;
  s.t = Date.now();
  s.l = kind === "a" || kind === "w" ? 0 : 1;
  bumpDay();
  saveProgress();
}
/** A new word was shown on its teach card: it counts as met ("learning", not "new") but not as answered. */
export function recordSeen(id: string): void {
  const s = S.stats[id] || (S.stats[id] = {});
  s.v = (s.v || 0) + 1;
}
export function recordEx(k: string, ok: boolean, lessonId?: string): void {
  if (retrying()) return;
  const s = S.ex[k] || (S.ex[k] = { r: 0, w: 0 });
  s[ok ? "r" : "w"]++;
  if (k === "quiz" && lessonId) { const q = S.ex["q:" + lessonId] || (S.ex["q:" + lessonId] = { r: 0, w: 0 }); q[ok ? "r" : "w"]++; } // per lesson, for the hard-words report
  saveProgress();
}
export function recordDrill(k: string, grp: string, right: boolean): void {
  for (const key of [k, "v:" + grp]) { const s = S.drill[key] || (S.drill[key] = { r: 0, w: 0 }); s[right ? "r" : "w"]++; }
  bumpDay();
  saveProgress();
}
export const drillAcc = (k: string): { t: number; acc: number } => { const s = S.drill[k]; const t = s ? s.r + s.w : 0; return { t, acc: t ? s.r / t : 0 }; };
export const isWeak = (id: string): boolean => isWeakStats(S.stats[id]);

// ---------- word confidence (docs/PROGRESS.md) ----------

export const confOf = (id: string): number => S.conf[id] || 0;
export const isKnown = (c: { id: string }): boolean => confOf(c.id) >= CONF_KNOWN;
/** The last change per word, shown once by the answer line. */
export const confMove: Record<string, { from: number; to: number }> = {};
export function bumpConf(id: string, ev: string): void {
  if (ev !== "claim" && retrying()) return;
  const from = confOf(id), v = confAdd(S.conf[id], ev);
  if (v) S.conf[id] = v; else delete S.conf[id];
  confMove[id] = { from, to: confOf(id) };
}
/** new / learning / known / confident, from the score and whether the word was ever answered. */
export const confBand = (id: string) => band(confOf(id), S.stats[id]);
export const confDots = (id: string): number => Math.ceil(confOf(id) / 3);

// ---------- XP and where the learner stands ----------

export const xpToday = (): number => S.xpDays[todayKey()] || 0;
export const xpInWeek = (key: string, days?: Record<string, number>): number => weekXp(key, days || S.xpDays);
/** XP also counts as an active day, so a node finished without answers keeps the streak. */
export function addXp(n: number): void {
  if (!(n > 0) || inLab()) return;
  S.xp = (S.xp || 0) + n;
  const k = todayKey();
  S.xpDays[k] = (S.xpDays[k] || 0) + n;
  if (!S.days[k]) S.days[k] = 1;
}
/** The learner's level is where they stand on the path (S.pos), not a setting. */
export const myLevel = (): string => (S.pos && LEVELS.includes(S.pos.lv) ? S.pos.lv : "A1");
export const unitDone = (lv: string, u: number): boolean => !!S.nd[lv + "_" + u + "_cp"];
export const curIdx = (): number => (S.pos ? unitIdx(S.pos.lv, S.pos.u) : 0);
/** Placed past: before the learner's current unit and not finished the normal way. */
export const isSkippedUnit = (lv: string, u: number): boolean => unitIdx(lv, u) < curIdx() && !unitDone(lv, u);
/** Level distance from the learner: 0 = my level, 1 = below it (review), 2 = above it. */
export const levelDist = (l: string): number => { const d = levelRank(l) - levelRank(myLevel()); return d === 0 ? 0 : d < 0 ? 1 : 2; };
