// The placement steps: how much Turkish the learner says they know, the short check (placement feature), an optional writing sample
// for the tutor, and the suggested start (which the learner may lower, never raise: going further is the Path's tested Jump here).
import { useEffect, useRef, useState } from "preact/hooks";
import { S } from "../../../core/store.ts";
import { idxUnit, LEVELS, unitIdx, unitLabel } from "../../../lib/units.ts";
import { Pup } from "../../../ui/Pup.tsx";
import { Seg } from "../../../ui/Seg.tsx";
import { Lazy } from "../../../ui/Lazy.tsx";
import { KbdRow, Mic } from "../../../ui/TypeAids.tsx";
import { PL_SELF, applyPlacement, loadClimb, plNudge, type PlacementResult } from "../../placement/index.ts";
import { myLevel } from "../../progress/index.ts";
import { Next, Skip, StepView, Think, useFlow } from "../Flow.tsx";
import type { WritingResult } from "../model/flow.ts";
import { aiErrText, checkPlacement, seedPlacementMistakes } from "../../tutor/index.ts";

const EMPTY_RES: PlacementResult = { idx: 0, probes: [], recs: { words: [], drills: [] } };

export function SelfStep() {
  const { O, mode, go, skipCheck } = useFlow();
  const [sel, setSel] = useState(O.self);
  const opts: [string, string, number][] = [...(mode === "update" ? [["keep", "Keep my level (" + myLevel() + ") and skip the check", -1] as [string, string, number]] : []), ...PL_SELF];
  const pick = (id: string) => { O.self = id; setSel(id); };
  const next = () => {
    if (!opts.some((x) => x[0] === O.self)) return;
    O.skipPlace = O.self === "keep";
    O.res = null;
    go();
  };
  return (
    <StepView dots foot={<><Next onClick={next} disabled={!sel} /><Skip text="Skip the check" onClick={skipCheck} /></>}>
      <Pup mood="idle" size={96} />
      <h1 lang="tr">Ne kadar Türkçe biliyorsun?</h1>
      <p>How much Turkish do you know? A short check follows, about 3 minutes.</p>
      <div class="onb-opts" role="radiogroup" aria-label="How much Turkish do you know?">
        {opts.map(([id, en]) => {
          const on = sel === id;
          return <button class={"onb-opt" + (on ? " on" : "")} type="button" role="radio" aria-checked={on} aria-pressed={on} onClick={() => pick(id)}><b>{en}</b></button>;
        })}
      </div>
      <p class="hint">The check only gives you credit for what you show. Words become “practiced”, never “known”, and nothing is marked learned by a lucky guess.</p>
    </StepView>
  );
}

export function QuizStep() {
  const { O, go, skipCheck } = useFlow();
  const [, tick] = useState(0);
  const start = PL_SELF.find((x) => x[0] === O.self)?.[2] ?? 0;
  const onDone = (r: PlacementResult) => { O.res = r; go(); };
  if (!S.loaded || !S.gLoaded) {
    return (
      <StepView cls="onb-pl" foot={<><Next text="Try again" onClick={() => tick((n) => n + 1)} /><Skip text="Skip the check" onClick={skipCheck} /></>}>
        <p>The notebook is still loading.</p>
      </StepView>
    );
  }
  return (
    <StepView cls="onb-pl" foot={<Skip text="Skip the check" onClick={skipCheck} />}>
      <div class="pl-body"><Lazy load={loadClimb} props={{ startIdx: start, onDone }} /></div>
    </StepView>
  );
}

