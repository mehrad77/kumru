// The skill tree on the Path: sections of skills (each an isometric puck on a winding road), a checkpoint closing each section, and for
// a locked section the Test out button. The rules of what is done, current or locked are model/tree.ts's `treeFlow`.
import { Icon } from "../../ui/Icon.tsx";
import { toast } from "../../ui/toast.ts";
import { type FlowSec, nextStepName, startTreeCp } from "./course.ts";
import { SK_ICON } from "./icons.ts";
import { Badge, Puck, skInner } from "./Puck.tsx";
import { openSkillSheet, testOut } from "./sheets.ts";
import { isOpen, openUnits, toggleUnit } from "./state.ts";
import { PT_OFF, Stars } from "./Units.tsx";
import { ICON } from "../../core/dom.ts";

type Item = FlowSec["skills"][number];

function SkillItem({ x, idx }: { x: Item; idx: number }) {
  const { sk, state } = x, locked = state === "locked", cur = state === "cur";
  const label = sk.title + ", " + sk.en + " (" + (locked ? "locked" : state === "done" ? "done" : state === "placed" ? "skipped, open" : cur ? "next step" : "open") + ")";
  return (
    <li class={"pt-node sk-li " + state} style={"--off:" + PT_OFF[idx % PT_OFF.length] + "px"}>
      <div class="pt-n-wrap">
        {cur ? <span class="pt-start">Start</span> : null}
        <button class={"pt-n sk " + state + (state === "placed" ? " open" : "")} type="button" aria-label={label}
          onClick={() => (locked ? toast("Locked. Finish " + nextStepName() + " first.") : openSkillSheet(x))}>
          <Puck inner={skInner(locked ? ICON.lock : SK_ICON[sk.icon || ""] || SK_ICON.text)} l={x.l} L={x.L} pulse={cur} />
          <Badge state={state} />
        </button>
      </div>
      <div class="pt-n-t">
        <span class="pt-n-name" lang="tr">{sk.title}</span><span class="hint">{sk.en}</span>
        {state === "placed" ? <span class="sk-status">Skipped · tap to learn it</span> : null}
        {x.stars && state === "done" ? <Stars n={x.stars} /> : null}
      </div>
    </li>
  );
}

function CpItem({ s, idx }: { s: FlowSec; idx: number }) {
  const locked = s.cp === "locked", cur = s.cp === "cur";
  return (
    <li class={"pt-node " + s.cp} style={"--off:" + PT_OFF[idx % PT_OFF.length] + "px"}>
      <div class="pt-n-wrap">
        {cur ? <span class="pt-start">Start</span> : null}
        <button class={"pt-n sk cp " + s.cp} type="button" aria-label={"Checkpoint (" + (locked ? "locked" : s.cp === "done" ? "done" : "next step") + ")"}
          onClick={() => (locked ? toast("Locked. Finish " + nextStepName() + " first.") : startTreeCp(s))}>
          <Puck inner={skInner(locked ? ICON.lock : SK_ICON.flag)} l={s.cp === "done" ? 1 : 0} L={1} pulse={cur} />
          <Badge state={s.cp === "done" ? "done" : ""} />
        </button>
      </div>
      <div class="pt-n-t"><span class="pt-n-name">Checkpoint</span><span class="hint">{s.cp === "done" ? "Passed" : "Closes the section"}</span></div>
    </li>
  );
}

export function SecSection({ s }: { s: FlowSec }) {
  void openUnits.value;
  const key = "sec:" + s.sec.id, open = s.state === "cur" || isOpen(key), n = s.skills.length, d = s.skills.filter((x) => x.state === "done").length;
  const chip = s.skipped ? <span class="pchip new">placed past</span> : s.passed ? <span class="pchip ok">✓ done</span>
    : s.state === "later" ? <span class="pchip new"><Icon name="lock" class="bi" />locked</span> : <span class="pchip mid">{d + "/" + n}</span>;
  return (
    <section class={"pt-unit " + s.state + (s.passed ? " done" : "") + (open ? " open" : "")} id={"sec-" + s.sec.id}>
      <div class="pt-uh">
        <button class="pt-uh-main" type="button" aria-expanded={open} onClick={() => { if (s.state !== "cur") toggleUnit(key); }}>
          <span class="pt-uh-no">{String(s.sec.order)}</span>
          <span class="pt-uh-t"><b>{s.sec.title}</b><span class="hint">{s.sec.en + " · " + d + "/" + n + " skills"}</span></span>
          {chip}
        </button>
      </div>
      {open ? <ol class="pt-nodes">{s.skills.map((x, i) => <SkillItem key={x.sk.id} x={x} idx={i} />)}<CpItem key="cp" s={s} idx={n} /></ol> : null}
      {s.state === "later" ? <div class="pt-later"><button class="btn sm" type="button" onClick={() => testOut(s)}>Test out</button></div> : null}
    </section>
  );
}
