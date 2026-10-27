// The leaderboard: my friends (or one of my classes) by XP, this week or all time.
import { useEffect } from "preact/hooks";
import { bidiTxt } from "../../core/i18n.ts";
import { S, signals } from "../../core/store.ts";
import { weekKey, xpInWeek } from "../../lib/progress.ts";
import { Lazy } from "../../ui/Lazy.tsx";
import { Pup } from "../../ui/Pup.tsx";
import { classBoard, classList, loadBoardList, openClassMember } from "../classes/index.ts";
import { rev } from "../progress/index.ts";
import { openFriendSheet } from "./sheet.ts";
import { frFriendIds, frLeaderboard, frStreak, frWeekDaysLeft } from "./model/friends.ts";
import { Avatar, Flame } from "./parts.tsx";
import { boardMode, boardScope, classBoardCache, nameOf, setBoardMode, setBoardScope, view } from "./state.ts";

const ord = (n: number): string => n + (n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th");

export function Board() {
  void rev.value;   // my XP and streak come from the progress document
  const visible = signals.tab.value === "friends";
  const mode = boardMode.value, scope = boardScope.value, now = Date.now(), wk = weekKey(now);
  const list = classList.value || [];
  const cls = scope.startsWith("c:") ? list.find((c) => "c:" + c.id === scope) || null : null;
  const cb = classBoardCache.value;
  // the class boards come from the Worker, kept 30 seconds
  useEffect(() => {
    if (!cls || !visible) return;
    const k = classBoardCache.peek();
    if (k && k.id === cls.id && Date.now() - k.at < 30e3) return;
    classBoard(cls.id).then((data) => { classBoardCache.value = { id: cls.id, data, at: Date.now() }; }, () => {});
  }, [cls?.id, visible]);

  const me = S.me as string;
  const rows = cls ? [] : frLeaderboard(view(), me, mode, wk, { week: xpInWeek(wk, S.xpDays || {}), xp: S.xp || 0, streak: frStreak(S.days) }, now, false);
  const nFr = frFriendIds(view(), me).length + 1;
  const scopes: [string, string, number, boolean][] = [["friends", "Friends", nFr, !cls], ...list.map((c): [string, string, number, boolean] => ["c:" + c.id, c.name, c.members, !!cls && cls.id === c.id])];
  const left = frWeekDaysLeft(now);
  const data = cb && cls && cb.id === cls.id ? cb.data : null;

  return (
    <div class="card fr-card">
      <div class="fr-h"><h2>Leaderboard</h2></div>
      <div class="seg fr-scope" role="group" aria-label="Leaderboard group">
        {scopes.map(([v, t, n, on]) => (
          <button type="button" aria-pressed={on ? "true" : "false"} onClick={() => setBoardScope(v)}>{bidiTxt(t)}<small>{String(n)}</small></button>
        ))}
      </div>
      {cls ? (
        <>
          <div class="fr-sub"><p class="hint">{"Class code " + cls.code + " · this week's XP, " + (left === 1 ? "last day" : left + " days left")}</p></div>
          {data
            ? (data.board.length
              ? <Lazy load={loadBoardList} props={{ b: data, open: cls.owner === S.me ? (id: string) => void openClassMember(cls, data, id) : null }} />
              : <p class="hint">No one has practised this week yet.</p>)
            : <p class="hint">Loading the class board…</p>}
        </>
      ) : (
        <>
          <div class="fr-sub">
            <div class="seg sm" role="group" aria-label="Leaderboard period">
              {([["week", "This week"], ["all", "All time"]] as const).map(([v, t]) => (
                <button type="button" aria-pressed={v === mode ? "true" : "false"} onClick={() => setBoardMode(v)}>{t}</button>
              ))}
            </div>
            <p class="hint">{mode === "week" ? (left === 1 ? "Last day · resets Monday" : left + " days left · resets Monday") : "Total XP since the start"}</p>
          </div>
          <ol class="fr-board">
            {rows.map((r) => (
              <li class={"fr-lb" + (r.me ? " me" : "") + (r.rank <= 3 ? " top r" + r.rank : "")}>
                <span class="fr-rank" aria-label={ord(r.rank) + " place"}>{String(r.rank)}</span>
                {r.me
                  ? <span class="fr-who"><Avatar uid={r.uid} size={40} /><span class="fr-nm"><b>{bidiTxt(nameOf(r.uid))}</b><span class="pill fr-pill you">You</span></span></span>
                  : <button class="fr-who" type="button" aria-label={"Open " + nameOf(r.uid)} onClick={() => openFriendSheet(r.uid)}><Avatar uid={r.uid} size={40} /><span class="fr-nm"><b>{bidiTxt(nameOf(r.uid))}</b></span></button>}
                <span class="fr-xp"><b>{String(r.xp)}</b>{" XP"}</span>
                <Flame n={r.streak} />
              </li>
            ))}
          </ol>
          {rows.length < 2 ? <div class="empty fr-empty"><Pup mood="idle" size={56} enter={false} /><p>No friends yet. Share your link, follow a classmate, and when they follow you back you'll race here.</p></div> : null}
        </>
      )}
    </div>
  );
}
