// The two reports a session ends with: a path node's (stars, XP, the day's goal, new words, what to review) and a timed or Lab
// session's (answers, accuracy, best streak, or how the words moved in the Lab). Their data and buttons are built by kinds.ts.
import { useLayoutEffect } from "preact/hooks";
import { bidiTxt, faTxt } from "../../../core/i18n.ts";
import { Icon } from "../../../ui/Icon.tsx";
import { Pup } from "../../../ui/Pup.tsx";
import { Ring } from "../../../ui/Ring.tsx";
import { foot } from "../engine.ts";
import type { Action, CustomReport, NodeReport } from "../kinds.ts";
import type { Prep } from "../prepare.ts";

function useActions(actions: Action[]) {
  useLayoutEffect(() => { foot.value = { t: "buttons", items: actions }; }, [actions]);
}

const Stat = ({ v, label }: { v: string; label: string }) => <div class="card"><div class="v">{v}</div><div class="hint">{label}</div></div>;

/** The words to look at again, one row per Turkish word. */
function Missed({ title, rows }: { title: string; rows: [string, string][] }) {
  if (!rows.length) return null;
  return (
    <div class="missed card">
      <span class="lbl">{title}</span>
      {rows.map(([tr, mean]) => <div class="tr-row"><span class="w" lang="tr">{bidiTxt(tr)}</span>{mean ? <div class="f" lang="fa" dir="rtl">{faTxt(mean)}</div> : null}</div>)}
    </div>
  );
}

const Stars = ({ n }: { n: number }) => (
  <div class="nr-stars"><span class="stars" aria-label={n + " of 3 stars"}>{[0, 1, 2].map((i) => <span class={i < n ? "on" : ""}>★</span>)}</span></div>
);

function NodeReportView({ d }: { d: NodeReport }) {
  useActions(d.actions);
  return (
    <div class="summary node-report">
      <Pup mood={d.ok ? "cheer" : "sad"} size={110} />
      <h2>{bidiTxt(d.title)}</h2>
      {d.ok ? <Stars n={d.stars} /> : <p class="hint">You need about half right to learn this lesson. It stays open, so try again.</p>}
      <div class="nr-xp"><Icon name="spark" class="bi" /><b>{"+" + d.gained + " XP"}</b>{d.bonus ? <span class="hint">{"includes +" + d.bonus + " for finishing"}</span> : null}</div>
      {d.next ? <p class="hint">{bidiTxt("Next up: " + d.next)}</p> : null}
      <div class="sum-stats">
        <Stat v={String(d.tot)} label="answers" />
        <Stat v={d.acc + "%"} label="accuracy" />
        <div class="card pt-goal"><Ring v={d.goal.xp} max={d.goal.max} small /><div class="hint">daily goal</div></div>
      </div>
      {d.newWords.length ? (
        <div class="card rep">
          <span class="lbl">New words</span>
          <div class="wordcloud">{d.newWords.map((c) => <span class="wc"><b lang="tr">{bidiTxt(c.tr)}</b><span lang="fa">{faTxt(c.fa || c.en || "")}</span></span>)}</div>
        </div>
      ) : null}
      <Missed title="To review next time" rows={d.missed} />
    </div>
  );
}

function CustomReportView({ d }: { d: CustomReport }) {
  useActions(d.actions);
  const { moved } = d;
  return (
    <div class="summary">
      <Pup mood={d.acc >= 70 ? "cheer" : d.acc >= 40 ? "happy" : "sad"} size={110} />
      <h2>{bidiTxt(d.headline)}</h2>
      <p class="hint">{d.studied}</p>
      {d.lab
        ? <div class="nr-xp lab-moved"><Icon name="check" class="bi" /><b>{moved.n ? moved.up + " up · " + moved.dn + " down" : "No change"}</b><span class="hint">word confidence · Lab practice earns no XP</span></div>
        : <div class="nr-xp"><Icon name="spark" class="bi" /><b>{"+" + d.gained + " XP"}</b></div>}
      <div class="sum-stats">
        <Stat v={String(d.tot)} label="answers" />
        <Stat v={d.acc + "%"} label="accuracy" />
        <Stat v={String(d.best)} label="best streak" />
      </div>
      <Missed title={d.missedTitle} rows={d.missed} />
    </div>
  );
}

export function Report({ p }: { p: Extract<Prep, { type: "report" }> }) {
  const d = p.st.data as NodeReport | CustomReport;
  return d.kind === "node" ? <NodeReportView d={d} /> : <CustomReportView d={d} />;
}
