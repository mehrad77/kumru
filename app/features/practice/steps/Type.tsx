// Type it, Listen and type, Say it: the Turkish word for a meaning (or a sound), built from letter tiles, or said into the mic.
import type { VNode } from "preact";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { Icon } from "../../../ui/Icon.tsx";
import { speak } from "../../../ui/speech.ts";
import { KbdRow, Mic } from "../../../ui/TypeAids.tsx";
import { S } from "../../../core/store.ts";
import { bumpConf, recordCard, recordEx } from "../../progress/index.ts";
import { meaningText } from "../cards.ts";
import { Meaning, QKind, ansLine } from "../common.tsx";
import { feedback, footCheck, markMiss } from "../engine.ts";
import { type Slip, checkTyped, slipReason } from "../model/answers.ts";
import { letterHint, letterValue } from "../model/letters.ts";
import type { Prep } from "../prepare.ts";
import type { Step } from "../types.ts";
import { AudioPrompt } from "./parts.tsx";

/** The learner's text and the fixed text, the slipped letters dotted-underlined (typed letters by i, answer letters by j). */
function slipLines(slip: Slip) {
  const you: (string | VNode)[] = [], fix: (string | VNode)[] = [];
  slip.words.forEach((w, k) => {
    if (k) { you.push(" "); fix.push(" "); }
    const tm = new Set<number>(), gm = new Set<number>();
    for (const o of w.ops) {
      if (o.op === "diacritic" || o.op === "sub") { tm.add(o.i); gm.add(o.j); }
      else if (o.op === "swap") { tm.add(o.i); tm.add(o.i + 1); gm.add(o.j); gm.add(o.j + 1); }
      else if (o.op === "extra") tm.add(o.i);
      else gm.add(o.j);
    }
    [...w.x].forEach((ch, i) => you.push(tm.has(i) ? <span class="slip">{ch}</span> : ch));
    [...w.y].forEach((ch, i) => fix.push(gm.has(i) ? <span class="slip">{ch}</span> : ch));
  });
  return { you, fix };
}

export function TypeStep({ p, st }: { p: Extract<Prep, { type: "type" }>; st: Step }) {
  const { c, listen, voice, hint, plan, recall, syn } = p;
  const inp = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [chosen, setChosen] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const locked = verdict !== null;
  const val = plan ? letterValue(plan, chosen) : text;
  const ready = !locked && val.trim().length > 0;
  const latest = useRef({ val });
  latest.current = { val };

  const run = (giveUp: boolean) => {
    const r = giveUp ? { ok: false } as ReturnType<typeof checkTyped> : checkTyped(latest.current.val, c.tr, syn);
    setVerdict(r.ok);
    bumpConf(c.id, r.ok ? (r.near ? "near" : "right") : "wrong");
    recordCard(c.id, r.ok ? "r" : "w");
    recordEx(listen ? "listen" : "type", r.ok);
    if (!r.ok) markMiss(c.tr, meaningText(c));
    speak(c.tr);
    if (r.near) { const s = S.stats[c.id]; if (s) s.n = (s.n || 0) + 1; }   /* a forgiven slip, counted per word */
    const sn = r.near && r.slip ? slipLines(r.slip) : null;
    feedback(r.ok, r.ok ? (r.near ? "Almost" : "Correct") : (giveUp ? "The answer is" : "Correct answer"),
      sn ? <div class="slipbox"><div class="hint">You wrote: <span lang="tr">{sn.you}</span></div><div class="hint">Auto-fixed to: <span lang="tr">{sn.fix}</span></div><div class="hint">{slipReason(r.slip!) + ". Counted as correct."}</div></div>
        : r.alt ? <div class="hint">{"«" + r.alt.replace(/[.!?]/g, "") + "» means the same too. This card's word:"}</div> : null,
      ansLine(c));
  };
  const runRef = useRef(run);
  runRef.current = run;
  useLayoutEffect(() => { if (!locked) footCheck("Check", () => ready, () => runRef.current(false)); }, [ready, locked]);
  useEffect(() => {
    if (!voice) return;
    const t = setTimeout(() => (document.querySelector("#session .mic-btn") as HTMLElement | null)?.click(), 450);
    return () => clearTimeout(t);
  }, []);

  const tile = (i: number, cls: string, fn: () => void) => <button class={"letter-tile" + cls} type="button" lang="tr" disabled={locked} onClick={fn}>{plan!.tiles[i]}</button>;
  const slot = (k: number) => (chosen[k] !== undefined ? tile(chosen[k], "", () => { if (!locked) setChosen(chosen.filter((_, j) => j !== k)); }) : <span class="letter-slot" aria-hidden="true" />);
  let line = null;
  if (plan) {
    let at = 0;
    /* the line is drawn as the answer's shape: one group of slots per word, so a two-word answer shows its split and each word's length */
    const groups = recall
      ? <div class="lw" style="flex:1 1 0">{chosen.map((_, k) => slot(k))}</div>   /* recall: a known word is built without the empty slots, so its length is not given away */
      : plan.lens.map((n) => { const g = <div class="lw" style={"flex:" + n + " 1 0;max-width:" + n * 43 + "px"}>{Array.from({ length: n }, (_, k) => slot(at + k))}</div>; at += n; return g; });
    line = (
      <div class={"answer-line letters" + (verdict === true ? " right" : verdict === false ? " wrong" : "")} aria-label="Your answer" lang="tr" style={"--n:" + plan.letters.length + ";--w:" + (plan.lens.length - 1)}>{groups}</div>
    );
  }
  return (
    <>
      <QKind text={listen ? "Listen and type" : voice ? "Say it" : "Type it"} st={st} />
      <h2 class="q-title">{listen ? "Type what you hear" : voice ? "Say this in Turkish" : "Write this in Turkish"}</h2>
      {listen ? <AudioPrompt tr={c.tr} /> : <Meaning c={c} big hint={hint} />}
      {plan ? (
        <>
          <div class="letter-row">
            {line}
            {locked ? null : <div class="letter-side"><button class="icon-act" type="button" aria-label="Hint: add the next letter" title="Hint: add the next letter" onClick={() => { if (!locked) setChosen(letterHint(plan, chosen)); }}><Icon name="bulb" /></button></div>}
          </div>
          <div class="bank">
            {plan.tiles.map((_, i) => tile(i, chosen.includes(i) ? " ghost" : "", () => { if (!locked && !chosen.includes(i) && chosen.length < plan.letters.length) setChosen([...chosen, i]); }))}
          </div>
          {locked ? null : <div class="letter-skip"><button class="btn sm ghost" type="button" onClick={() => run(true)}>I don't know</button></div>}
        </>
      ) : (
        <>
          <div class="type-row">
            <input ref={inp} class={"type-in" + (verdict === true ? " right" : verdict === false ? " wrong" : "")} id="type-in" lang="tr" autocomplete="off" autocapitalize="off" spellcheck={false} placeholder="Tap the mic and say it" aria-label="Your answer" readOnly={locked} value={text} onInput={(e) => setText((e.currentTarget as HTMLInputElement).value)} />
            <Mic box={inp} />
          </div>
          <KbdRow box={inp} />
        </>
      )}
    </>
  );
}
