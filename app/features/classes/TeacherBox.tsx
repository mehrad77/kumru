// What a class member shares with the class owner, as the owner sees it under the member's profile: place, streak, last active day,
// hardest words, and (separately) the book progress.
import "./classes.css";
import type { ClassMember } from "../../../shared/api.ts";
import { Lazy } from "../../ui/Lazy.tsx";
import { S } from "../../core/store.ts";
import { loadClassBookBox } from "../yeni/index.ts";

export const wordOf = (id: string): string => { const k = S.cards.get(id); return k ? k.tr : id; };

export function TeacherBox({ m }: { m: ClassMember }) {
  if (!m.share && !m.shareBook) {
    return <div class="cl-tbox"><span class="lbl">Teacher view</span><p class="hint">{"@" + m.username + " isn't sharing their progress with you."}</p></div>;
  }
  const rows = !m.share ? [] : ([
    m.pos ? ["Position", m.pos.lv + " · Unit " + m.pos.u] : null,
    m.streak != null ? ["Streak", m.streak + (m.streak === 1 ? " day" : " days")] : null,
    m.lastDay ? ["Last active", m.lastDay] : null,
    m.weak && m.weak.length ? ["Hardest words", m.weak.map((w) => wordOf(w.id)).join(", ")] : null,
  ].filter(Boolean) as [string, string][]);
  return (
    <div class="cl-tbox">
      <span class="lbl">{"Teacher view · @" + m.username}</span>
      {m.share ? rows.map(([k, v]) => <div class="cl-trow"><span class="hint">{k}</span><b>{v}</b></div>) : <p class="hint">Not sharing place, streak or hardest words.</p>}
      {m.shareBook ? <Lazy load={loadClassBookBox} props={{ m, now: Date.now() }} /> : null}
    </div>
  );
}
