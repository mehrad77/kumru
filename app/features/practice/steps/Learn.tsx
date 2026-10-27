// A new word of a lesson: the card with its meanings and notes, spoken once.
import { useLayoutEffect } from "preact/hooks";
import { faTxt } from "../../../core/i18n.ts";
import { SpeakBtn } from "../../../ui/Speak.tsx";
import { speak } from "../../../ui/speech.ts";
import { T } from "../cards.ts";
import { KnowBtn } from "../common.tsx";
import { footCheck, next } from "../engine.ts";
import { markKnownNow } from "../knownNow.ts";
import type { Prep } from "../prepare.ts";

export function Learn({ p }: { p: Extract<Prep, { type: "learn" }> }) {
  const { c, st } = p;
  useLayoutEffect(() => {
    const t = setTimeout(() => speak(c.tr), 200);
    footCheck(st.n < st.of ? "Next word" : "Practise them", () => true, next);
    return () => clearTimeout(t);
  }, [c]);
  return (
    <>
      <div class="q-kind">{"New word · " + st.n + " of " + st.of}</div>
      <div class="flip card learn">
        <span class="lbl">{T(c.topic || "")}</span>
        <div class="q-prompt" style="justify-content:center"><div class="q-word" lang="tr">{c.tr}</div><SpeakBtn text={c.tr} /></div>
        <div class="ans">
          {c.fa ? <div class="fa" lang="fa" dir="rtl">{faTxt(c.fa)}</div> : null}
          {c.en ? <div class="en">{T(c.en)}</div> : null}
          {c.origin ? <span class={"pill " + (c.origin === "shared" ? "shared" : "false")}>{c.origin === "shared" ? "Shared root with Persian" : "False friend"}</span> : null}
          {c.detail ? <div class="note">{T(c.detail)}</div> : null}
          {c.ex ? <div class="note" lang="tr">{c.ex}</div> : null}
        </div>
        {st.pool ? <KnowBtn onClick={() => markKnownNow(st)} /> : null}
      </div>
    </>
  );
}
