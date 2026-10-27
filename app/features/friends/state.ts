// What the Friends feature remembers while the page is open. One public profile per learner (`profiles`, the last payload), my
// own follow and cheer changes that are not saved yet (`ops`), the names the server told us, and the search box. This feature is
// the only writer of these signals; the screens read them and call actions.ts.
import { signal } from "@preact/signals-core";
import type { ClassBoard } from "../../../shared/api.ts";
import { local } from "../../core/local.ts";
import { S } from "../../core/store.ts";
import { frApplyOps, type Op, type Profile, type Profiles } from "./model/friends.ts";

/** The profiles of everyone I may see, with mine under my id. Replaced, never changed in place. */
export const profiles = signal<Profiles>(new Map());
/** The first payload has arrived (or failed): until then the tab says "Loading friends…". */
export const loaded = signal(false);
/** Display names by id (never stored; people outside the org fall back to their nick). */
export const names = signal<Map<string, string>>(new Map());
/** Follow, unfollow and cheer changes made on this device and not yet saved. */
export const ops = signal<Op[]>([]);
/** My permanent friend code, once the profile has been saved (or proposed). */
export const myCode = signal("");
/** The "Add a friend" box: what was typed and the ids the server found (ids the page has a profile for). */
export const query = signal("");
export const hits = signal<string[]>([]);
/** Bumped when a dismissed follower is remembered (the list is in localStorage). */
export const dismissTick = signal(0);

export const myDoc = (): Profile | null => (S.me ? profiles.value.get(S.me) ?? null : null);
/** My doc with the unsaved changes applied. */
export const myBase = () => frApplyOps(myDoc(), ops.value);
/** The profiles as the screens should see them: mine with the unsaved changes applied. */
export function view(): Profiles {
  const v = new Map(profiles.value);
  if (S.me) v.set(S.me, { ...(v.get(S.me) || {}), ...myBase() });
  return v;
}
/** Who I follow, with the unsaved changes. */
export const followingNow = (): string[] => myBase().following;

/** Signed in, online-capable and allowed to write: the controls that change anything show only then. */
export const writable = (): boolean => !!(S.db && S.me && !S.localOnly && S.writable !== false);

export function nameOf(uid: string): string {
  if (uid === S.me) return S.nick || S.profileName || "You";
  const p = profiles.value.get(uid);
  return names.value.get(uid) || (p && p.nick) || "Classmate";
}

/** friends / following / follower / none, from my side. */
export type Relation = "friends" | "following" | "follower" | "none";
export function relation(uid: string): Relation {
  const f = followingNow().includes(uid);
  const b = !!S.me && (profiles.value.get(uid)?.following || []).includes(S.me);
  return f && b ? "friends" : f ? "following" : b ? "follower" : "none";
}

export function addNames(more: Record<string, string>): void {
  const keys = Object.keys(more);
  if (!keys.length) return;
  const next = new Map(names.value);
  for (const k of keys) next.set(k, more[k]);
  names.value = next;
}

/** The leaderboard's period ("week" | "all") and group ("friends" | "c:<class id>"), remembered on this device. */
export const boardMode = signal<"week" | "all">(local.get("frBoard", "week") === "all" ? "all" : "week");
export const boardScope = signal<string>(local.get("frScope", "friends"));
export const setBoardMode = (v: "week" | "all"): void => { local.set("frBoard", v); boardMode.value = v; };
export const setBoardScope = (v: string): void => { local.set("frScope", v); boardScope.value = v; };

/** A class's board as the leaderboard last fetched it (kept 30 seconds). */
export const classBoardCache = signal<{ id: string; data: ClassBoard; at: number } | null>(null);
