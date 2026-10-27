// The placement quiz: probes of one unit (or section) after another, each of about six words and up to four suffix items, climbing
// like a binary search (model/placement.ts) until the learner's place is found. It draws into whatever holds it (onboarding's
// quiz step, the Path's Jump here and Test out sheets), and calls `onDone` with the result.
import "./placement.css";
import { useEffect, useRef, useState } from "preact/hooks";
import { ALL_V } from "../../lib/morphology.ts";
import { vgroup } from "../drills/index.ts";
import type { PlacementResult, Recs } from "./apply.ts";
import { meaningIsFa, meaningText, plUnitItems, type Item, type Probe } from "./items.ts";
import { plNext, plPass, type Climb as ClimbState } from "./model/placement.ts";

export interface ClimbProps {
  /** The unit (or section) index to probe first. */
  startIdx: number;
  onDone: (result: PlacementResult) => void;
  /** Keeps a jump test inside the skipped units: lo = the unit below the first one probed, hi = the target. */
  bounds?: { lo: number; hi: number } | null;
  /** `items` makes a probe from an index (sections of the tree, instead of units), `max` is the last index. */
  opt?: { items?: (idx: number) => Probe; max?: number };
}

interface Opt { txt: string; ok: boolean; fa?: boolean; tr?: boolean }
interface Shown { unit: Probe; qi: number; picked: number | null }

const optsOf = (it: Item): Opt[] => it.k === "w"
  ? it.opts.map((o) => ({ txt: meaningText(o), fa: meaningIsFa(o), ok: o.id === it.c.id }))
  : it.opts.map((x) => ({ txt: (it.q.pron ? it.q.pron + " " : "") + x, tr: true, ok: x === it.answer }));

export function Climb(props: ClimbProps) {
  const [shown, setShown] = useState<Shown | null>(null);
  const answerRef = useRef<(i: number) => void>(() => {});
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const { startIdx, bounds, opt } = latest.current, make = opt?.items || plUnitItems, max = opt?.max ?? 17;
    let st: ClimbState = { lo: bounds ? bounds.lo : -1, hi: bounds ? bounds.hi : max + 1, p: startIdx, n: 0 };
    let unit!: Probe, qi = 0, cur!: { ref: string; w: [number, number]; g: [number, number] }, busy = false, done = false, timer = 0;
    const probes: PlacementResult["probes"] = [], recs: Recs = { words: [], drills: [] };

    function probe() {
      unit = make(st.p);
      qi = 0;
      cur = { ref: unit.ref, w: [0, 0], g: [0, 0] };
      if (!unit.items.length) return endProbe();
      show();
    }
    function endProbe() {
      const pass = plPass(cur);
      probes.push({ ref: cur.ref, pass, w: cur.w, g: cur.g });
      const nx = plNext(st, pass, max);
      st = nx;
      if (nx.done) { done = true; latest.current.onDone({ idx: nx.idx as number, probes, recs }); }
      else probe();
    }
    function show() {
      busy = false;
      setShown({ unit, qi, picked: null });
    }
    const answer = (i: number) => {
      if (busy || done) return;
      busy = true;
      const it = unit.items[qi], opts = optsOf(it), ok = i >= 0 && opts[i].ok;
      setShown({ unit, qi, picked: i });
      if (it.k === "w") { cur.w[1]++; if (ok) cur.w[0]++; recs.words.push({ id: it.c.id, ok }); }
      else { cur.g[1]++; if (ok) cur.g[0]++; recs.drills.push({ k: it.t.k, lesson: it.t.lesson, vg: vgroup(it.q.orig), ok }); }
      timer = window.setTimeout(() => { if (done) return; qi++; if (qi < unit.items.length) show(); else endProbe(); }, ok ? 450 : 900);
    };
    answerRef.current = answer;
    const onKey = (e: KeyboardEvent) => {
      if (busy || done || !unit) return;
      const i = +e.key - 1;
      if (i >= 0 && i < optsOf(unit.items[qi]).length) answer(i);
    };
    document.addEventListener("keydown", onKey);
    probe();
    return () => { done = true; clearTimeout(timer); document.removeEventListener("keydown", onKey); };
  }, []);

  if (!shown) return null;
  const { unit, qi, picked } = shown, it = unit.items[qi], n = unit.items.length, opts = optsOf(it);
  let prompt;
  if (it.k === "w") {
    prompt = (
      <>
        <h2 class="q-title">What does this mean?</h2>
        <div class="q-prompt"><div class="q-word" lang="tr">{it.c.tr}</div></div>
      </>
    );
  } else {
    const o = it.q.orig, vi = Math.max(...[...ALL_V].map((v) => o.lastIndexOf(v)));
    prompt = (
      <>
        <div class="q-kind">Suffix · {it.t.label}</div>
        <h2 class="q-title">Pick the right form</h2>
        <div class="q-prompt"><div class="q-word" lang="tr">{o.slice(0, vi)}<span class="vw">{o[vi]}</span>{o.slice(vi + 1)}<span style="color:var(--faint)"> + ?</span></div></div>
        <div class="q-mean">
          {it.q.pron ? <div class="q-sub">{it.q.prompt}</div> : null}
          <div class="q-sub" lang="fa" dir="rtl">{it.q.fa}</div>
          <div class="q-sub">{it.q.en}</div>
        </div>
      </>
    );
  }
  return (
    <>
      <div class="pl-head"><span>{unit.label || unit.lv + " · Unit " + unit.u}</span><span>{(qi + 1) + " / " + n}</span></div>
      {prompt}
      <div class="choices">
        {opts.map((o, i) => (
          <button
            key={qi + ":" + i} type="button" disabled={picked != null}
            class={"choice" + (picked != null ? (o.ok ? " right" : i === picked ? " wrong" : "") : "")}
            lang={o.tr ? "tr" : o.fa ? "fa" : undefined} dir={o.fa ? "rtl" : undefined}
            onClick={() => answerRef.current(i)}
          >
            <span class="n">{String(i + 1)}</span><span>{o.txt}</span>
          </button>
        ))}
      </div>
      <button class="linkish" type="button" onClick={() => answerRef.current(-1)}>I don't know</button>
    </>
  );
}
