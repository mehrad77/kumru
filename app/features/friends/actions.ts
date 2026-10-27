// What the Friends feature does: load the payload, queue my follows and cheers and save my public profile, look people up, and act
// on invite links. DOM-free (the badge on the tab bar is the one DOM touch); the screens call these.
import { effect } from "@preact/signals-core";
import type { ProfileDoc } from "../../../shared/api.ts";
import { local } from "../../core/local.ts";
import { setTab } from "../../core/router.ts";
import { S } from "../../core/store.ts";
import { lsDel, lsGet } from "../../host/storage.ts";
import { later } from "../../ui/later.ts";
import { toast } from "../../ui/toast.ts";
import { joinClassFromInvite } from "../classes/index.ts";
import { rev, saveProgress } from "../progress/index.ts";
import { friendsApi } from "./api.ts";
import { FR_CHEERS, frBuildDoc, frCheerWait, frFollows, frGenCode, frInbox, frKey, frStreak, type Op, type Profiles } from "./model/friends.ts";
import { openFriendSheet } from "./sheet.ts";
import { addNames, dismissTick, followingNow, hits, loaded, myBase, myCode, myDoc, nameOf, names, ops, profiles, query, view } from "./state.ts";

/* ---------- saving my public profile ---------- */

/** Module state of the write queue: the timer, whether a save is in flight, the last saved content, a code proposed before the first save. */
const W = { timer: undefined as ReturnType<typeof setTimeout> | undefined, busy: false, again: false, last: null as string | null, code: "" };

function profileDoc() {
  const base = myBase();
  return frBuildDoc({
    nick: S.nick || (S.profileName || "").trim().split(/\s+/)[0] || "", char: S.char, charPublic: S.prefs.charPublic === true, code: myCode.value, following: base.following, cheers: base.cheers,
    xp: S.xp, xpDays: S.xpDays, days: S.days, streak: frStreak(S.days), pos: S.pos, nd: S.nd, st: S.st,
  }, Date.now());
}
const canWrite = (): boolean => !!(S.db && S.me && !S.localOnly && S.writable !== false && loaded.value && S.progLoaded && (S.nick || S.profileName));

export function saveProfileSoon(): void {
  clearTimeout(W.timer);
  W.timer = setTimeout(() => void flush(), 1500);
}

const dropOps = (n: number): void => { ops.value = ops.value.slice(n); };

async function flush(): Promise<void> {
  clearTimeout(W.timer);
  if (!canWrite()) return;
  if (W.busy) { W.again = true; return; }
  if (!myCode.value) myCode.value = W.code || (W.code = frGenCode(new Set([...profiles.value.values()].map((p) => p && p.code).filter((c): c is string => !!c))));
  const n = ops.value.length, doc = profileDoc(), key = frKey(doc);
  if (key === W.last) { dropOps(n); return; }
  W.busy = true;
  try {
    const r = await friendsApi.save(doc as ProfileDoc);
    W.last = key;
    // the stored copy carries the permanent friend code, which may differ from the one proposed
    if (S.me) { const m = new Map(profiles.value); m.set(S.me, r.doc); profiles.value = m; }
    dropOps(n);
    sync();
    if (r.code !== doc.code) void refresh();
  } catch (e) {
    console.warn("profile save failed", e);
    if (n) toast("Couldn't save that. Check your connection and try again.");
  } finally {
    W.busy = false;
    if (W.again) { W.again = false; void flush(); }
  }
}

function sync(): void {
  const mine = myDoc();
  if (mine && mine.code) myCode.value = mine.code;
  else if (!myCode.value && W.code) myCode.value = W.code;
}

/* ---------- loading ---------- */

let first = true;
const asked = new Set<string>();

function applyProfiles(m: Profiles): void {
  profiles.value = m;
  const mine = S.me ? m.get(S.me) : null;
  if (mine) W.last = frKey(mine);
  sync();
  loaded.value = true;
  if (first) { first = false; saveProfileSoon(); }
  void resolveNames([...m.keys()].filter((u) => u !== S.me && (S.canEdit || (S.me && (frFollows(m, u, S.me) || frFollows(m, S.me, u))))));
}

/** Names come from the Friends payload, and from the users route for ids it did not name. */
async function resolveNames(ids: string[]): Promise<void> {
  ids = ids.filter((u) => !asked.has(u));
  if (!ids.length) return;
  ids.forEach((u) => asked.add(u));
  const missing = ids.filter((u) => !names.value.has(u));
  if (!missing.length) return;
  try { addNames(await friendsApi.names(missing)); } catch { /* names are a nicety */ }
}

export async function refresh(): Promise<void> {
  try {
    const r = await friendsApi.load();
    if (!r) return;
    const m: Profiles = new Map(Object.entries(r.profiles));
    if (S.me && r.me) m.set(S.me, r.me);
    addNames(r.names);
    applyProfiles(m);
    void processInvites();
  } catch (e) {
    console.warn("profiles", e);
    loaded.value = true;
  }
}

/** Learners found by a code, a @username or part of a name; their profiles join the loaded ones first, because the screens only show ids they have. */
async function lookup(q: string): Promise<string[]> {
  const r = await friendsApi.search(q);
  const m = new Map(profiles.value);
  for (const [id, p] of Object.entries(r.profiles)) m.set(id, p);
  profiles.value = m;
  addNames(r.names);
  return [...(r.code ? [r.code] : []), ...r.ids];
}

