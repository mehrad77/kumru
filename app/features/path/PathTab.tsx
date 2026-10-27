// The Path tab: the stats pill, the banners (today's story, Notebook book box: a slot), then the road: the skill tree's
// sections for the levels it covers and the book's units for the rest, under a heading per level. It opens scrolled to the learner's
// next step (the "Start" node); finished sections stay folded until tapped. It redraws from progress (`rev`), the content signals
// and the redraw tick; while a session or another tab is on screen it keeps what it drew.
import "./path.css";
import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { S, redrawTick, signals } from "../../core/store.ts";
import { Icon } from "../../ui/Icon.tsx";
import { Pup } from "../../ui/Pup.tsx";
import { Slot } from "../../ui/Slot.tsx";
import { rev } from "../progress/index.ts";
import { type RoadUnit, buildPath, buildTree, startSkill, treeSecs, treeWanted, useTree } from "./course.ts";
import { meltSoon } from "./melt.ts";
import { openPathLegend, openReviewSheet } from "./sheets.ts";
import { openUnits, tree } from "./state.ts";
import { TopBar } from "./TopBar.tsx";
import { SecSection } from "./Tree.tsx";
import { UnitSection } from "./Units.tsx";

const LEVEL_NAME: Record<string, string> = { A1: "Beginner", A2: "Elementary", B1: "Intermediate" };

function Level({ lv, help, first }: { lv: string; help: boolean; first: boolean }) {
  return (
    <div class="pt-level">
      <span class="pt-lv">{lv}</span><span class="hint">{LEVEL_NAME[lv] || ""}</span>
      {first ? <button class="pt-help pt-rv" type="button" aria-label="Review" title="Review" onClick={() => openReviewSheet()}><Icon name="refresh" class="bi" /></button> : null}
      {help ? <button class="pt-help" type="button" aria-label="What do the steps mean?" title="What do the steps mean?" onClick={() => openPathLegend()}>?</button> : null}
    </div>
  );
}

function draw(): { body: ComponentChildren; T: ReturnType<typeof buildTree> | null } {
  const units: RoadUnit[] = buildPath(), T = useTree() ? buildTree() : null, kids: ComponentChildren[] = [];
  let lastLv = "", helped = false;
  const level = (lv: string) => {
    if (lv === lastLv) return;
    lastLv = lv;
    const help = !!T && !helped;
    if (help) helped = true;
    kids.push(<Level key={"lv-" + lv} lv={lv} help={help} first={!kids.length} />);
  };
  // levels the tree covers come from it; the others still use the book's units
  if (T) for (const s of T.secs) { level(s.sec.level); kids.push(<SecSection key={"sec:" + s.sec.id} s={s} />); }
  const treeLv = new Set(T ? treeSecs().map((s) => s.level) : []);
  for (const x of units) { if (treeLv.has(x.lv)) continue; level(x.lv); kids.push(<UnitSection key={"unit:" + x.i} x={x} />); }
  return { T, body: <><TopBar /><Slot name="pathBanners" />{kids}</> };
}

let devDone = false;
/** Dev only: ?skill=sk_food[&part=1] opens that skill's lesson as soon as the path draws (window.__DEV comes from app/host/dev.ts). */
function devAutostart(T: ReturnType<typeof buildTree> | null): void {
  if (!window.__DEV || !T || devDone) return;
  const q = new URLSearchParams(location.search), id = q.get("skill");
  if (!id) return;
  for (const s of T.secs) {
    const x = s.skills.find((k) => k.sk.id === id);
    if (x) { devDone = true; startSkill(x, +(q.get("part") || 0) || 0); return; }
  }
}

let shown = false;
/** Once each time the tab is opened: bring the learner's next step (the "Start" node) to the middle of the screen. */
function toStart(tab: string, drawn: boolean): void {
  if (tab !== "path") { shown = false; return; }
  if (shown || !drawn) return;
  shown = true;
  requestAnimationFrame(() => document.querySelector("#p-path .pt-start")?.parentElement?.scrollIntoView({ block: "center" }));
}

export function PathTab() {
  const last = useRef<ComponentChildren>(null);
  const tab = signals.tab.value;
  for (const s of [rev, redrawTick, openUnits, tree, signals.loaded, signals.gLoaded, signals.tLoaded, signals.progLoaded, signals.canEdit]) void s.value;
  const busy = !!S.session || tab !== "path";
  let out: ComponentChildren, T: ReturnType<typeof buildTree> | null = null, drawn = false;
  if (busy && last.current) out = last.current;
  else if (!S.loaded || !S.gLoaded || (treeWanted() && !S.tLoaded)) {
    out = <div class="empty"><Pup mood={S.db ? "happy" : "sleepy"} size={88} pose={S.db ? "flying" : undefined} enter={false} /><p>{S.db ? "Kerim is on his way with your path…" : "The path needs the shared notebook, which isn't available in this view."}</p></div>;
  } else { ({ body: out, T } = draw()); drawn = true; }
  last.current = out;
  useEffect(() => {
    toStart(tab, drawn);
    meltSoon();
    devAutostart(T);
  });
  return <>{out}</>;
}
