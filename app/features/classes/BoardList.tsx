// A class's weekly board as a list (the class page, and the Friends leaderboard when a class is picked). `open` makes a row open
// that learner (the class owner's view); without it the rows are plain.
import "../../ui/people.css";
import type { ClassBoard } from "../../../shared/api.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { S } from "../../core/store.ts";
import { Avatar } from "../../ui/avatar/Avatar.tsx";

export function BoardList({ b, open }: { b: ClassBoard; open: ((id: string) => void) | null }) {
  const nm = (id: string): string => (id === S.me ? S.nick || S.profileName || "You" : (b.profiles[id] && b.profiles[id].nick) || b.names[id] || "Classmate");
  return (
    <ol class="fr-board">
      {b.board.map((id, i) => {
        const p = b.profiles[id], xp = ((p && p.xpWeek) || {})[b.week] || 0;
        const who = (
          <>
            <Avatar char={(p && p.char) || null} size={36} cls="fr-av" label={nm(id)} />
            <span class="fr-nm"><b>{bidiTxt(nm(id))}</b>{b.names[id] && b.names[id] !== nm(id) ? <small class="hint">{"@" + b.names[id]}</small> : null}</span>
          </>
        );
        return (
          <li class={"fr-lb" + (id === S.me ? " me" : "") + (i < 3 ? " top r" + (i + 1) : "")}>
            <span class="fr-rank">{String(i + 1)}</span>
            {open && id !== S.me ? <button class="fr-who" type="button" aria-label={"Open " + nm(id)} onClick={() => open(id)}>{who}</button> : <span class="fr-who">{who}</span>}
            <span class="fr-xp"><b>{String(xp)}</b>{" XP"}</span>
          </li>
        );
      })}
    </ol>
  );
}
