// The Lab tab: Kerim's bench, then a card per way to practise (flashcard decks, the question-type gym, Prove it, the verb gym, the
// listening lab) and two blurred "coming soon" cards. Practice here moves word confidence only: no XP, no streak day, never the
// path position (inLab in the progress feature; rules in docs/PROGRESS.md).
import "./lab.css";
import { useEffect, useMemo, useState } from "preact/hooks";
import type { IconName } from "../../core/dom.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { redrawTick, signals } from "../../core/store.ts";
import { Icon } from "../../ui/Icon.tsx";
import { BuiltNode } from "../../ui/island.tsx";
import { bubble, setMood } from "../../ui/kerim/kerim.ts";
import { reduceMotion } from "../../ui/motion.ts";
import { hasVoice, onVoicesChanged } from "../../ui/speech.ts";
import { LAB_SCENE, labKerim } from "./art.ts";
import { openLabDecks, openLabGym, openLabListen, openLabProve, openLabVerbs } from "./sheets.ts";
import { claimedNow } from "./sources.ts";

interface Item { id: string; icon: IconName; c: string; tr: string; t: string; s: string; tags: () => string[]; off?: () => boolean; offSub?: string; go: () => void }

/** What the Lab offers; `go` opens each one's sheet. */
const ITEMS: Item[] = [
  { id: "decks", icon: "flash", c: "var(--accent)", tr: "Kartlar", t: "Flashcard decks", s: "Pick a deck, then flip", tags: () => ["decks", "5–15 min"], go: openLabDecks },
  { id: "gym", icon: "target", c: "var(--m-pl)", tr: "Spor salonu", t: "Question-type gym", s: "One kind of question, as long as you like", tags: () => ["7 types", "any deck"], go: openLabGym },
  { id: "prove", icon: "check", c: "var(--m-case)", tr: "Kanıtla", t: "Prove it", s: "Check the words you said you already know",
    tags: () => { const n = claimedNow().length; return [n ? n + (n === 1 ? " claim" : " claims") + " waiting" : "no claims yet"]; }, off: () => !claimedNow().length, go: openLabProve },
  { id: "verbs", icon: "drill", c: "var(--m-poss)", tr: "Fiil atölyesi", t: "Verb gym", s: "Verb endings, weakest first", tags: () => ["verbs"], go: openLabVerbs },
  { id: "listen", icon: "listen", c: "var(--m-pers)", tr: "Dinleme", t: "Listening lab", s: "Hear it, then type, pick or build", tags: () => ["audio"],
    off: () => !hasVoice(), offSub: "Needs a Turkish voice on this device", go: openLabListen },
];

const SOON: { icon: IconName; c: string; tr: string; t: string; s: string }[] = [
  { icon: "spark", c: "var(--m-tense)", tr: "Hız turu", t: "Speed round", s: "60 seconds, as many as you can" },
  { icon: "note", c: "var(--m-q)", tr: "Cümle atölyesi", t: "Sentence lab", s: "Fill the blank, pick the reply" },
];

const dom = (node: Node) => () => node;

/** The scene with Kerim on the bench; a tap on the pot bursts the bubbles and Kerim cheers. */
function Hero() {
  const kerim = useMemo(() => labKerim("think"), []);
  const say = useMemo(() => bubble("Bugün ne pişiriyoruz?", "امروز چی بپزیم؟", "sm"), []);
  const [burst, setBurst] = useState(false);
  const stir = () => {
    if (burst) return;
    setBurst(true);
    setMood(kerim, "cheer");
    setTimeout(() => setBurst(false), reduceMotion() ? 200 : 900);
  };
  const kerimNode = useMemo(() => dom(kerim), [kerim]), sayNode = useMemo(() => dom(say), [say]);
  return (
    <div class="lab-top">
      <div class={"lab-hero" + (burst ? " burst" : "")}>
        <div style="display:contents" dangerouslySetInnerHTML={{ __html: LAB_SCENE }} />
        <BuiltNode render={kerimNode} contents />
        <button class="lab-pot-hit" type="button" aria-label="Stir the pot" onClick={stir} />
      </div>
      <div class="lab-say"><BuiltNode render={sayNode} contents /></div>
    </div>
  );
}

function Soon({ it }: { it: (typeof SOON)[number] }) {
  return (
    <div class="lab-soon" aria-disabled="true">
      <div class="lab-soon-in">
        <Icon name={it.icon} class="ico" />
        <span class="rv-t"><b>{it.t}</b><span class="hint">{it.s}</span></span>
      </div>
      <span class="lab-chip"><b lang="tr">Yakında</b><span>Coming soon</span></span>
    </div>
  );
}

function Recipe({ it }: { it: Item }) {
  const tags = it.tags(), off = !!it.off?.();
  return (
    <button class="lab-recipe" type="button" style={"--c:" + it.c} disabled={off} onClick={it.go}>
      <Icon name={it.icon} class="ico" />
      <span class="rv-t">
        <span class="lab-tr" lang="tr">{it.tr}</span>
        <b>{it.t}</b>
        <span class="hint">{bidiTxt(off && it.offSub ? it.offSub : it.s)}</span>
        {tags.length ? <span class="lab-tags">{tags.map((x) => <i>{x}</i>)}</span> : null}
      </span>
      <Icon name="chev" class="go" />
    </button>
  );
}

export function LabTab() {
  void redrawTick.value; // a redraw (a session ended, progress changed) refreshes the claims count
  void signals.loaded.value;
  const [, setVoice] = useState(0);
  useEffect(() => { onVoicesChanged(() => setVoice((n) => n + 1)); }, []); // voices load late: the listening lab follows
  return (
    <div class="lab-page">
      <Hero />
      <div class="lab-head">
        <span class="lab-badge">Experimental</span>
        <h2>Kerim's Lab</h2>
        <p class="hint">New ways to practise, cooked up here before they reach the Path. Practice here changes how well you know a word, but earns no XP and doesn't touch your streak.</p>
      </div>
      <div class="lab-list lab-soons">{SOON.map((it) => <Soon it={it} />)}</div>
      <div class="lab-list">{ITEMS.map((it) => <Recipe it={it} />)}</div>
    </div>
  );
}
