// How a learner is doing on a card: the confidence dots and the tries and accuracy, or "Not practised yet".
import { S } from "../../core/store.ts";
import { cardGood, cardTries } from "../../lib/progress.ts";
import { confDots, confOf } from "../progress/index.ts";

export function PracticeChip({ id }: { id: string }) {
  const s = S.stats[id], t = cardTries(s), lvl = confDots(id);
  if (!t) return <span class="pchip new">Not practised yet</span>;
  const acc = Math.round(cardGood(s) / t * 100);
  return (
    <span class={"pchip " + (acc < 60 ? "bad" : acc < 80 ? "mid" : "ok")}
      title={`Confidence ${confOf(id)} of 15 · Again ${s.a || 0} · Good ${s.g || 0} · Easy ${s.e || 0} · Right ${s.r || 0} · Wrong ${s.w || 0}`}>
      <span class="dots" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <span class={i < lvl ? "on" : ""} />)}</span>
      {t + (t === 1 ? " try · " : " tries · ") + acc + "%"}
    </span>
  );
}
