// Friends and the weekly leaderboard (docs/SPECS.md section 10.2): one public profile per learner, written only by its owner.
// Following is one-way; two learners who follow each other are friends and share a weekly leaderboard. Pure helpers with
// explicit arguments, tested in friends.test.ts; the live state and the screens are the rest of this feature.
import { relTime } from "../../../lib/reltime.ts";
import { dayKey, weekKey, xpInWeek } from "../../../lib/progress.ts";

export const FR_ABC = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const FR_DAY = 864e5;
/** A Sahne story id (s1e01): only these count toward a profile's storiesDone (docs/stories/STORIES_SCHEMA.md §9). */
const STORY_ID = /^s\d+e\d{2}$/;
export const FR_CHEER_KEEP = 14 * FR_DAY;
export const FR_CHEER_GAP = 10 * 60e3;
export const FR_CHEERS: Record<string, { tr: string; fa: string; faBtn: string }> = {
  great: { tr: "Çok iyi!", fa: "عالی!", faBtn: "فوق‌العاده" },
  go: { tr: "Hadi!", fa: "بزن بریم!", faBtn: "بزن بریم" },
};

export interface Cheer { kind: string; at: number }
/** A learner's public profile as far as these helpers read it. */
export interface Profile {
  nick?: string;
  char?: unknown;
  code?: string;
  pos?: { lv: string; u: number } | null;
  unitsDone?: { ref: string; at: number }[];
  storiesDone?: number;
  following?: string[];
  xp?: number;
  xpWeek?: Record<string, number>;
  streak?: number;
  lastDay?: string;
  cheers?: Record<string, Cheer>;
}
export type Profiles = Map<string, Profile>;

/** A six-character friend code not in `taken`; `rnd` is Math.random unless a test gives its own. */
export function frGenCode(taken?: Set<string>, rnd: () => number = Math.random): string {
  taken = taken || new Set();
  let c = "";
  for (let n = 0; n < 200; n++) {
    c = "";
    for (let i = 0; i < 6; i++) c += FR_ABC[Math.floor(rnd() * FR_ABC.length) % FR_ABC.length];
    if (!taken.has(c)) return c;
  }
  return c;
}
export const frNormCode = (q: unknown): string => String(q || "").replace(/\s+/g, "").toUpperCase();
export const frLooksCode = (q: unknown): boolean => {
  const c = frNormCode(q);
  return c.length === 6 && [...c].every((ch) => FR_ABC.includes(ch));
};
export const frFollowing = (profiles: Profiles, uid: string): string[] => {
  const p = profiles.get(uid);
  return p && Array.isArray(p.following) ? p.following : [];
};
export const frFollows = (profiles: Profiles, a: string, b: string): boolean => frFollowing(profiles, a).includes(b);
export const frIsFriend = (profiles: Profiles, me: string, uid: string): boolean => uid !== me && frFollows(profiles, me, uid) && frFollows(profiles, uid, me);
export function frFriendIds(profiles: Profiles, me: string): string[] {
  return frFollowing(profiles, me).filter((u, i, a) => a.indexOf(u) === i && profiles.has(u) && frIsFriend(profiles, me, u));
}
export function frFollowerIds(profiles: Profiles, me: string): string[] {
  const out: string[] = [];
  for (const [u] of profiles) if (u !== me && frFollows(profiles, u, me)) out.push(u);
  return out;
}
export function frPendingIds(profiles: Profiles, me: string): string[] {
  return frFollowing(profiles, me).filter((u, i, a) => a.indexOf(u) === i && u !== me && !frFollows(profiles, u, me));
}

/** A stored streak only counts while its last active day is today or yesterday. */
export function frLiveStreak(p: Profile | null | undefined, now: number): number {
  if (!p || !p.lastDay) return 0;
  const t = dayKey(new Date(now)), y = dayKey(new Date(now - FR_DAY));
  return p.lastDay === t || p.lastDay === y ? (+(p.streak || 0) || 0) : 0;
}

export interface Row { uid: string; me: boolean; xp: number; streak: number; rank: number }

