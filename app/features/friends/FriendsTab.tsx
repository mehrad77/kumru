// The Friends tab: my link and friend code, a box to find people, the inbox (new followers and cheers), the leaderboard, the cards
// other features add (classes), and the people I follow who have not followed back.
import "./friends.css";
import { useEffect } from "preact/hooks";
import { bidiTxt } from "../../core/i18n.ts";
import { S, signals } from "../../core/store.ts";
import { Avatar } from "../../ui/avatar/Avatar.tsx";
import { Pup } from "../../ui/Pup.tsx";
import { Slot } from "../../ui/Slot.tsx";
import { shareLink } from "../../ui/share.ts";
import { confirmSheet } from "../../ui/sheet.ts";
import { toast } from "../../ui/toast.ts";
import { rev } from "../progress/index.ts";
import { dismiss, dismissed, follow, markCheersSeen, searchRemote, seen, unfollow } from "./actions.ts";
import { friendsApi } from "./api.ts";
import { Board } from "./Board.tsx";
import { FR_CHEERS, frInbox, frLooksCode, frPendingIds, frRelTime, frSearch } from "./model/friends.ts";
import { ActBtn, PersonRow } from "./parts.tsx";
import { dismissTick, hits, loaded, myCode, nameOf, names, profiles, query, view, writable } from "./state.ts";

const Msg = ({ h, t, mood }: { h: string; t: string; mood?: string }) => (
  <div class="fr-shell fr-msg">
    <h1 class="fr-title">Friends</h1>
    <div class="empty"><Pup mood={mood || "idle"} size={72} enter={false} /><b>{h}</b><p class="hint">{t}</p></div>
  </div>
);

