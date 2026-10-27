// The cards other screens show for my classes: the Classes card on Friends (rows to open, Join a class, Start a class) and the
// Classes card on Profile (the two switches per class).
import "./classes.css";
import "../../ui/people.css";
import { useEffect } from "preact/hooks";
import type { Class } from "../../../shared/api.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { S } from "../../core/store.ts";
import { SetCard } from "../../ui/settings.tsx";
import { Badge, Shares } from "./parts.tsx";
import { openClassBoard, openCreateClass, openJoinClass } from "./sheets.ts";
import { classList, ensureClasses } from "./state.ts";

function ClassRow({ c }: { c: Class }) {
  const mine = c.owner === S.me;
  return (
    <div class={"fr-row cl-row" + (mine ? " teach" : "")}>
      <button class="fr-who" type="button" aria-label={"Open " + c.name} onClick={() => void openClassBoard(c)}>
        <Badge c={c} />
        <span class="fr-nm">
          <span class="cl-nm"><b>{bidiTxt(c.name)}</b><span class={"pill cl-role" + (mine ? " teach" : "")}>{mine ? "Teacher" : "Member"}</span></span>
          <small class="hint">{c.members + (c.members === 1 ? " member" : " members") + " · code " + c.code}</small>
        </span>
      </button>
      <div class="fr-act"><button class="btn sm" type="button" onClick={() => void openClassBoard(c)}>Board</button></div>
    </div>
  );
}

/** On the Friends tab. */
export function FriendsClasses() {
  useEffect(ensureClasses, []);
  const can = !!(S.db && S.me && !S.localOnly && S.writable !== false);
  if (!can) return null;
  const list = classList.value || [], teach = list.filter((c) => c.owner === S.me), joined = list.filter((c) => c.owner !== S.me);
  const group = (label: string, cs: Class[]) => (cs.length ? <><span class="lbl cl-group">{label}</span>{cs.map((c) => <ClassRow c={c} />)}</> : null);
  return (
    <div class="card fr-card">
      <h2>Classes</h2>
      <p class="hint">{list.length ? "Each class has its own weekly board." : "Join your class with the code your teacher shares, or start one for your classmates."}</p>
      {teach.length && joined.length ? <>{group("You teach", teach)}{group("You've joined", joined)}</> : list.map((c) => <ClassRow c={c} />)}
      <div class="acc-actions">
        <button class="btn sm primary" type="button" onClick={() => openJoinClass("")}>Join a class</button>
        <button class="btn sm" type="button" onClick={openCreateClass}>Start a class</button>
      </div>
    </div>
  );
}

/** On the Profile tab: nothing until I am in a class. */
export function ProfileClasses() {
  useEffect(ensureClasses, []);
  const list = classList.value;
  if (!S.me || !list || !list.length) return null;
  return <SetCard title="Classes">{list.map((c) => <div><b>{bidiTxt(c.name)}</b><Shares c={c} /></div>)}</SetCard>;
}
