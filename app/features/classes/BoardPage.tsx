// A class's page: its hero (badge, name, its description, who and when, the teacher's actions or a member's Leave), this week's board, and the two
// switches of what the member shares with the owner.
import "./classes.css";
import "../../ui/people.css";
import type { Class, ClassBoard } from "../../../shared/api.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { S } from "../../core/store.ts";
import { Icon } from "../../ui/Icon.tsx";
import { shareLink } from "../../ui/share.ts";
import { toast } from "../../ui/toast.ts";
import { classesApi } from "./api.ts";
import { BoardList } from "./BoardList.tsx";
import { closePage } from "./page.ts";
import { Badge, Shares } from "./parts.tsx";
import { confirmClass, openClassMember, openClassMembers, openEditClass } from "./sheets.ts";
import { loadClasses } from "./state.ts";

export function BoardPage({ c, b }: { c: Class; b: ClassBoard }) {
  const mine = c.owner === S.me, link = classesApi.link(c.code);
  const n = c.members;
  return (
    <>
      <section class={"card cl-hero cc-" + (c.color || "sage")}>
        <Badge c={c} big />
        <div class="cl-info">
          <h1 class="cl-title">{bidiTxt(c.name)}</h1>
          {/* what the class is about, under its name; its teacher is invited to write one */}
          {c.description ? <p class="cl-desc">{bidiTxt(c.description)}</p>
            : mine ? <button class="linkish cl-adddesc" type="button" onClick={() => openEditClass(c, "description")}>+ Add a description</button> : null}
          <div class="cl-meta">
            <span class="pchip new"><Icon name="users" class="bi" />{n + (n === 1 ? " member" : " members")}</span>
            {c.schedule ? <span class="pchip new"><Icon name="clock" class="bi" />{bidiTxt(c.schedule)}</span> : null}
            <span class="pchip new">{"Code " + c.code}</span>
            {mine ? <span class="pchip ok">You teach this</span> : null}
          </div>
        </div>
        {/* only the teacher shares the class link and manages it (rename, restyle, delete); a member's one action is Leave, which asks first */}
        {mine ? null : (
          <button class="btn sm bad" type="button" onClick={() => confirmClass({
            title: "Leave " + c.name + "?", body: "You'll disappear from the class board and your teacher will stop seeing your progress. You can join again with the class code.",
            label: "Leave class", action: async () => { await classesApi.leave(c.id); closePage(); toast("You left " + c.name); void loadClasses(); },
          })}>Leave</button>
        )}
        {mine ? (
          <div class="acc-actions">
            <button class="btn primary" type="button" onClick={() => void shareLink(link, "Join " + c.name + " on Kumru")}>Share link</button>
            <button class="btn" type="button" onClick={() => void openClassMembers(c)}>Members</button>
            <button class="btn" type="button" onClick={() => openEditClass(c)}>Manage class</button>
          </div>
        ) : null}
      </section>
      <section class="card cl-board">
        <h2>This week</h2>
        {b.board.length ? <BoardList b={b} open={mine ? (id) => void openClassMember(c, b, id) : null} /> : <p class="hint">No one has practised this week yet.</p>}
        {mine && b.board.length ? <p class="hint">Tap a learner to open their profile.</p> : null}
      </section>
      <section class="card set-card"><Shares c={c} /></section>
    </>
  );
}
