// Pieces the questions share: the kind line, a word's meaning, hinted words, the answer line of the feedback, a DOM node inside Preact.
import type { ComponentChildren, VNode } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { faTxt, bidiTxt } from "../../core/i18n.ts";
import { Icon } from "../../ui/Icon.tsx";
import { confBand } from "../progress/index.ts";
import { showGloss } from "../words/index.ts";
import { bothFor, cap, meaningIsFa, meaningText, wordGlossIdx } from "./cards.ts";
import { ConfMove } from "./ConfMove.tsx";
import { glossSegments, promptSegments } from "./model/gloss.ts";
import { takeMove, type Move } from "./move.ts";
import type { Card, Child, Step } from "./types.ts";
import { meaningLang } from "../../core/lang.ts";

/** A DOM node (built by a function that still returns one) shown inside a Preact tree, without a box of its own. */
export function DomNode({ node }: { node: Node }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => { ref.current?.replaceChildren(node); }, [node]);
  return <span ref={ref} style="display:contents" />;
}

/** A child of the feedback or of a card: Preact content or a node. */
export const Kid = ({ k }: { k: Child }) => (k instanceof Node ? <DomNode node={k} /> : <>{k as ComponentChildren}</>);

/** The small caps line over a question: "Multiple choice", prefixed by the step's label ("Review · …") and "Once more · " on a retry. */
export function QKind({ text, st }: { text: string; st?: Step }) {
  let t = text;
  if (st && st.label && !t.startsWith(st.label)) t = st.label + " · " + t;
  if (st && st.retry) t = "Once more · " + t;
  return <div class="q-kind">{t}</div>;
}

const gloss = (e: Event, word: string, h: { card?: Card; en?: string; note?: string }) => {
  e.stopPropagation();
  showGloss(e.currentTarget as HTMLElement, word, { fa: h.card ? h.card.fa : "", en: h.card ? h.card.en : h.en, note: h.note, card: h.card as never }, true);
};

/** A sentence as text with each known word dotted-underlined; tapping one opens its meaning (the stories' gloss popup, without the voice). */
export function HintedText({ tr, gloss: gl }: { tr: string; gloss?: Record<string, string> | null }) {
  return (
    <span lang="tr">
      {glossSegments(tr, wordGlossIdx(), gl).map((sg) => sg.hit
        ? <button class={"gw" + (sg.hit.card ? " known" : "")} type="button" data-gl="1" onClick={(e) => gloss(e, sg.text.replace(/[.,!?;:"«»]/g, ""), { card: sg.hit!.card as Card, en: sg.hit!.en, note: sg.hit!.note })}>{sg.text}</button>
        : sg.text)}
    </span>
  );
}

/** The prompt line of a build step (or a meaning) with its hinted words dotted-underlined; tapping one shows the Turkish word it stands for. */
export function HintedPrompt({ prompt, tr, gloss: gl, lang }: { prompt: string; tr: string; gloss?: Record<string, string> | null; lang: string }) {
  return (
    <span>
      {promptSegments(prompt, tr, wordGlossIdx(), gl, lang).map((sg) => sg.hit
        ? <button class={"gw" + (sg.hit.card ? " known" : "")} type="button" data-gl="1" onClick={(e) => gloss(e, sg.hit.word, sg.hit)}>{sg.text}</button>
        : sg.text)}
    </span>
  );
}

/** A card's meaning. A word the learner doesn't know yet shows both languages. In the skill tree's own steps (`hint`) the words are hinted: tap one to see the Turkish word it stands for. */
export function Meaning({ c, big, hint }: { c: Card; big?: boolean; hint?: boolean }) {
  const cls = big ? "q-word" : "q-sub";
  const lines: { text: string; fa: boolean; cls: string }[] = bothFor(c) && c.fa && c.en
    ? (meaningLang() === "en" ? [{ text: c.en, fa: false, cls }, { text: c.fa, fa: true, cls: "q-sub" }] : [{ text: c.fa, fa: true, cls }, { text: c.en, fa: false, cls: "q-sub" }])
    : [{ text: meaningText(c), fa: meaningIsFa(c), cls }];
  return (
    <div class="q-mean">
      {lines.map((l) => (
        <div class={l.cls} lang={l.fa ? "fa" : undefined} dir={l.fa ? "rtl" : undefined}>
          {hint ? <HintedPrompt prompt={l.text} tr={c.tr} gloss={c.gloss} lang={l.fa ? "fa" : "en"} /> : l.fa ? faTxt(l.text) : bidiTxt(l.text)}
        </div>
      ))}
    </div>
  );
}

/** The Turkish word of a card with its meanings and, when the answer moved the word's confidence, the change. Read the move once: call this right after the answer was recorded. */
export function ansLine(c: Card): VNode {
  return <AnsLine c={c} mv={takeMove(c.id)} />;
}

export function AnsLine({ c, mv }: { c: Card; mv: Move | null }) {
  const en = c.en ? <div class="hint">{bidiTxt(c.en)}</div> : null;
  return (
    <div class="ansline">
      <div class="w-word" lang="tr">{c.tr}</div>
      {c.fa ? <div class="w-fa" lang="fa" dir="rtl">{faTxt(c.fa)}</div> : null}
      {mv ? <div class="ans-row">{en}<ConfMove mv={mv} /></div> : en}
    </div>
  );
}

/** "I already know this", the outlined button under a new word or a flashcard. */
export const KnowBtn = ({ onClick }: { onClick: () => void }) => (
  <button class="btn know-btn" type="button" onClick={onClick}><Icon name="check" class="bi" />I already know this</button>
);

/** The confidence label of a card for the flashcard: "Learning · Food". */
export const confLabel = (c: Card): string => cap(confBand(c.id)) + (c.topic ? " · " + c.topic : "");
