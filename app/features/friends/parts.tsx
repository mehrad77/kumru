// The small pieces the Friends screens share: a learner's portrait, a person row, the follow button, the streak flame, an icon in a disc.
import type { ComponentChildren } from "preact";
import { ICON, type IconName } from "../../core/dom.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { S } from "../../core/store.ts";
import { Icon } from "../../ui/Icon.tsx";
import { Avatar as Char } from "../../ui/avatar/Avatar.tsx";
import { follow } from "./actions.ts";
import { openFriendSheet } from "./sheet.ts";
import { nameOf, profiles, relation, writable } from "./state.ts";

export function Avatar({ uid, size }: { uid: string; size: number }) {
  const p = uid === S.me ? { char: S.char } : (profiles.value.get(uid) || {}) as { char?: unknown };
  return <Char char={p.char || null} size={size} cls="fr-av" label={nameOf(uid)} />;
}

/** An icon in a round disc (`fr-ic`). */
export const Ic = ({ name, cls }: { name: IconName; cls?: string }) => (
  <span class={"fr-ic" + (cls ? " " + cls : "")} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICON[name] || "" }} />
);

export const Flame = ({ n }: { n: number }) => (
  <span class="fr-flame" title={n + " day streak"}><Icon name="flame" class="fr-fi" /><span>{String(n)}</span><span class="fr-sr"> day streak</span></span>
);

export const posLine = (p: { pos?: { lv: string; u: number } | null } | undefined): string => (p && p.pos && p.pos.lv ? p.pos.lv + " · Unit " + p.pos.u : "Just started");

/** Friends / Following, or the Follow button (nothing when this copy cannot write). */
export function ActBtn({ uid }: { uid: string }) {
  const st = relation(uid);
  if (!writable()) return null;
  if (st === "friends") return <span class="pill fr-pill ok">Friends</span>;
  if (st === "following") return <span class="pill fr-pill">Following</span>;
  return <button class="btn sm primary" type="button" onClick={(e) => { e.stopPropagation(); follow(uid); }}>{st === "follower" ? "Follow back" : "Follow"}</button>;
}

/** A person: portrait and name (opens their sheet), a line under the name, and actions on the end. */
export function PersonRow({ uid, sub, right }: { uid: string; sub?: ComponentChildren; right?: ComponentChildren }) {
  const p = profiles.value.get(uid);
  return (
    <div class="fr-row">
      <button class="fr-who" type="button" aria-label={"Open " + nameOf(uid)} onClick={() => openFriendSheet(uid)}>
        <Avatar uid={uid} size={40} />
        <span class="fr-nm"><b>{bidiTxt(nameOf(uid))}</b><small class="hint">{sub == null ? posLine(p) : sub}</small></span>
      </button>
      {right ? <div class="fr-act">{right}</div> : null}
    </div>
  );
}