function Head() {
  const code = myCode.value, un = S.profileName || "", link = un ? friendsApi.profileLink(un) : "";
  const copy = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); toast("Link copied"); } catch { toast("Your link is " + link + ". Copy it by hand."); }
  };
  const note = !writable() ? "This copy of the notebook is read-only, so classmates can't see you yet." : !(S.nick || S.profileName) ? "Add your name in Settings so friends can find you." : "";
  return (
    <div class="card fr-head">
      <div class="fr-me">
        <Avatar char={S.char || null} size={64} cls="fr-av" label={nameOf(S.me as string)} />
        <div><span class="lbl">Your link</span><h1 class="fr-name">{bidiTxt(nameOf(S.me as string))}</h1></div>
      </div>
      <div class="fr-code-row">
        <span class="fr-link" dir="ltr">{link ? link.replace(/^https?:\/\//, "") : "–"}</span>
        <button class="btn sm" type="button" disabled={!link} onClick={copy}>Copy</button>
        {link ? <button class="btn sm primary" type="button" onClick={() => void shareLink(link, "Follow me on Kumru")}>Share my link</button> : null}
      </div>
      <p class="hint">Send your link to a friend. When you follow each other you're friends.</p>
      {code ? <p class="hint">Friend code <b class="fr-fcode" aria-label={"Friend code " + code.split("").join(" ")}>{code}</b> (the old way, still works)</p> : null}
      {note ? <p class="hint fr-note">{note}</p> : null}
    </div>
  );
}

let qTimer: ReturnType<typeof setTimeout> | undefined;

function Results() {
  const q = query.value.trim();
  if (!q) return <p class="hint">Type a 6-letter code, or at least 3 letters of a name.</p>;
  const r = frSearch(profiles.value, S.me, q, names.value);
  if (r.self) return <p class="hint">That's your own code. Share it with a classmate.</p>;
  if (r.code) return <PersonRow uid={r.code} right={<ActBtn uid={r.code} />} />;
  const ids = [...new Set([...r.ids, ...hits.value])].slice(0, 8);
  if (ids.length) return <>{ids.map((u) => <PersonRow uid={u} right={<ActBtn uid={u} />} />)}</>;
  return <p class="hint">{frLooksCode(q) ? "No learner with this code yet." : q.length < 3 ? "Keep typing…" : "Nobody found with that name."}</p>;
}

function AddCard() {
  const onInput = (e: Event) => {
    query.value = (e.currentTarget as HTMLInputElement).value;
    hits.value = [];
    clearTimeout(qTimer);
    qTimer = setTimeout(() => void searchRemote(), 300);
  };
  return (
    <div class="card fr-card">
      <h2>Add a friend</h2>
      <input class="fr-in" type="search" dir="auto" placeholder="Friend code or name" autocomplete="off" spellcheck={false} aria-label="Friend code or name" maxLength={40} value={query.value} onInput={onInput} />
      <div class="fr-results" aria-live="polite"><Results /></div>
    </div>
  );
}

function Inbox() {
  void rev.value; void dismissTick.value;   // cheers seen are saved with the progress document; a dismissal is in localStorage
  const showing = signals.tab.value === "friends" && writable();
  const now = Date.now();
  const base = seen.base != null && now < seen.until ? seen.base : S.cheerSeen || 0;
  const ib = S.me ? frInbox(view(), S.me, dismissed(), base, now) : { follows: [], cheers: [] };
  const hasNew = ib.cheers.some((c) => c.at > (S.cheerSeen || 0));
  // the cheers on screen count as seen after a moment
  useEffect(() => {
    if (!hasNew || !showing) return;
    const t = setTimeout(() => { if (S.tab === "friends") markCheersSeen(); }, 2500);
    return () => clearTimeout(t);
  }, [hasNew, showing]);
  if (!writable() || (!ib.follows.length && !ib.cheers.length)) return null;
  return (
    <div class="card fr-card fr-inbox">
      <h2>Inbox</h2>
      {ib.cheers.map((c) => {
        const k = FR_CHEERS[c.kind];
        const sub = <>said <b lang="tr">{k.tr}</b> <span lang="fa" dir="rtl" class="fr-fa">{"(" + k.fa + ")"}</span>{" · " + frRelTime(c.at, now)}</>;
        return <PersonRow uid={c.uid} sub={sub} right={c.at > (S.cheerSeen || 0) ? <span class="pill fr-pill new">New</span> : null} />;
      })}
      {ib.follows.map((u) => (
        <PersonRow uid={u} sub="Follows you" right={<>
          <button class="btn sm primary" type="button" onClick={() => follow(u)}>Follow back</button>
          <button class="btn sm ghost" type="button" onClick={() => dismiss(u)}>Dismiss</button>
        </>} />
      ))}
    </div>
  );
}

function Following() {
  const ids = S.me ? frPendingIds(view(), S.me).filter((u) => profiles.value.has(u)) : [];
  if (!ids.length || !writable()) return null;
  return (
    <div class="card fr-card">
      <h2>Following</h2>
      <p class="hint">They become friends when they follow you back.</p>
      {ids.map((u) => (
        <PersonRow uid={u} sub="Waiting for them to follow back" right={
          <button class="btn sm ghost" type="button" onClick={() => confirmSheet({
            title: "Unfollow " + nameOf(u) + "?", body: "You'll stop following " + nameOf(u) + ". You can follow again any time.", label: "Unfollow", action: async () => unfollow(u),
          })}>Unfollow</button>
        } />
      ))}
    </div>
  );
}

export function FriendsTab() {
  if (!S.db) return <Msg h="Friends need a connection" t="Friends load when Kumru can reach its server. Check your connection and try again." />;
  if (!S.me) return <Msg h="Sign in to use Friends" t="Create an account or sign in from Profile to follow classmates and cheer them on." />;
  if (!loaded.value) return <Msg h="Loading friends…" t="One moment." mood="think" />;
  return (
    <div class="fr-shell">
      <Head />
      <AddCard />
      <Inbox />
      <Board />
      <Slot name="friendsCards" />
      <Following />
    </div>
  );
}
