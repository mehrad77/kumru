// A learner's profile sheet: portrait and name, where they are on the path, four numbers, what they finished lately, a cheer, and
// Follow or Unfollow. `extra` is what another feature adds under the numbers (a teacher's view of a class member).
import { useEffect, useRef } from "preact/hooks";
import { ICON, type IconName } from "../../core/dom.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { weekKey } from "../../lib/progress.ts";
import { unitLabel } from "../../lib/units.ts";
import { Lazy } from "../../ui/Lazy.tsx";
import { closeSheet, confirmSheet } from "../../ui/sheet.ts";
import { cheer, follow, unfollow } from "./actions.ts";
import { FR_CHEERS, frCheerWait, frLiveStreak, frRelTime } from "./model/friends.ts";
import { Avatar, Ic } from "./parts.tsx";
import type { SheetExtra } from "./sheet.ts";
import { myBase, nameOf, names, profiles, relation, writable } from "./state.ts";

const REL_TEXT = { friends: "Friends", following: "You follow them", follower: "Follows you", none: "" };

function Stat({ icon, n, label, cls }: { icon: IconName; n: number; label: string; cls?: string }) {
  return <div class={"fr-stat" + (cls ? " " + cls : "")}><Ic name={icon} cls={cls} /><b>{String(n)}</b><small>{label}</small></div>;
}

export function FriendSheet({ uid, extra }: { uid: string; extra: SheetExtra | null }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { const t = setTimeout(() => close.current?.focus(), 30); return () => clearTimeout(t); }, []);
  const p = profiles.value.get(uid);
  if (!p) return null;
  const now = Date.now(), wk = weekKey(now), st = relation(uid), name = nameOf(uid), un = names.value.get(uid);
  const wait = frCheerWait(myBase().cheers, uid, now), can = writable();
  const streak = frLiveStreak(p, now);
  const units = (p.unitsDone || []).filter((d) => d && /^[A-Z]\d_\d+$/.test(d.ref)).slice(0, 5);
  const keys = Object.keys(FR_CHEERS);
  const cheerBtn = (k: string) => {
    const c = FR_CHEERS[k];
    return (
      <button class="btn fr-cheer" type="button" disabled={!!wait || !can} onClick={() => cheer(uid, k)}>
        <Ic name={k === keys[0] ? "check" : "spark"} cls="fr-ch-ic" /><b lang="tr">{c.tr}</b><small lang="fa" dir="rtl">{c.faBtn}</small>
      </button>
    );
  };
  const unfollowIt = () => confirmSheet({
    title: "Unfollow " + name + "?",
    body: "You'll stop seeing " + name + " on your friends board" + (st === "friends" ? ", and you're no longer friends" : "") + ". You can follow again any time.",
    label: "Unfollow", action: async () => unfollow(uid),
  });
  return (
    <div class="sheet fr-sheet" role="dialog" aria-modal="true" aria-label={name}>
      <div class="sheet-h">
        {REL_TEXT[st] ? <span class={"pill fr-rel " + st}><Ic name={st === "friends" ? "check" : "arrow"} />{REL_TEXT[st]}</span> : <span />}
        <button ref={close} class="s-close" type="button" aria-label="Close" onClick={closeSheet} dangerouslySetInnerHTML={{ __html: ICON.close }} />
      </div>
      <div class="fr-sh-top">
        <Avatar uid={uid} size={96} />
        <h2>{bidiTxt(name)}</h2>
        {un ? <p class="fr-un" dir="ltr">{"@" + un}</p> : null}
        <div class="fr-meta">
          {p.pos && p.pos.lv ? <span class="pill fr-lv">{p.pos.lv}</span> : null}
          <span class="hint">{p.pos && p.pos.lv ? unitLabel(p.pos.lv, p.pos.u) : "Just started"}</span>
        </div>
      </div>
      <div class="fr-stats">
        <Stat icon="flame" n={streak} label="day streak" cls={streak ? "hot" : ""} />
        <Stat icon="spark" n={+((p.xpWeek || {})[wk]) || 0} label="XP this week" />
        <Stat icon="target" n={+(p.xp || 0) || 0} label="XP total" />
        <Stat icon="book" n={+(p.storiesDone || 0) || 0} label="stories read" />
      </div>
      {extra ? <Lazy load={extra.load as never} props={extra.props as never} /> : null}
      {units.length ? (
        <div>
          <span class="lbl">Recently finished</span>
          <ul class="fr-units">
            {units.map((d) => { const [lv, u] = d.ref.split("_"); return <li>Finished <b>{lv + " · " + unitLabel(lv, +u)}</b><span class="hint">{" · " + frRelTime(d.at, now)}</span></li>; })}
          </ul>
        </div>
      ) : null}
      {can ? <div class="fr-cheers">{cheerBtn("great")}{cheerBtn("go")}</div> : null}
      {wait ? <p class="hint fr-wait">{"Cheer sent. You can cheer again in " + Math.ceil(wait / 60e3) + " min."}</p> : null}
      {!can ? null : st === "friends" || st === "following"
        ? <button class="btn ghost bad" type="button" onClick={unfollowIt}>Unfollow</button>
        : <button class="btn primary" type="button" onClick={() => follow(uid)}>{st === "follower" ? "Follow back" : "Follow"}</button>}
    </div>
  );
}
