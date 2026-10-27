// One word of a unit or skill, with how well the learner knows it.
import { faTxt } from "../../../core/i18n.ts";
import { S } from "../../../core/store.ts";
import { cardTries } from "../../../lib/progress.ts";
import { Icon } from "../../../ui/Icon.tsx";
import { SpeakBtn } from "../../../ui/Speak.tsx";
import { confBand, confDots, confOf, isKnown, isWeak } from "../../progress/index.ts";
import type { Card } from "../course.ts";

export function WordRow({ c }: { c: Card }) {
  const t = cardTries(S.stats[c.id]), lvl = confDots(c.id), weak = isWeak(c.id);
  return (
    <div class="us-w">
      <div class="us-w-main">
        <div class="i-top"><span class="tr" lang="tr">{c.tr}</span><SpeakBtn text={c.tr} /></div>
        {c.fa ? <div class="fa" lang="fa" dir="rtl">{faTxt(c.fa)}</div> : null}
        {c.en ? <div class="en">{c.en}</div> : null}
      </div>
      <span class={"us-w-dots" + (weak ? " weak" : "")} title={t ? "Confidence " + confOf(c.id) + " of 15" : "Not practised yet"}>
        <span class="dots" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <span class={i < lvl ? "on" : ""} />)}</span>
        <span class="hint">{weak && !isKnown(c) ? "weak" : confBand(c.id)}</span>
      </span>
    </div>
  );
}

/** A grammar lesson as a row that opens it. */
export function LessonRow({ d, onOpen }: { d: { id: string; title: string; en?: string; order?: number }; onOpen: () => void }) {
  const learned = !!S.learned[d.id];
  return (
    <button class={"us-l" + (learned ? " done" : "")} type="button" onClick={onOpen}>
      <span class="num">{learned ? "✓" : String(d.order)}</span>
      <span class="lt"><span class="ttl">{d.title}</span><span class="hint">{d.en}</span></span>
      <span class="state">{learned ? "Learned" : ""}</span>
      <Icon name="chev" class="go" />
    </button>
  );
}
