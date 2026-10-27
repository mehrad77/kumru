// "Fix my mistakes": the saved fixes of the tutor as two questions, Spot the right one and Fix the sentence.
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { bidiTxt } from "../../../core/i18n.ts";
import { S } from "../../../core/store.ts";
import { Lazy } from "../../../ui/Lazy.tsx";
import { Pup } from "../../../ui/Pup.tsx";
import { speak } from "../../../ui/speech.ts";
import { KbdRow, Mic } from "../../../ui/TypeAids.tsx";
import { bumpDay, recordEx } from "../../progress/index.ts";
import { loadExplain, loadFixNote, mistakeSeen, sameSent } from "../../tutor/index.ts";
import { QKind } from "../common.tsx";
import { feedback, footCheck, markMiss, renderStep } from "../engine.ts";
import type { Prep } from "../prepare.ts";
import type { Step } from "../types.ts";
import { useHint } from "./parts.tsx";

/** What a saved fix says: its explanation and the lesson it belongs to. */
const FixNote = ({ m }: { m: Extract<Prep, { type: "spot" }>["m"] }) => <Lazy load={loadFixNote} props={{ m }} />;

export function Spot({ p, st }: { p: Extract<Prep, { type: "spot" }>; st: Step }) {
  const { m, opts } = p;
  const [picked, setPicked] = useState<number | null>(null);
  useHint();
  const pick = (i: number) => {
    if (picked !== null) return;
    const ok = opts[i] === m.fixed;
    setPicked(i);
    mistakeSeen(m, ok);
    recordEx("mist", ok);
    bumpDay();
    if (!ok) markMiss(m.fixed, m.fa || m.en || "");
    speak(m.fixed);
    feedback(ok, ok ? "Correct" : "The correct sentence", <div class="w-word" lang="tr">{m.fixed}</div>, <FixNote m={m} />);
  };
  return (
    <>
      <QKind text="Spot the right one" st={st} />
      <h2 class="q-title">Which sentence is correct?</h2>
      <div class="choices">
        {opts.map((o, i) => <button class={"choice" + (picked !== null ? (o === m.fixed ? " right" : i === picked ? " wrong" : "") : "")} type="button" lang="tr" disabled={picked !== null} onClick={() => pick(i)}>{o}</button>)}
      </div>
    </>
  );
}

export function Fixit({ p, st }: { p: Extract<Prep, { type: "fixit" }>; st: Step }) {
  const { m } = p;
  const inp = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(m.orig);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const latest = useRef(text);
  latest.current = text;
  const ready = verdict === null && text.trim().length > 0;
  const run = () => {
    const ok = sameSent(latest.current, m.fixed);
    setVerdict(ok);
    mistakeSeen(m, ok);
    recordEx("mist", ok);
    bumpDay();
    if (!ok) markMiss(m.fixed, m.fa || "");
    speak(m.fixed);
    feedback(ok, ok ? "Fixed!" : "The correct sentence", ok ? null : <div class="w-word" lang="tr">{m.fixed}</div>, <FixNote m={m} />);
  };
  const runRef = useRef(run);
  runRef.current = run;
  useLayoutEffect(() => { if (verdict === null) footCheck("Check", () => ready, () => runRef.current()); }, [ready, verdict]);
  useEffect(() => {
    const t = setTimeout(() => { const i = inp.current; if (i) { i.focus({ preventScroll: true }); i.setSelectionRange(i.value.length, i.value.length); } }, 60);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      <QKind text="Fix the sentence" st={st} />
      <h2 class="q-title">Edit it until it's correct</h2>
      <div class="fix-orig" lang="tr">{m.orig}</div>
      {m.fa || m.en ? <details class="fix-hint"><summary>Hint</summary><Lazy load={loadExplain} props={{ fa: m.fa, en: m.en }} /></details> : null}
      <div class="type-row">
        <input ref={inp} class={"type-in" + (verdict === true ? " right" : verdict === false ? " wrong" : "")} lang="tr" autocomplete="off" autocapitalize="off" spellcheck={false} aria-label="Corrected sentence" readOnly={verdict !== null} value={text} onInput={(e) => setText((e.currentTarget as HTMLInputElement).value)} />
        <Mic box={inp} />
      </div>
      <KbdRow box={inp} />
    </>
  );
}

/** Every saved fix has been practised. */
export function AllFixed() {
  useLayoutEffect(() => { footCheck("See my report", () => true, () => { S.session.timeUp = true; renderStep(); }); }, []);
  return (
    <div class="intro">
      <Pup mood="cheer" size={104} />
      <span class="lbl">All fixed</span>
      <h2>Every saved fix is practised!</h2>
      <p class="hint">{bidiTxt("New fixes will appear after your next chat or “Try it” check.")}</p>
    </div>
  );
}
