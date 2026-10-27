// The Lab's sheets (the bodies; sheets.ts opens them): the length picker every sheet shares, deck sources, the question-type gym,
// topics, the verb gym and the listening lab.
import { useState } from "preact/hooks";
import type { IconName } from "../../core/dom.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { EXTYPES } from "../practice/index.ts";
import { local } from "../../core/local.ts";
import { Icon } from "../../ui/Icon.tsx";
import { hasVoice } from "../../ui/speech.ts";
import { Lazy } from "../../ui/Lazy.tsx";
import { loadDrillGrid, myDrills } from "../drills/index.ts";
import { myLevel } from "../progress/index.ts";
import { DEFAULT_MIN, LAB_MIN, LAB_MINS, lenLabel, readLen } from "./model/decks.ts";
import { openLabDrill, openLabSources, openLabTopics } from "./sheets.ts";
import { labSentences, labSources, labStart, labTopics, topicSeen, verbStart } from "./sources.ts";

const storedLen = (): number => readLen(local.get("labMin", String(DEFAULT_MIN)));

/** "How long?": 5, 10, 15 minutes or no limit; the choice is remembered. */
function Length({ value, onPick }: { value: number; onPick: (v: number) => void }) {
  return (
    <div class="lab-len">
      <span class="lbl">How long?</span>
      <div class="seg" role="radiogroup" aria-label="How long?">
        {LAB_MINS.map((v) => (
          <button type="button" role="radio" aria-checked={v === value} aria-pressed={v === value} onClick={() => { local.set("labMin", String(v)); onPick(v); }}>{lenLabel(v)}</button>
        ))}
      </div>
    </div>
  );
}

/** A sheet's length state: the stored length, and the picker that changes it. */
function useLength() {
  const [m, setM] = useState(storedLen);
  return { m, picker: <Length value={m} onPick={setM} /> };
}

function Row({ icon, c, t, sub, disabled, onClick }: { icon: string; c: string; t: string; sub: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button class="rv-o" type="button" style={"--c:" + c} disabled={disabled} onClick={onClick}>
      <Icon name={icon as IconName} class="ico" />
      <span class="rv-t"><b>{bidiTxt(t)}</b><span class="hint">{bidiTxt(sub)}</span></span>
      <Icon name="chev" class="go" />
    </button>
  );
}

/** One row per place a question type can draw its words from. */
function SourceRows({ kind, m }: { kind: string; m: number }) {
  const min = LAB_MIN[kind] || 1;
  const [sources] = useState(labSources);
  return (
    <div class="rv-opts">
      {sources.map((x) => (
        <Row icon={x.icon} c={x.c} t={x.t} sub={x.sub} disabled={!x.topics && x.pool.length < min}
          onClick={() => (x.topics ? openLabTopics(kind, min) : labStart(m, kind, x))} />
      ))}
    </div>
  );
}

export function SourcesSheet({ kind }: { kind: string }) {
  const { m, picker } = useLength();
  return <>{picker}<SourceRows kind={kind} m={m} /></>;
}

export function DecksSheet() {
  const { m, picker } = useLength();
  return <>{picker}<SourceRows kind="flash" m={m} /></>;
}

export function TopicsSheet({ kind, min }: { kind: string; min: number }) {
  const { m, picker } = useLength();
  const [topics] = useState(labTopics);
  return (
    <>
      {picker}
      <div class="rv-opts">
        {topics.map(([t, l]) => (
          <Row icon="book" c="var(--m-tense)" t={t} sub={l.length + " words · " + topicSeen(l) + " met"} disabled={l.length < min} onClick={() => labStart(m, kind, { t, pool: l })} />
        ))}
      </div>
    </>
  );
}

export function GymSheet() {
  const { m, picker } = useLength();
  const [types] = useState(() => EXTYPES);
  return (
    <>
      <p class="hint">Pick one kind of question and practise it as long as you like.</p>
      {picker}
      <div class="rv-opts">
        {types.map((t) => {
          const off = !!t.tts && !hasVoice();
          return (
            <Row icon={t.k} c={t.c} t={t.name} sub={off ? "Needs a Turkish voice on this device" : t.desc} disabled={off}
              onClick={() => (t.k === "drill" ? openLabDrill(m) : t.k === "build" ? labStart(m, "build", labSentences()) : openLabSources(t.name, t.k))} />
          );
        })}
      </div>
    </>
  );
}

export function VerbsSheet() {
  const { m, picker } = useLength();
  const [drills] = useState(() => myDrills(myLevel()).filter((d) => d.verb));
  return (
    <>
      {picker}
      <button class="btn primary block" type="button" onClick={() => verbStart(m, "", null)}>Mixed verbs · weakest first</button>
      <span class="lbl">Verb endings</span>
      <Lazy load={loadDrillGrid} props={{ drills, onPick: (d) => verbStart(m, d.k, d.label) }} />
    </>
  );
}

export function ListenSheet() {
  const { m, picker } = useLength();
  return (
    <>
      <p class="hint">Hear it first. Then type it, pick its meaning or build the sentence.</p>
      {picker}
      <div class="rv-opts">
        <Row icon="listen" c="var(--m-pers)" t="Hear and type" sub="Type the word you hear" onClick={() => openLabSources("Hear and type", "listen")} />
        <Row icon="choice" c="var(--m-pl)" t="Hear and pick" sub="Pick what the word means" onClick={() => openLabSources("Hear and pick", "hearpick")} />
        <Row icon="build" c="var(--m-q)" t="Hear and build" sub="Tap the words of the sentence you hear" onClick={() => labStart(m, "hearbuild", labSentences())} />
      </div>
    </>
  );
}
