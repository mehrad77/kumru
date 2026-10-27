// The progress document (docs/SPECS_SCHEMA.md §3.1) as pure functions: build it from the learner's fields, apply a saved or
// merged one back, stamp what changed for the two-device merge, and summarise the hard words. State comes in as arguments.
import { boxToConf, cardGood, cardTries } from "../../../lib/progress.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Rec = Record<string, any>;

export interface ProgressFields {
  conf: Rec; confAt: Rec; at: Rec; boxOld: Rec | null; learned: Rec; stats: Rec; drill: Rec; days: Rec; ex: Rec; log: unknown[]; st: Rec;
  prefs: Rec; onb: number; xp: number; xpDays: Rec; nd: Rec; tp: { v: 1; sk: Rec; sec: Rec; mig?: 1; tests?: unknown };
  cheerSeen: number; pos: { lv: string; u: number } | null; char: unknown; profile: unknown; placed: unknown; nick: string;
}

/** The fields whose last change is stamped in `at` (docs/SPECS.md §9.2). */
export const AT_FIELDS = ["nick", "char", "profile", "prefs", "pos", "placed"] as const;

export interface AtSnap { f: Record<string, string>; conf: Record<string, number> }

export const atSnapshot = (s: Pick<ProgressFields, "conf"> & Rec): AtSnap =>
  ({ f: Object.fromEntries(AT_FIELDS.map((f) => [f, JSON.stringify(s[f] ?? null)])), conf: { ...s.conf } });

/**
 * Stamp what changed since `snap` (what was last loaded or saved): per-field times in `at`, per-word times in `confAt`.
 * Mutates the state's `at` and `confAt`; returns the new snapshot. The first call only takes the snapshot.
 */
export function stampChanges(s: ProgressFields, snap: AtSnap | null, now: number): AtSnap {
  s.at = s.at || {};
  s.confAt = s.confAt || {};
  if (!snap) return atSnapshot(s);
  for (const f of AT_FIELDS) {
    const j = JSON.stringify((s as Rec)[f] ?? null);
    if (j !== snap.f[f]) { s.at[f] = now; snap.f[f] = j; }
  }
  for (const id in s.conf) if (s.conf[id] !== snap.conf[id]) s.confAt[id] = now;
  for (const id in snap.conf) if (!(id in s.conf)) s.confAt[id] = now;
  snap.conf = { ...s.conf };
  return snap;
}

export function buildDoc(s: ProgressFields): Rec {
  const tree = s.tp.mig || Object.keys(s.tp.sk).length || Object.keys(s.tp.sec).length;
  return {
    v: 5, conf: s.conf, confAt: s.confAt, at: s.at, ...(s.boxOld ? { box: s.boxOld } : {}), gram: s.learned, stats: s.stats, drill: s.drill,
    days: s.days, ex: s.ex, log: s.log || [], nick: s.nick, st: s.st, prefs: s.prefs, onb: s.onb || 0, xp: s.xp || 0, xpDays: s.xpDays, nd: s.nd,
    ...(tree ? { tree: s.tp } : {}), cheerSeen: s.cheerSeen || 0, ...(s.pos ? { pos: s.pos } : {}), ...(s.char ? { char: s.char } : {}),
    ...(s.profile ? { profile: s.profile } : {}), ...(s.placed ? { placed: s.placed } : {}),
  };
}

export interface ApplyContext { prefDefaults: Rec; levels: readonly string[] }
export type AppliedFields = ProgressFields & { pv: number; legacy: { level?: unknown; startUnit?: unknown } | null; mlang?: string };

/** What a saved document says, as the fields to assign (a deep copy: the document is not kept). `nick` is absent when the document has none. */
export function applyDoc(doc: Rec | null | undefined, ctx: ApplyContext): Partial<AppliedFields> & ProgressFields & { pv: number } {
  const pd: Rec = JSON.parse(JSON.stringify(doc || {}));
  const conf = pd.conf || boxToConf(pd.box);
  const stats = pd.stats || {};
  const pv = +pd.v || 0;
  const prefs: Rec = { ...ctx.prefDefaults, ...(pd.prefs || {}) };
  const out: any = {
    conf, boxOld: pd.box || null, learned: pd.gram || {}, stats, drill: pd.drill || {}, days: pd.days || {}, ex: pd.ex || {}, log: pd.log || [],
    st: pd.st || {}, prefs, char: pd.char || null, profile: pd.profile || null, placed: pd.placed || null, onb: +pd.onb || 0,
    xp: +pd.xp || 0, xpDays: pd.xpDays || {}, nd: pd.nd || {},
    tp: { v: 1, sk: (pd.tree && pd.tree.sk) || {}, sec: (pd.tree && pd.tree.sec) || {}, ...(pd.tree && pd.tree.mig ? { mig: 1 } : {}), ...(pd.tree && pd.tree.tests ? { tests: pd.tree.tests } : {}) },
    cheerSeen: +pd.cheerSeen || 0, pv,
    pos: pd.pos && ctx.levels.includes(pd.pos.lv) ? { lv: pd.pos.lv, u: Math.max(1, Math.min(6, +pd.pos.u || 1)) } : null,
    confAt: pd.confAt || Object.fromEntries(Object.keys(conf).map((id) => [id, +((stats[id] || {}).t) || 0])), at: pd.at || {},
    legacy: null,
  };
  if (pd.prefs && pd.prefs.lang) out.mlang = pd.prefs.lang;
  if (typeof pd.nick === "string") out.nick = pd.nick;
  if (pv < 3) {
    out.legacy = { level: prefs.level, startUnit: prefs.startUnit };
    delete prefs.level; delete prefs.startUnit; delete prefs.talkPlan;
  }
  return out;
}

/**
 * The small hard-words summary the owner's report and the teacher view use (docs/SPECS_SCHEMA.md §3.4): the 50 cards with at
 * least 3 tries and the lowest accuracy, the 20 lessons with the most quiz misses; nothing else leaves the progress document.
 */
export function weakSummary(stats: Rec, ex: Rec, now: number): { v: 1; at: number; cards: { id: string; tries: number; wrong: number }[]; lessons: { id: string; tries: number; misses: number }[] } {
  const cards: { id: string; tries: number; wrong: number }[] = [], lessons: { id: string; tries: number; misses: number }[] = [];
  for (const id in stats) {
    const t = cardTries(stats[id]);
    if (t >= 3) { const wrong = t - cardGood(stats[id]); if (wrong > 0) cards.push({ id, tries: t, wrong }); }
  }
  cards.sort((a, b) => (a.wrong / a.tries < b.wrong / b.tries ? 1 : a.wrong / a.tries > b.wrong / b.tries ? -1 : b.wrong - a.wrong));
  for (const k in ex) if (k.startsWith("q:") && ex[k].w > 0) lessons.push({ id: k.slice(2), tries: ex[k].r + ex[k].w, misses: ex[k].w });
  lessons.sort((a, b) => b.misses - a.misses);
  return { v: 1, at: now, cards: cards.slice(0, 50), lessons: lessons.slice(0, 20) };
}
