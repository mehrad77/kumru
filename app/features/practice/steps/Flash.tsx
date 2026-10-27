// Flashcards: flip a card, then rate how well you knew it.
import { useLayoutEffect, useState } from "preact/hooks";
import { S } from "../../../core/store.ts";
import { SpeakBtn } from "../../../ui/Speak.tsx";
import { speak } from "../../../ui/speech.ts";
import { undoToast } from "../../../ui/toast.ts";
import { addXp, bumpConf, confOf, recordCard, recordEx, saveProgress } from "../../progress/index.ts";
import { CONF_SURE, T, meaningText } from "../cards.ts";
import { KnowBtn, Meaning, QKind, confLabel } from "../common.tsx";
import { footCheck, footRate, markMiss, next } from "../engine.ts";
import { knownMsg } from "../knownNow.ts";
import type { Prep } from "../prepare.ts";
import { faTxt } from "../../../core/i18n.ts";
import type { Step } from "../types.ts";

export function Flash({ p, st }: { p: Extract<Prep, { type: "flash" }>; st: Step }) {
  const { c, rev } = p;
  const [open, setOpen] = useState(false);
  const [canKnow] = useState(() => confOf(c.id) < CONF_SURE);
  useLayoutEffect(() => {
    if (!open) { footCheck("Show answer", () => true, () => setOpen(true)); return; }
    if (rev) speak(c.tr);
    footRate((k, ev) => {
      bumpConf(c.id, ev);
      recordCard(c.id, k);
      recordEx("flash", k !== "a");
      if (k === "a") { S.session.wrong++; markMiss(c.tr, meaningText(c)); } else { S.session.right++; addXp(1); }
      next();
    });
  }, [open]);
  const know = () => {
    const prev = S.conf[c.id];
    bumpConf(c.id, "claim");
    saveProgress();
    next();
    undoToast(knownMsg(c), () => { if (prev) S.conf[c.id] = prev; else delete S.conf[c.id]; saveProgress(); });
  };
  const word = (
    <div class="q-prompt" style="justify-content:center"><div class="q-word" lang="tr">{c.tr}</div><SpeakBtn text={c.tr} /></div>
  );
  return (
    <>
      <QKind text="Flashcard" st={st} />
      <h2 class="q-title">{rev ? "Do you know the Turkish?" : "Do you know what it means?"}</h2>
      <div class="flip card">
        <div class="lbl">{T(confLabel(c))}</div>
        {rev ? <Meaning c={c} big /> : word}
        {open ? (
          <div class="ans">
            {rev ? word : <>
              {c.fa ? <div class="fa" lang="fa" dir="rtl">{faTxt(c.fa)}</div> : null}
              {c.en ? <div class="en">{T(c.en)}</div> : null}
            </>}
            {c.origin ? <span class={"pill " + (c.origin === "shared" ? "shared" : "false")}>{c.origin === "shared" ? "Shared root" : "False friend"}</span> : null}
            {c.detail ? <div class="note">{T(c.detail)}</div> : null}
          </div>
        ) : null}
        {canKnow ? <KnowBtn onClick={know} /> : null}
      </div>
    </>
  );
}
