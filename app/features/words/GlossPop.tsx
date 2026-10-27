// The tap-to-translate popup: a word's Persian and English meaning, and for a word that has a card, how it is going and a link
// to the reader's page for it. Placed next to the word that was tapped (gloss.ts mounts it).
import "./words.css";
import { useLayoutEffect } from "preact/hooks";
import { bidiTxt } from "../../core/i18n.ts";
import { SpeakBtn } from "../../ui/Speak.tsx";
import { readerUrl } from "../yeni/index.ts";
import type { GlossInfo } from "./gloss.ts";
import { PracticeChip } from "./PracticeChip.tsx";

/** Beside the word when it fits, below it when there is room, else above. */
function place(pop: HTMLElement, anchor: Element): void {
  const r = anchor.getBoundingClientRect(), pw = Math.min(260, window.innerWidth - 24);
  pop.style.width = pw + "px";
  pop.style.left = Math.max(12, Math.min(window.innerWidth - pw - 12, r.left + r.width / 2 - pw / 2)) + "px";
  const below = r.bottom + 8 + pop.offsetHeight < window.innerHeight;
  pop.style.top = (below ? r.bottom + 8 : r.top - 8 - pop.offsetHeight) + "px";
  pop.style.visibility = "";
}

export function GlossPop({ pop, anchor, word, info }: { pop: HTMLElement; anchor: Element; word: string; info: GlossInfo }) {
  useLayoutEffect(() => place(pop, anchor), []);
  const ru = info.card ? readerUrl(info.card as { id: string }) : null;
  return (
    <>
      <div class="gp-h"><b lang="tr">{word}</b><SpeakBtn text={word} /></div>
      {info.fa ? <div class="fa" lang="fa" dir="rtl">{bidiTxt(info.fa)}</div> : null}
      {info.en ? <div class="hint">{bidiTxt(info.en + (info.note ? " (" + info.note + ")" : ""))}</div> : null}
      {info.card ? (
        <div class="gp-card">
          <span class="pill">In Words</span>
          <PracticeChip id={info.card.id as string} />
          {ru ? <a class="pill" href={ru} target="_blank" rel="noopener">Reader ↗</a> : null}
        </div>
      ) : null}
    </>
  );
}
