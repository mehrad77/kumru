// The Path as Notebook book box sees it (features/yeni: the "In the book" line, its offers and /unit/<REF>): where each unit
// stands, an offer run through the Path's own buttons, and the Path scrolled to a unit.
import { setTab } from "../../core/router.ts";
import { S } from "../../core/store.ts";
import { toast } from "../../ui/toast.ts";
import { startNode } from "../practice/index.ts";
import { buildPath, buildTree, startTreeCp, treeSecs, useTree, type Lesson } from "./course.ts";
import { type BookRef, bookPathState } from "./model/book.ts";
import { openUnitSheet, jumpHere, testOut } from "./sheets.ts";
import { openUnit } from "./state.ts";
import type { FlowSec } from "./course.ts";

const secRefs = (sec: FlowSec["sec"]): string[] => {
  const refs = new Set<string>();
  for (const sk of sec.skills || []) for (const g of sk.lessons || []) { const L = (S.grammar as Lesson[]).find((d) => d.id === g); if (L && L.ref) refs.add(L.ref); }
  return [...refs];
};
const state = () => {
  const T = useTree() ? buildTree() : null;
  return bookPathState({ sections: T ? (T.secs as FlowSec[]) : null, treeLevels: new Set(T ? treeSecs().map((s) => s.level) : []), units: buildPath(), secRefs });
};

/** Where each unit of the books stands on the Path: the page's lock rules as plain data. */
export const bookPath = (): { refs: Record<string, BookRef> } => ({ refs: state().refs });

/** An offer runs through the same entry the Path's own buttons use (their lock checks included): never sets the position. */
export function bookPathAct(ref: string, kind: "checkpoint" | "jump"): void {
  const st = state(), t = st.targets[ref], r = st.refs[ref];
  if (!t || !r || r.where === "done") return;
  if (kind === "checkpoint") {
    if (!r.cp) return toast("Finish the steps before it first.");
    if (t.sec) startTreeCp(t.sec as FlowSec);
    else if (t.cpNode) startNode(t.cpNode);
  } else if (r.where === "later") {
    if (t.sec) testOut(t.sec as FlowSec);
    else if (t.unit) jumpHere(t.unit);
  }
}

/**
 * /unit/<REF>: the Path scrolled to that unit (or its tree section), expanded unless locked, with the unit sheet open for the book's
 * units. A locked one stays closed so its own Jump here / Test out button is the thing in view. False when the unit isn't on this path.
 */
export function bookPathReveal(ref: string): boolean {
  const st = state(), t = st.targets[ref], r = st.refs[ref];
  if (!t || !r) return false;
  setTab("path");
  const key = t.sec ? "sec:" + t.sec.sec.id : (t.unit as { i: number }).i, id = t.sec ? "sec-" + t.sec.sec.id : "unit-" + ref;
  if (r.where !== "later" && r.where !== "cur") openUnit(key);
  // the Path draws as soon as its chunk has loaded
  let tries = 0;
  const expand = r.where !== "later", show = () => {
    const node = document.getElementById(id);
    if (!node || (expand && !node.querySelector(".pt-nodes") && tries < 60)) { if (++tries < 60) setTimeout(show, 50); return; }
    node.scrollIntoView({ block: "center" });
    node.classList.add("bk-flash");
    setTimeout(() => node.classList.remove("bk-flash"), 2400);
    if (t.unit && r.where !== "later") openUnitSheet(t.unit.lv, t.unit.u);
  };
  setTimeout(show, 0);
  return true;
}
