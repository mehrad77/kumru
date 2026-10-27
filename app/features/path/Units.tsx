// The book's units as sections of steps (the levels the skill tree does not cover): a header that folds, the winding road of steps, and
// for a locked unit the Jump here button.
import { Icon } from "../../ui/Icon.tsx";
import { toast } from "../../ui/toast.ts";
import { startNode } from "../practice/index.ts";
import { type RoadNode, type RoadUnit, nodeStars } from "./course.ts";
import { NODE_ICON } from "./icons.ts";
import { openUnitSheet, jumpHere } from "./sheets.ts";
import { isOpen, openUnits, toggleUnit } from "./state.ts";

export const PT_OFF = [0, 34, 54, 34, 0, -34, -54, -34];

export const Stars = ({ n }: { n: number }) => <span class="pt-stars" aria-label={n + " of 3 stars"}>{[1, 2, 3].map((i) => <span class={i <= n ? "on" : ""}>★</span>)}</span>;

function NodeItem({ n, idx }: { n: RoadNode; idx: number }) {
  const locked = n.state === "locked", cur = n.state === "cur", stars = nodeStars(n);
  const label = n.title + " (" + (locked ? "locked" : n.state === "done" ? "done" : cur ? "next step" : "open") + ")";
  return (
    <li class={"pt-node " + n.state} style={"--off:" + PT_OFF[idx % PT_OFF.length] + "px"}>
      <div class="pt-n-wrap">
        {cur ? <span class="pt-start">Start</span> : null}
        <button class={"pt-n " + n.state + " t-" + n.type} type="button" aria-label={label}
          onClick={() => (locked ? toast(n.type === "review" ? "Finish the checkpoint to unlock the review." : "Finish the step before it first.") : startNode(n))}>
          <Icon name={locked ? "lock" : n.state === "done" && n.type !== "review" ? "check" : NODE_ICON[n.type]} class="pt-n-ico" />
        </button>
      </div>
      <div class="pt-n-t"><span class="pt-n-name">{n.title}</span>{stars ? <Stars n={stars} /> : null}</div>
    </li>
  );
}

export function UnitSection({ x }: { x: RoadUnit }) {
  void openUnits.value;
  const open = x.state === "cur" || isOpen(x.i);
  const chip = x.done ? <span class="pchip ok">✓ done</span> : x.state === "past" ? <span class="pchip new">placed past</span>
    : x.state === "later" ? <span class="pchip new"><Icon name="lock" class="bi" />locked</span> : <span class="pchip mid">{x.info.pct + "%"}</span>;
  return (
    <section class={"pt-unit " + x.state + (x.done ? " done" : "") + (open ? " open" : "")} id={"unit-" + x.lv + "_" + x.u}>
      <div class="pt-uh">
        <button class="pt-uh-main" type="button" aria-expanded={open} onClick={() => { if (x.state !== "cur") toggleUnit(x.i); }}>
          <span class="pt-uh-no">{String(x.u)}</span>
          <span class="pt-uh-t"><b lang="tr">{x.title || "Unit " + x.u}</b><span class="hint">{x.info.known + "/" + x.info.n + " words · " + x.info.learned + "/" + x.info.lessons + " lessons"}</span></span>
          {chip}
        </button>
        <button class="btn sm ghost" type="button" onClick={() => openUnitSheet(x.lv, x.u)}>Words</button>
      </div>
      {open && x.state !== "later" ? <ol class="pt-nodes">{x.nodes.map((n, i) => <NodeItem key={n.id} n={n} idx={i} />)}</ol> : null}
      {x.state === "later" ? <div class="pt-later"><button class="btn sm" type="button" onClick={() => jumpHere(x)}>Jump here</button></div> : null}
    </section>
  );
}