/** Me + friends, best first: XP (this week or all time), then streak, then uid for a stable order; equal XP and streak share a rank. */
export function frLeaderboard(profiles: Profiles, me: string | null, mode: string, wk: string, mine: { xp: number; week: number; streak: number }, now: number, everyone?: boolean): Row[] {
  const rows: Row[] = [];
  const add = (uid: string, p: Profile, own: boolean) => rows.push({
    uid, me: own,
    xp: own ? (mode === "all" ? mine.xp : mine.week) : (mode === "all" ? (+(p.xp || 0) || 0) : (+((p.xpWeek || {})[wk]) || 0)),
    streak: own ? mine.streak : frLiveStreak(p, now),
    rank: 0,
  });
  if (me) add(me, profiles.get(me) || {}, true);
  for (const u of everyone ? [...profiles.keys()].filter((u) => u !== me && profiles.get(u)) : frFriendIds(profiles, me as string)) add(u, profiles.get(u) as Profile, false);
  rows.sort((a, b) => b.xp - a.xp || b.streak - a.streak || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    r.rank = prev && prev.xp === r.xp && prev.streak === r.streak ? prev.rank : i + 1;
  });
  return rows;
}

/** People who follow me that I don't follow back (minus dismissed), and cheers to me newer than `cheerSeen`. */
export function frInbox(profiles: Profiles, me: string, dismissed: Record<string, unknown> | null | undefined, cheerSeen: number, now: number) {
  dismissed = dismissed || {};
  const mine = frFollowing(profiles, me);
  const follows = frFollowerIds(profiles, me).filter((u) => !mine.includes(u) && !dismissed[u]);
  const cheers: { uid: string; kind: string; at: number }[] = [];
  for (const [u, p] of profiles) {
    if (u === me) continue;
    const c = p && p.cheers && p.cheers[me];
    if (c && +c.at > cheerSeen && now - c.at < FR_CHEER_KEEP && FR_CHEERS[c.kind]) cheers.push({ uid: u, kind: c.kind, at: +c.at });
  }
  cheers.sort((a, b) => b.at - a.at);
  return { follows, cheers };
}

export type Op = { t: "follow"; uid: string } | { t: "unfollow"; uid: string } | { t: "cheer"; uid: string; kind: string; at: number };

/** Follow, unfollow and cheer ops replayed over my last-seen doc, so a snapshot never undoes an unwritten change. */
export function frApplyOps(doc: Profile | null | undefined, ops: Op[] | null | undefined): { following: string[]; cheers: Record<string, Cheer> } {
  const following = [...((doc && doc.following) || [])], cheers = { ...((doc && doc.cheers) || {}) };
  for (const o of ops || []) {
    if (o.t === "follow") {
      if (!following.includes(o.uid)) following.push(o.uid);
    } else if (o.t === "unfollow") {
      const i = following.indexOf(o.uid);
      if (i >= 0) following.splice(i, 1);
    } else if (o.t === "cheer") cheers[o.uid] = { kind: o.kind, at: o.at };
  }
  return { following, cheers };
}

/** Milliseconds until I may cheer `uid` again. */
export function frCheerWait(cheers: Record<string, Cheer> | null | undefined, uid: string, now: number): number {
  const c = cheers && cheers[uid];
  return c ? Math.max(0, +c.at + FR_CHEER_GAP - now) : 0;
}

export interface DocInputs {
  nick?: string; char?: unknown; charPublic?: boolean; code?: string; following?: string[]; cheers?: Record<string, Cheer>;
  xp?: number; xpDays?: Record<string, number>; days?: Record<string, unknown>; streak?: number;
  pos?: { lv: string; u: number } | null; nd?: Record<string, { at?: number }>; st?: Record<string, { done?: boolean } | undefined>;
}

