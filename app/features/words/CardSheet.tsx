// /card/<id> (the reader's "Practise in Kumru" links, and its old #card=<id> ones): a small sheet for one card with its practice chip.
import "./words.css";
import { bidiTxt } from "../../core/i18n.ts";
import { SpeakBtn } from "../../ui/Speak.tsx";
import { confBand } from "../progress/index.ts";
import { readerUrl } from "../yeni/index.ts";
import { PracticeChip } from "./PracticeChip.tsx";

export interface SheetCard { id: string; tr: string; fa?: string; en?: string; detail?: string; kind?: string; level?: string }

export function CardSheet({ card: c }: { card: SheetCard }) {
  const ru = readerUrl(c);
  return (
    <div class="acc-form">
      <div class="i-top"><span class="tr big" lang="tr">{c.tr}</span><SpeakBtn text={c.tr} /></div>
      {c.fa ? <div class="fa" lang="fa" dir="rtl">{bidiTxt(c.fa)}</div> : null}
      {c.en ? <div class="en">{bidiTxt(c.en)}</div> : null}
      {c.detail ? <div class="detail">{bidiTxt(c.detail)}</div> : null}
      <div class="gp-card"><PracticeChip id={c.id} /><span class="hint">{confBand(c.id)}</span></div>
      {ru ? <a class="btn sm" href={ru} target="_blank" rel="noopener">See it in the reader ↗</a> : null}
    </div>
  );
}
