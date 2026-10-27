// The members of a class, for its owner: what each shares (place, streak, hardest words, book progress), and Remove.
import "./classes.css";
import type { Class, ClassMember } from "../../../shared/api.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { S } from "../../core/store.ts";
import { Lazy } from "../../ui/Lazy.tsx";
import { loadClassBookLine } from "../yeni/index.ts";
import { classesApi } from "./api.ts";
import { confirmClass, openClassMembers } from "./sheets.ts";
import { loadClasses } from "./state.ts";
import { wordOf } from "./TeacherBox.tsx";

export function Members({ c, ms }: { c: Class; ms: ClassMember[] }) {
  return (
    <div class="acc-form">
      <p class="hint">You see place, streak and hardest words, and book progress, only for members who share them with you.</p>
      {ms.map((m) => {
        const who = m.nick || m.username;
        return (
          <div class="acc-dev cl-member">
            <div>
              <b>{bidiTxt(who)}</b>
              <div class="hint">{"@" + m.username + (m.share || m.shareBook ? "" : " · not sharing")}</div>
              {m.share ? <div class="hint">{[m.pos ? m.pos.lv + " · Unit " + m.pos.u : "", m.streak != null ? m.streak + "-day streak" : "", m.lastDay ? "last active " + m.lastDay : ""].filter(Boolean).join(" · ")}</div> : null}
              {m.share && m.weak && m.weak.length ? <div class="hint">{"Hardest: " + m.weak.map((w) => wordOf(w.id)).join(", ")}</div> : null}
              {m.shareBook ? <Lazy load={loadClassBookLine} props={{ m }} /> : null}
            </div>
            {m.id === S.me ? null : (
              <button class="btn sm bad" type="button" onClick={() => confirmClass({
                title: "Remove " + who + "?", body: who + " will leave " + c.name + " and lose its board. They can join again with the class code.", label: "Remove from class",
                action: async () => { await classesApi.removeMember(c.id, m.id); void loadClasses(); }, then: () => void openClassMembers(c),
              })}>Remove</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
