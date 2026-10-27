// The tutor lab (editors only): runs the test sentences of tutorlab/fixtures through the "Try it" checker one at a time, scores each
// against its expected fix and saves the run for review.
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ICON } from "../../core/dom.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { S } from "../../core/store.ts";
import { toast } from "../../ui/toast.ts";
import { AI_GONE, aiErrText } from "./ai.ts";
import { checkSentence } from "./check.ts";
import { type Fixture, summarize, verdict } from "./model/lab.ts";
import { type CheckResult, type Lesson, TUTOR_V } from "./model/prompts.ts";
import "./tutor.css";

interface Row { f: Fixture; r: CheckResult | null; err: string; wait: boolean }

const MARK = { pass: "✓ pass", close: "≈ close", fail: "✗ fail", err: "error" };

function RowView({ row }: { row: Row }) {
  const { f, r } = row;
  if (row.wait) return <div class="lab-row wait">{bidiTxt("Checking: " + f.text)}</div>;
  const v = verdict(f, r);
  return (
    <div class={"lab-row " + v}>
      <div class="lab-h"><span class="lvl">{f.lesson}</span><b lang="tr">{bidiTxt(f.text)}</b><span class="lab-v">{MARK[v]}</span></div>
      <div class="hint">{bidiTxt("Expected: " + (f.ok ? "correct" : "fix → " + f.fix))}</div>
      {r ? (
        <div>
          <div lang="tr">{bidiTxt("Got: " + (r.ok ? "correct" : "fix → " + r.corrected) + (r.usesTarget ? "" : " · target not used") + " · " + (r.ms / 1000).toFixed(1) + " s")}</div>
          {r.notes.map((n) => <div class="hint">{bidiTxt("[" + (n.lesson || "–") + "] " + n.en + (n.fa ? "  ·  " + n.fa : ""))}</div>)}
        </div>
      ) : <div class="try-err">{row.err}</div>}
    </div>
  );
}

export function TutorLab({ fx, close }: { fx: Fixture[]; close: () => void }) {
  const [rows, setRows] = useState<Row[]>([]), [running, setRunning] = useState(false);
  const ctl = useRef<AbortController | null>(null);
  // closing the lab stops a run that is still going
  useEffect(() => () => ctl.current?.abort(), []);
  const sum = useMemo(() => summarize(rows.filter((x): x is Row & { r: CheckResult } => !!x.r) as { f: Fixture; r: CheckResult }[]), [rows]);

  const run = async () => {
    const c = ctl.current = new AbortController();
    const res: { f: Fixture; r: CheckResult }[] = [];
    let list: Row[] = [];
    const show = (l: Row[]) => { list = l; setRows(l); };
    show([]);
    setRunning(true);
    for (const f of fx) {
      if (c.signal.aborted) break;
      const L = S.grammar.find((g: Lesson) => g.id === f.lesson) as Lesson | undefined;
      if (!L) continue;
      show([...list, { f, r: null, err: "", wait: true }]);
      const done = (row: Row) => show([...list.slice(0, -1), row]);
      try {
        const r = await checkSentence(L, f.text, { signal: c.signal });
        res.push({ f, r });
        done({ f, r, err: "", wait: false });
      } catch (e) {
        const code = (e as { code?: string } | null)?.code;
        if (code === "cancelled") { show(list.slice(0, -1)); break; }
        done({ f, r: null, err: aiErrText(e) || String(code), wait: false });
        if (code === "rate_limited" || (code && AI_GONE.includes(code))) break;
      }
    }
    const s = summarize(res);
    setRunning(false);
    ctl.current = null;
    if (res.length) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (S.db as any).doc("tutorlab/run-" + Date.now()).set({ at: Date.now(), v: TUTOR_V, summary: { caught: s.caught, errors: s.errors, falseFlags: s.falseFlags, correct: s.correct, exact: s.exact, link: s.link, medianMs: s.medianMs }, results: res.map(({ f, r }) => ({ ...f, got: r })) });
        toast("Run saved for review");
      } catch { toast("Couldn't save the run"); }
    }
  };

  const cards: [string, string][] = [["Errors caught", sum.caught + "/" + sum.errors], ["False flags", sum.falseFlags + "/" + sum.correct], ["Exact fixes", sum.exact + "/" + sum.errors], ["Right lesson linked", sum.link + "/" + sum.errors], ["Median time", sum.median]];
  return (
    <>
      <div class="lp-bar">
        <button class="lp-back" type="button" aria-label="Close" onClick={close} dangerouslySetInnerHTML={{ __html: ICON.back }} />
        <div class="lp-crumb"><span>{"Editor tools · prompt " + TUTOR_V}</span></div>
        <span />
      </div>
      <article class="lp-wrap">
        <h1 class="lab-title">Tutor lab</h1>
        <p class="hint">Runs typical Persian-speaker sentences through the “Try it” checker, one at a time. Each run is saved so we can review it and tune the instructions.</p>
        {fx.length ? (
          <div class="try-act">
            <button class="btn primary" type="button" disabled={running} onClick={() => void run()}>{"Run all " + fx.length + " checks"}</button>
            <button class="btn" type="button" hidden={!running} onClick={() => ctl.current?.abort()}>Stop</button>
          </div>
        ) : <p class="try-err">No test sentences found.</p>}
        <div class="lab-sum">{cards.map(([k, v]) => <div class="card"><div class="v">{v}</div><div class="hint">{k}</div></div>)}</div>
        <div class="lab-rows">{rows.map((row) => <RowView row={row} />)}</div>
      </article>
    </>
  );
}
