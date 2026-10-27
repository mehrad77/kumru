// Suffix drill: pick the right form of a word with a suffix added.
import { useState } from "preact/hooks";
import { bidiTxt, faTxt } from "../../../core/i18n.ts";
import { S } from "../../../core/store.ts";
import { joinParts } from "../../../lib/morphology.ts";
import { vgroup } from "../../drills/index.ts";
import { drillWhy } from "../../drills/index.ts";
import { mEl, openLesson } from "../../grammar/index.ts";
import { recordDrill, recordEx } from "../../progress/index.ts";
import { QKind } from "../common.tsx";
import { feedback, markMiss } from "../engine.ts";
import type { Prep } from "../prepare.ts";
import type { Step } from "../types.ts";
import { useHint } from "./parts.tsx";

export function Drill({ p, st }: { p: Extract<Prep, { type: "drill" }>; st: Step }) {
  const { t, q, answer, opts, vi, n, acc } = p;
  const o = q.orig as string, pron = q.pron ? q.pron + " " : "";
  const [picked, setPicked] = useState<number | null>(null);
  useHint();
  const pick = (i: number) => {
    if (picked !== null) return;
    const ok = opts[i] === answer;
    setPicked(i);
    recordDrill(t.k, vgroup(o), ok);
    recordEx("drill", ok);
    if (!ok) markMiss(answer, q.fa);
    const g = S.grammar.find((x: { id: string }) => x.id === t.lesson);
    feedback(ok, ok ? "Correct" : "The right form", mEl("div", pron + joinParts(q.ps as never), "w-word"),
      <ul class="why">{drillWhy(q).map((l) => <li>{bidiTxt(l)}</li>)}</ul>,
      g ? <div><button class="linkish" type="button" onClick={() => openLesson(g.id)}>{bidiTxt("Open lesson " + g.order + ": " + g.title)}</button></div> : null);
  };
  return (
    <>
      <QKind text={"Suffix drill · " + t.label} st={st} />
      <h2 class="q-title">Pick the right form</h2>
      <div class="q-prompt"><div class="q-word" lang="tr">{o.slice(0, vi)}<span class="vw">{o[vi]}</span>{o.slice(vi + 1)}<span style="color:var(--faint)"> + ?</span></div></div>
      <div class="q-mean">
        {q.pron ? <div class="q-sub">{bidiTxt(q.prompt)}</div> : null}
        <div class="q-sub" lang="fa" dir="rtl">{faTxt(q.fa)}</div>
        <div class="q-sub">{bidiTxt(q.en)}</div>
      </div>
      <div class="hint">{n ? "Your accuracy here: " + Math.round(acc * 100) + "% over " + n + " tries" : "First try at this suffix"}</div>
      <div class="choices">
        {opts.map((opt, i) => (
          <button class={"choice" + (picked !== null ? (opt === answer ? " right" : i === picked ? " wrong" : "") : "")} type="button" lang="tr" disabled={picked !== null} onClick={() => pick(i)}>
            <span class="n">{String(i + 1)}</span><span>{pron + opt}</span>
          </button>
        ))}
      </div>
    </>
  );
}
