// "What the steps mean": one puck per state, drawn by the same code as the path.
import "../path.css";
import { ICON } from "../../../core/dom.ts";
import { SK_ICON } from "../icons.ts";
import { Badge, Puck, skInner } from "../Puck.tsx";

function Row({ state, icon, title, text, badge }: { state: string; icon: string; title: string; text: string; badge?: string }) {
  return (
    <div class="lg-row">
      <div class={"pt-n sk mini " + state} aria-hidden="true">
        <Puck inner={skInner(state === "locked" ? ICON.lock : SK_ICON[icon])} l={state === "done" ? 1 : state === "cur" ? 0.4 : 0} L={1} />
        {badge ? <Badge state={badge} /> : null}
      </div>
      <div class="lg-t"><b>{title}</b><span class="hint">{text}</span></div>
    </div>
  );
}

export function Legend() {
  return (
    <div class="lg">
      <Row state="cur" icon="wave" title="Up next" text="The step to do now. Its ring fills as you finish its parts." />
      <Row state="done" icon="wave" title="Done" text="You finished it. The stars show how well it went." badge="done" />
      <Row state="locked" icon="wave" title="Locked" text="Opens once you finish the step before it." />
      <Row state="placed" icon="wave" title="Skipped" text="Your placement or a test skipped it. It stays open, and its words wait under Catch up." badge="placed" />
      <Row state="cp" icon="flag" title="Checkpoint" text="A quick mixed check that closes a section and opens the next one." />
    </div>
  );
}
