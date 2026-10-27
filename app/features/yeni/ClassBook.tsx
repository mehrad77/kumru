// A class member's shared book progress, for the class pages (the classes feature): the teacher's box for one member, and the
// one-line summary in the members list.
import "./yeni.css";
import { Icon } from "../../ui/Icon.tsx";
import type { BookDoc } from "../../../shared/yeni.ts";
import { classBookCount, classBookLast, type ClassBookUnit } from "./model/classbook.ts";

export interface ClassBookMember { username: string; book?: BookDoc }

const Chip = ({ u }: { u: ClassBookUnit }) => {
  const pct = Math.round(u.p * 100);
  return (
    <span class={"cl-bchip" + (u.d ? " done" : "")} title={u.lv + " Ünite " + u.n + (u.d ? ": done" : ": " + pct + "% of the pages read")}
      aria-label={u.lv + " Ünite " + u.n + (u.d ? ", done" : ", " + pct + " percent of the pages read")}>
      <b>{u.lv + " · " + u.n}</b><i aria-hidden="true">{u.d ? "✓" : pct + "%"}</i>
    </span>
  );
};

/** The "Book progress" part of the teacher's box. */
export function ClassBookBox({ m, now }: { m: ClassBookMember; now: number }) {
  const b = m.book, k = classBookCount(b);
  if (!b) return <><span class="lbl">Book progress</span><p class="hint">{"@" + m.username} shares book progress, but nothing has arrived yet. It appears after their next save with the reader connected.</p></>;
  if (!k.units.length) return <><span class="lbl">Book progress</span><p class="hint">No book activity yet.</p></>;
  const last = classBookLast(b, now);
  return (
    <>
      <span class="lbl">Book progress</span>
      <div class="cl-bunits">{k.units.map((u) => <Chip u={u} />)}</div>
      <div class="cl-trow"><span class="hint">Units done</span><b>{k.done + " of " + k.units.length + " opened"}</b></div>
      {k.total ? <div class="cl-trow"><span class="hint">Exercises solved</span><b>{k.solved + " / " + k.total}</b></div> : null}
      {last ? <div class="cl-trow"><span class="hint">Last in the book</span><b>{last}</b></div> : null}
    </>
  );
}

/** One line in the members list: a Book pill, then what the summary says in short. */
export function ClassBookLine({ m }: { m: ClassBookMember }) {
  const k = m.book ? classBookCount(m.book) : null, last = m.book ? classBookLast(m.book, Date.now()) : "";
  const text = !k ? "nothing synced yet" : k.units.length
    ? [k.done + " of " + k.units.length + " units done", k.total ? k.solved + "/" + k.total + " exercises" : "", last ? "last " + last : ""].filter(Boolean).join(" · ")
    : "no activity yet";
  return <div class="cl-bline"><span class="pchip new cl-bpill"><Icon name="book" class="bi" />Book</span><span class="hint">{text}</span></div>;
}
