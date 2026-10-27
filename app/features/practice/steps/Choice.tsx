// Multiple choice: pick the right meaning or the right word. With `audio` the question is a sound (the Lab's Hear and pick).
import { useRef, useState } from "preact/hooks";
import { bidiTxt } from "../../../core/i18n.ts";
import { SpeakBtn } from "../../../ui/Speak.tsx";
import { speak } from "../../../ui/speech.ts";
import { bumpConf, recordCard, recordEx } from "../../progress/index.ts";
import { bothFor, meaningIsFa, meaningText } from "../cards.ts";
import { KnowBtn, Meaning, QKind, ansLine } from "../common.tsx";
import { feedback, markMiss } from "../engine.ts";
import { markKnownNow } from "../knownNow.ts";
import type { Prep } from "../prepare.ts";
import type { Step } from "../types.ts";
import { AudioPrompt, useHint } from "./parts.tsx";

export function Choice({ p, st }: { p: Extract<Prep, { type: "choice" }>; st: Step }) {
  const { c, toTr, list, audio, hint, skip } = p;
  const [picked, setPicked] = useState<number | null>(null);
  const known = useRef(false);
  useHint();
  const pick = (i: number) => {
    if (picked !== null || known.current) return;
    const o = list[i], ok = o.id === c.id;
    setPicked(i);
    bumpConf(c.id, ok ? "right" : "wrong");
    recordCard(c.id, ok ? "r" : "w");
    recordEx("choice", ok);
    if (!ok) markMiss(c.tr, meaningText(c));
    if (toTr || ok) speak(c.tr);
    feedback(ok, ok ? "Correct" : "Not quite", ansLine(c));
  };
  return (
    <>
      <QKind text={audio ? "Hear and pick" : "Multiple choice"} st={st} />
      <h2 class="q-title">{audio ? "What did you hear?" : toTr ? "Which is the Turkish?" : "What does this mean?"}</h2>
      {audio ? <AudioPrompt tr={c.tr} /> : toTr ? <Meaning c={c} big hint={hint} /> : <div class="q-prompt"><div class="q-word" lang="tr">{c.tr}</div><SpeakBtn text={c.tr} /></div>}
      <div class="choices">
        {list.map((o, i) => {
          const txt = toTr ? o.tr : meaningText(o), fa = !toTr && meaningIsFa(o);
          const cls = "choice" + (picked !== null ? (o.id === c.id ? " right" : i === picked ? " wrong" : "") : "");
          return (
            <button class={cls} type="button" lang={fa ? "fa" : toTr ? "tr" : undefined} dir={fa ? "rtl" : undefined} disabled={picked !== null} onClick={() => pick(i)}>
              <span class="n">{String(i + 1)}</span>
              <span class="opt-t">
                <span>{bidiTxt(txt)}</span>
                {!toTr && fa && o.en && bothFor(c) ? <span class="opt-sub" lang="en" dir="ltr">{bidiTxt(o.en)}</span> : null}
              </span>
            </button>
          );
        })}
      </div>
      {skip && picked === null ? <KnowBtn onClick={() => { if (picked === null && !known.current) { known.current = true; markKnownNow(st); } }} /> : null}
    </>
  );
}