export async function searchRemote(): Promise<void> {
  const q = query.value.trim();
  if (q.length < 3 || !S.user) return;
  try {
    const ids = await lookup(q);
    if (query.value.trim() !== q) return;
    hits.value = ids.filter((id) => id !== S.me && profiles.value.has(id));
  } catch { /* nothing found is shown as nothing found */ }
}

/** Profiles and names from a class board join the loaded ones (a teacher opens a member who is not a friend). */
export function addProfiles(more: Record<string, ProfileDoc>, nameMap: Record<string, string>): void {
  const m = new Map(profiles.value);
  for (const k of Object.keys(more)) if (more[k] && !m.has(k)) m.set(k, more[k]);
  profiles.value = m;
  const fresh: Record<string, string> = {};
  for (const k of Object.keys(nameMap)) if (!names.value.has(k)) fresh[k] = nameMap[k];
  addNames(fresh);
}

/* ---------- following and cheering ---------- */

function change(op: Op): void {
  if (!S.me) return;
  if (!(S.nick || S.profileName)) { toast("Add your name in Settings first."); return; }
  ops.value = [...ops.value, op];
  sync();
  void flush();
}
export const follow = (uid: string): void => { if (uid && uid !== S.me && !followingNow().includes(uid)) change({ t: "follow", uid }); };
export const unfollow = (uid: string): void => { if (followingNow().includes(uid)) change({ t: "unfollow", uid }); };

export function cheer(uid: string, kind: string): void {
  const now = Date.now();
  if (frCheerWait(myBase().cheers, uid, now)) return;
  change({ t: "cheer", uid, kind, at: now });
  toast("Sent " + FR_CHEERS[kind].tr + " to " + nameOf(uid));
}

/* ---------- the inbox: followers I have not followed back, and cheers I have not seen ---------- */

export function dismissed(): Record<string, number> {
  try { return JSON.parse(local.get("frDismiss", "{}")) || {}; } catch { return {}; }
}
export function dismiss(uid: string): void {
  const d = dismissed();
  d[uid] = Date.now();
  local.set("frDismiss", JSON.stringify(d));
  dismissTick.value++;
}

/** Cheers marked seen during this visit stay listed for a while (15 minutes). */
export const seen = { base: null as number | null, until: 0 };
export function markCheersSeen(): void {
  seen.base = S.cheerSeen || 0;
  seen.until = Date.now() + 15 * 60e3;
  S.cheerSeen = Date.now();
  saveProgress();
}

function badgeCount(): number {
  if (!S.me || !loaded.value) return 0;
  void rev.value; void dismissTick.value; void ops.value;   // cheers seen are saved with the progress document, which bumps `rev`
  const ib = frInbox(view(), S.me, dismissed(), S.cheerSeen || 0, Date.now());
  return ib.follows.length + ib.cheers.length;
}

/** The red dot on the Friends tab button. */
function watchBadge(): void {
  effect(() => {
    const n = badgeCount();
    const b = document.querySelector('#tabs [data-tab="friends"]');
    if (!b) return;
    b.classList.toggle("has-badge", n > 0);
    let d = b.querySelector(".fr-badge");
    if (n && !d) {
      d = document.createElement("span");
      d.className = "fr-badge";
      const sr = document.createElement("span");
      sr.className = "fr-sr";
      sr.textContent = " (new)";
      d.appendChild(sr);
      b.appendChild(d);
    } else if (!n && d) d.remove();
  });
}

/* ---------- invite links: /f/<code>, /c/<code>, /@name (the host kept the code, host/invite.ts) ---------- */

async function processInvites(): Promise<void> {
  const followCode = lsGet("pending-follow"), joinCode = lsGet("pending-class"), profile = lsGet("pending-profile");
  if (profile) {
    lsDel("pending-profile");
    try {
      const ids = await lookup("@" + profile);
      if (ids[0]) {
        const id = ids[0];
        later(() => { setTab("friends"); if (profiles.value.has(id)) openFriendSheet(id); else toast("That learner hasn't set up their profile yet."); });
      } else toast(`No learner is called @${profile}.`);
    } catch { /* the learner may be gone */ }
  }
  if (followCode) {
    lsDel("pending-follow");
    try {
      const ids = await lookup(followCode);
      const id = ids[0];
      if (id && id !== S.me) later(() => { follow(id); setTab("friends"); toast("You now follow " + nameOf(id)); });
    } catch { /* the inviter may be gone */ }
  }
  if (joinCode) {
    lsDel("pending-class");
    later(() => joinClassFromInvite(joinCode));
  }
}

/* ---------- starting ---------- */

let started = false;
let lastPull = 0;
const friendsTabOpen = (): boolean => !!document.querySelector("#p-friends:not([hidden])");

/** A /@name link that names this learner opens their own Profile. */
function ownProfileLink(): void {
  const pp = lsGet("pending-profile");
  if (pp && S.profileName && pp === S.profileName.toLowerCase()) { lsDel("pending-profile"); setTab("profile"); }
}

/** Once signed in (boot): load Friends, then keep it fresh when the app comes to the front and every 2 minutes while the tab is open; never in the background. */
export function start(): void {
  if (started || !S.db || !S.me) return;
  started = true;
  ownProfileLink();
  watchBadge();
  void refresh();
  setInterval(() => { if (document.visibilityState === "visible" && friendsTabOpen()) void refresh(); }, 120_000);
  const pull = () => {
    if (!loaded.value || document.visibilityState !== "visible" || Date.now() - lastPull < 10_000) return;
    lastPull = Date.now();
    void refresh();
  };
  document.addEventListener("visibilitychange", pull);
  addEventListener("focus", pull);
}