export function WritingStep() {
  const { O, go } = useFlow();
  const [text, setText] = useState(""), [msg, setMsg] = useState(""), [busy, setBusy] = useState<{ stop: () => void } | null>(null);
  const box = useRef<HTMLTextAreaElement>(null), alive = useRef(true), ctl = useRef<AbortController | null>(null);
  useEffect(() => { const h = setTimeout(() => box.current?.focus(), 50); return () => { clearTimeout(h); alive.current = false; ctl.current?.abort(); }; }, []);
  const send = async () => {
    const t = text.trim();
    if (!t) return;
    const c = ctl.current = new AbortController();
    setBusy({ stop: () => c.abort() });
    try {
      const r = (await checkPlacement(t, c.signal)) as WritingResult;
      if (!alive.current) return;
      O.ai = r;
      ctl.current = null;
      void seedPlacementMistakes(O.ai);
      go();
    } catch (e) {
      if (!alive.current) return;
      ctl.current = null;
      setBusy(null);
      if (!(e && (e as { code?: string }).code === "cancelled")) setMsg(aiErrText(e) || "Couldn't reach the tutor. You can skip this.");
    }
  };
  if (busy) return <Think msg="The tutor is reading…" stop={busy.stop} />;
  return (
    <StepView dots foot={<><Next text="Send" onClick={send} disabled={!text.trim()} /><Skip text="Skip" /></>}>
      <Pup mood="happy" size={96} />
      <h1 lang="tr">Kendini anlat!</h1>
      <p>Write 2–3 sentences about yourself, in Turkish. Any mistakes are fine; they help me pick the right start.</p>
      <textarea
        ref={box} class="try-in" rows={4} lang="tr" dir="auto" maxLength={400} placeholder="Türkçe yaz…" aria-label="About you in Turkish"
        autocapitalize="sentences" spellcheck={false} value={text} onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)}
      />
      <KbdRow box={box} />
      <Mic box={box} />
      <p class="hint" aria-live="polite">{msg}</p>
    </StepView>
  );
}

export function ResultStep() {
  const { O, go } = useFlow();
  const R = O.res || EMPTY_RES, nud = plNudge(R.idx, O.ai), at = idxUnit(nud);
  const [open, setOpen] = useState(false), [pk, setPk] = useState({ lv: at.lv, u: at.u }), chooser = useRef<HTMLDivElement>(null);
  const fin = (p: { lv: string; u: number }) => { applyPlacement({ idx: nud, probes: R.probes, recs: R.recs, self: O.self ?? undefined, ai: O.ai }, p); go(); };
  // a learner may start at the suggestion or lower, never higher
  const over = (lv: string, u: number) => unitIdx(lv, u) > nud;
  const setLv = (v: string) => { let u = pk.u; if (over(v, u)) u = Math.min(u, idxUnit(nud).lv === v ? idxUnit(nud).u : 1); setPk({ lv: v, u }); };
  useEffect(() => { if (open) chooser.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [open]);
  return (
    <StepView dots foot={<>
      <Next text="Start here" onClick={() => fin({ ...at })} />
      {nud > 0 ? <button class="btn" type="button" onClick={() => fin(idxUnit(nud - 1))}>One unit earlier</button> : null}
      <button class="btn" type="button" onClick={() => setOpen(!open)}>Choose myself</button>
    </>}>
      <Pup mood="cheer" size={110} />
      <h1 lang="tr">Başlangıç noktan</h1>
      <p>{R.probes.length ? "From your answers, we suggest starting here:" : "We suggest starting here:"}</p>
      <div class="onb-sugg card"><b class="onb-big" lang="tr">{at.lv + " · " + unitLabel(at.lv, at.u)}</b></div>
      {nud < R.idx ? <p class="hint">Your writing pointed a little earlier, so we start there.</p> : null}
      <div class="onb-choose" hidden={!open} ref={chooser}>
        <Seg cur={pk.lv} opts={LEVELS.map((l): [string, string] => [l, l])} onPick={setLv} disabled={(l) => over(l, 1)} />
        <Seg cur={pk.u} opts={[1, 2, 3, 4, 5, 6].map((u): [number, string] => [u, "Unit " + u])} onPick={(u) => setPk({ ...pk, u })} disabled={(u) => over(pk.lv, u)} />
        <p class="hint" lang="tr">{unitLabel(pk.lv, pk.u)}</p>
        <p class="hint">To start higher, use Jump here on the path. It checks you first.</p>
        <Next text="Use this" onClick={() => fin({ ...pk })} />
      </div>
    </StepView>
  );
}