/** The public doc from explicit inputs: xpWeek keeps this week and last week, cheers the last 14 days, unitsDone the newest 5. */
export function frBuildDoc(inp: DocInputs, now: number) {
  const wk = weekKey(new Date(now)), lw = weekKey(new Date(now - 7 * FR_DAY));
  const cheers: Record<string, Cheer> = {};
  for (const u in inp.cheers || {}) {
    const c = (inp.cheers as Record<string, Cheer>)[u];
    if (c && now - c.at < FR_CHEER_KEEP && FR_CHEERS[c.kind]) cheers[u] = { kind: c.kind, at: +c.at };
  }
  const units: { ref: string; at: number }[] = [];
  for (const k in inp.nd || {}) {
    const m = /^([A-Z]\d)_(\d+)_cp$/.exec(k);
    if (m) units.push({ ref: m[1] + "_" + m[2], at: +((inp.nd as Record<string, { at?: number }>)[k] || {}).at! || 0 });
  }
  units.sort((a, b) => b.at - a.at);
  const days = Object.keys(inp.days || {}).filter((k) => (inp.days as Record<string, unknown>)[k])
    .concat(Object.keys(inp.xpDays || {}).filter((k) => (inp.xpDays as Record<string, number>)[k])).sort();
  return {
    nick: String(inp.nick || "").trim().slice(0, 30), char: inp.char || null, ...(inp.charPublic ? { charPublic: true } : {}), code: inp.code || "", following: [...new Set(inp.following || [])],
    xp: +(inp.xp as number) || 0, xpWeek: { [wk]: xpInWeek(wk, inp.xpDays || {}), [lw]: xpInWeek(lw, inp.xpDays || {}) },
    streak: +(inp.streak as number) || 0, lastDay: days.length ? days[days.length - 1] : "",
    pos: inp.pos ? { lv: inp.pos.lv, u: +inp.pos.u } : null, unitsDone: units.slice(0, 5),
    // only the Sahne stories (s1e01…) count: the retired s01–s16 stay in old progress documents
    storiesDone: Object.entries(inp.st || {}).filter(([id, s]) => STORY_ID.test(id) && s && s.done).length, cheers, updatedAt: now, v: 1,
  };
}

/** JSON with sorted keys and without updatedAt: equal content gives an equal string whatever the key order. */
export function frKey(d: unknown): string {
  const norm = (v: unknown): unknown => Array.isArray(v) ? v.map(norm)
    : v && typeof v === "object" ? Object.keys(v).sort().reduce<Record<string, unknown>>((o, k) => (k === "updatedAt" || (o[k] = norm((v as Record<string, unknown>)[k])), o), {}) : v;
  return JSON.stringify(norm(d));
}

/** Search the loaded profiles: a six-character friend code, or part of a nickname or username (three letters at least). */
export function frSearch(profiles: Profiles, me: string | null, q: string, names?: Map<string, string>): { self: boolean; code: string | null; ids: string[] } {
  const code = frNormCode(q);
  const r: { self: boolean; code: string | null; ids: string[] } = { self: false, code: null, ids: [] };
  if (!code) return r;
  if (code.length === 6) {
    for (const [u, p] of profiles) if (p && p.code === code) {
      if (u === me) r.self = true;
      else r.code = u;
    }
    if (r.self || r.code) return r;
  }
  const t = String(q).trim().toLocaleLowerCase("tr");
  if (t.length < 3) return r;
  for (const [u, p] of profiles) {
    if (u === me) continue;
    const n = ((names && names.get(u)) || "").toLocaleLowerCase("tr"), k = String((p && p.nick) || "").toLocaleLowerCase("tr");
    if (k.includes(t) || n.includes(t)) r.ids.push(u);
  }
  return r;
}

export const frRelTime = relTime;

/** Days left in the ISO week, today included (Monday 7 … Sunday 1). */
export const frWeekDaysLeft = (now: number): number => 7 - (new Date(now).getDay() + 6) % 7;

/** Consecutive active days up to today (or up to yesterday while today has none yet). */
export function frStreak(days: Record<string, unknown> | null | undefined, from: Date = new Date()): number {
  let n = 0;
  const d = new Date(from);
  if (!(days || {})[dayKey(d)]) d.setDate(d.getDate() - 1);
  while ((days || {})[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
