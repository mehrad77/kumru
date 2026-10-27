// The steps a path node draws besides the questions: the intro ("Up next"), a lesson to read, a lite lesson's cards and their quick
// check, and the lesson's last card.
import { useLayoutEffect, useMemo, useState } from "preact/hooks";
import { bidiTxt, faTxt } from "../../../core/i18n.ts";
import { S } from "../../../core/store.ts";
import { plainM } from "../../../lib/morphology.ts";
import { Pup } from "../../../ui/Pup.tsx";
import { SpeakBtn } from "../../../ui/Speak.tsx";
import { mEl, openLesson, quizLine, renderBlock } from "../../grammar/index.ts";
import { recordEx } from "../../progress/index.ts";
import { DomNode, Kid } from "../common.tsx";
import { feedback, footCheck, markMiss, next, praiseEl } from "../engine.ts";
import { fmtClock } from "../model/time.ts";
import type { Prep } from "../prepare.ts";

const Fa = ({ tag = "p", t, cls }: { tag?: string; t?: string; cls?: string }) => {
  if (!t) return null;
  const Tag = tag as "p";
  return <Tag class={cls} lang="fa" dir="rtl">{faTxt(t)}</Tag>;
};

/** A node of mixed-script text with suffix markup (a lesson's title, a card's line). */
const M = ({ tag = "p", s, cls }: { tag?: string; s: string; cls?: string }) => <DomNode node={mEl(tag, s, cls)} />;

/** An example sentence of a lesson: the Turkish with its listen button, the Persian and the English. */
function Example({ ex: [tr, fa, en] }: { ex: string[] }) {
  return (
    <div class="exi">
      <div class="i-top"><span class="w-word" lang="tr">{bidiTxt(tr)}</span><SpeakBtn text={tr} /></div>
      <Fa tag="div" t={fa} cls="w-fa" />
      <div class="w-en">{bidiTxt(en)}</div>
    </div>
  );
}

/** "Up next": the title and what the step is, Kerim above. */
export function Intro({ p }: { p: Extract<Prep, { type: "intro" }> }) {
  const { st } = p, s = S.session;
  useLayoutEffect(() => { footCheck("Let's go", () => true, next); }, [st]);
  return (
    <div class="intro">
      <Pup mood={st.icon === "book" ? "think" : "happy"} size={104} />
      <span class="lbl">Up next</span>
      <h2>{bidiTxt(st.title)}</h2>
      <p class="hint">{bidiTxt(st.sub)}</p>
      {s.i > 0 && s.mins ? <div class="hint">{s.right + " right so far · " + fmtClock(s.endAt - Date.now()) + " left"}</div> : null}
    </div>
  );
}

/** A grammar lesson to read before its check. */
export function Read({ p }: { p: Extract<Prep, { type: "read" }> }) {
  const L = p.st.L;
  useLayoutEffect(() => { footCheck("I've read it · quick check", () => true, next); }, [p.st]);
  const blocks = useMemo(() => (L.blocks || []).map((b: never) => renderBlock(b)).filter(Boolean) as HTMLElement[], [L]);
  return (
    <>
      <div class="q-kind">{bidiTxt("Lesson " + L.order + " · " + L.section)}</div>
      <h2 class="q-title">{bidiTxt(L.title)}</h2>
      <p class="hint" style="font-size:15px">{bidiTxt(L.en)}</p>
      <Fa t={L.fa} cls="lfa" />
      <div class="read-body">
        {blocks.map((b) => <DomNode node={b} />)}
        {L.ex && L.ex.length ? <div class="ex-list"><div class="lbl">Examples</div>{L.ex.map((ex: string[]) => <Example ex={ex} />)}</div> : null}
        {L.tip ? <div class="tip mem"><div class="lbl">Remember</div><div>{bidiTxt(L.tip.en)}</div>{L.tip.fa ? <Fa tag="div" t={L.tip.fa} /> : null}</div> : null}
      </div>
    </>
  );
}

/** One card of a lite lesson: one idea per screen. */
export function LiteCard({ p }: { p: Extract<Prep, { type: "card" }> }) {
  const { L, i } = p.st, c = L.lite[i] || {};
  useLayoutEffect(() => { footCheck("Got it", () => true, next); }, [p.st]);
  const show = useMemo(() => (c.show ? renderBlock(c.show) : null), [c]);
  return (
    <div class="lite-card">
      <div class="lite-top">
        <span class="q-kind">{bidiTxt("Lesson " + L.order + " · " + (i + 1) + " of " + L.lite.length)}</span>
        <button class="btn sm ghost" type="button" onClick={() => openLesson(L.id)}>Full lesson</button>
      </div>
      {i === 0 ? <h2 class="q-title"><M tag="span" s={L.title} /></h2> : null}
      <M s={c.en || ""} cls="lite-en" />
      <Fa t={c.fa} cls="lite-fa" />
      {show ? <div class="lite-show"><DomNode node={show} /></div> : null}
      {c.ex && c.ex.length ? <div class="lite-ex">{c.ex.map((ex: string[]) => <Example ex={ex} />)}</div> : null}
    </div>
  );
}

/** A lite card's quick check: fill the gap. */
export function CardQ({ p }: { p: Extract<Prep, { type: "cardq" }> }) {
  const { st, order } = p, it = st.it, a = Math.max(0, Math.min(it.opts.length - 1, +it.a || 0));
  const [picked, setPicked] = useState<number | null>(null);
  const line = useMemo(() => quizLine(it, picked === null ? null : it.opts[a]), [it, picked]);
  const pick = (j: number, n: number) => {
    if (picked !== null) return;
    const ok = j === a;
    setPicked(n);
    recordEx("quiz", ok, st.L && st.L.id);
    if (!ok) markMiss(plainM(it.q.replace(/_{2,}/, it.opts[a])), it.fa || it.en || "");
    feedback(ok, ok ? "Correct" : "Not quite", it.why ? <M tag="div" s={it.why} cls="hint" /> : null, it.fa ? <Fa tag="div" t={it.fa} cls="w-fa" /> : null, it.en ? <div class="w-en">{bidiTxt(it.en)}</div> : null);
  };
  return (
    <>
      <div class="q-kind">{bidiTxt(st.label + " · quick check")}</div>
      <h2 class="q-title">Fill the gap</h2>
      <DomNode node={line} />
      <div class="choices">
        {order.map((j, n) => (
          <button class={"choice" + (picked !== null ? (j === a ? " right" : picked === n ? " wrong" : "") : "")} type="button" lang="tr" disabled={picked !== null} onClick={() => pick(j, n)}>
            <span class="n">{String(n + 1)}</span><M tag="span" s={it.opts[j]} />
          </button>
        ))}
      </div>
    </>
  );
}

/** The last card of a lesson: learned, or not yet. */
export function LessonDone({ p }: { p: Extract<Prep, { type: "lessondone" }> }) {
  const { L, ok, r, w } = p.st;
  useLayoutEffect(() => { footCheck("Continue", () => true, next); }, [p.st]);
  const praise = useMemo(() => (ok ? praiseEl() : null), [ok]);
  return (
    <div class="intro">
      <Pup mood={ok ? "cheer" : "sad"} size={110} />
      <span class="lbl">{ok ? "Lesson complete" : "Almost there"}</span>
      <h2>{bidiTxt("Lesson " + L.order + ": " + L.title)}</h2>
      <p class="hint">{ok ? "Marked as learned. " + r + " of " + (r + w) + " right in the check." : "Only " + r + " of " + (r + w) + " right. It stays open so you can come back to it."}</p>
      {praise ? <Kid k={praise} /> : null}
    </div>
  );
}
