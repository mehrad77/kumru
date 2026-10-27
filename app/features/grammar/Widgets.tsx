// The interactive grammar boxes of the lessons (`{t:"widget", w:"<name>", o:{…}}` blocks, data/grammar): vowel harmony, building a
// noun, the five cases, conjugating a verb, the clock, "where is the cat?" and the quiz. The Turkish forms come from the
// morphology engine (app/lib/morphology.ts), the rest of the logic is model/widgets.ts.
import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { bidiTxt } from "../../core/i18n.ts";
import { LEVELS, levelRank } from "../../lib/units.ts";
import { CASES, NOUNS, OWNERS, PERS, TENSES, VERBS, buildNoun, buildVerb, joinParts, nounEn, nounFa, noVerbForm, verbEn, verbFa } from "../../lib/morphology.ts";
import { bumpDay, recordEx } from "../progress/index.ts";
import { currentLessonId } from "./lesson.ts";
import { CASE_ICONS, CASE_KEYS, CASE_LABELS, HARMONY_CELLS, PLACES, clockTime, harmony, placeLabel } from "./model/widgets.ts";
import { playable, quizParts, rightIndex } from "./model/morph.ts";
import { Fa, Lab, MEl, Morph, OutBlock } from "./Text.tsx";

type Opts = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- a block's `o` is free JSON, checked by tools/grammar_lessons.py

const Sel = ({ opts, value, onChange }: { opts: [string | number, string][]; value: string | number; onChange: (v: string) => void }) => (
  <select value={value} onChange={(e) => onChange((e.currentTarget as HTMLSelectElement).value)}>{opts.map(([v, t]) => <option value={v}>{t}</option>)}</select>
);
const NOUN_OPTS: [number, string][] = NOUNS.map((x, i) => [i, x.tr + " · " + x.en]);

export function Harmony() {
  const [w, setW] = useState("kitap");
  const h = harmony(w);
  const on = h ? h.cell : "";
  const cell = (k: string, v: string, s: string) => <div class={"c" + (on === k ? " on" : "")}>{v}<span>{s}</span></div>;
  return (
    <div class="widget">
      <div class="w-title">Try it: type any word</div>
      <div class="w-grid2">
        <div>
          <Lab t="Word"><input value={w} maxLength={30} autoComplete="off" spellcheck={false} aria-label="Type a Turkish word" onInput={(e) => setW((e.currentTarget as HTMLInputElement).value)} /></Lab>
          <div class="w-rows">
            {h ? (
              <>
                <div class="hint">Last vowel: <div class="w-word">{h.before}<span class="vw">{h.vowel}</span>{h.after}</div></div>
                {h.rows.map((r) => <div class="w-row"><span class="k">{r.k}</span><MEl tag="span" s={r.m} cls="w-word" /></div>)}
              </>
            ) : <div class="hint">Type a Turkish word with at least one vowel.</div>}
          </div>
        </div>
        <div class="vgrid">
          <div />
          <div class="h">Unrounded</div><div class="h">Rounded</div>
          <div class="h">Back</div>{cell(HARMONY_CELLS[0][0], HARMONY_CELLS[0][1], HARMONY_CELLS[0][2])}{cell(HARMONY_CELLS[1][0], HARMONY_CELLS[1][1], HARMONY_CELLS[1][2])}
          <div class="h">Front</div>{cell(HARMONY_CELLS[2][0], HARMONY_CELLS[2][1], HARMONY_CELLS[2][2])}{cell(HARMONY_CELLS[3][0], HARMONY_CELLS[3][1], HARMONY_CELLS[3][2])}
        </div>
      </div>
    </div>
  );
}

export function NounBox() {
  const [n, setN] = useState("1"), [pl, setPl] = useState("0"), [o, setO] = useState("1sg"), [c, setC] = useState("loc");
  const N = NOUNS[+n], P = pl === "1";
  return (
    <div class="widget">
      <div class="w-title">Build a word: stem + plural + owner + case</div>
      <div class="w-ctl">
        <Lab t="Noun"><Sel opts={NOUN_OPTS} value={n} onChange={setN} /></Lab>
        <Lab t="Number"><Sel opts={[["0", "singular"], ["1", "plural -lAr"]]} value={pl} onChange={setPl} /></Lab>
        <Lab t="Owner"><Sel opts={OWNERS} value={o} onChange={setO} /></Lab>
        <Lab t="Case"><Sel opts={CASES} value={c} onChange={setC} /></Lab>
      </div>
      <div><OutBlock word={joinParts(buildNoun(N, P, o, c))} fa={nounFa(N, P, o, c)} en={nounEn(N, P, o, c)} /></div>
      <div class="hint">The order never changes: stem → plural → possessive → case.</div>
    </div>
  );
}

export function CasesBox({ o }: { o: Opts }) {
  const [n, setN] = useState("0"), [my, setMy] = useState(false);
  const N = NOUNS[+n], own = my ? "1sg" : "";
  return (
    <div class="widget">
      <div class="w-title">The five cases</div>
      <div class="w-ctl">
        <Lab t="Noun"><Sel opts={NOUN_OPTS} value={n} onChange={setN} /></Lab>
        <label class="wl chk"><input type="checkbox" checked={my} onChange={(e) => setMy((e.currentTarget as HTMLInputElement).checked)} /><span>with “my” (-im)</span></label>
      </div>
      <div class="case-grid">
        {CASE_KEYS.map((k) => (
          <div class={"case-card" + (o && o.focus === k ? " focus" : "")}>
            <div class="ic" dangerouslySetInnerHTML={{ __html: CASE_ICONS[k] }} />
            <div class="k">{bidiTxt(CASE_LABELS[k][0] + " · " + CASE_LABELS[k][1])}</div>
            <MEl s={joinParts(buildNoun(N, false, own, k))} cls="w-word" />
            <Fa t={nounFa(N, false, own, k)} cls="w-fa" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function VerbBox({ o }: { o: Opts }) {
  const lim = levelRank(LEVELS.includes(o.lv) ? o.lv : "B1");
  const T = TENSES.filter((x) => levelRank(x[2]) <= lim || x[0] === o.tense);
  const [v, setV] = useState("0");
  const [t, setT] = useState<string>(T.some((x) => x[0] === o.tense) ? o.tense : T[0][0]);
  const [p, setP] = useState<string>(PERS.some((x) => x[0] === o.person) ? o.person : "1sg");
  const [f, setF] = useState<string>(["pos", "neg", "q"].includes(o.form) ? o.form : "pos");
  const V = VERBS[+v];
  const ps = buildVerb(V, t, p, f);
  return (
    <div class="widget">
      <div class="w-title">Conjugate a verb</div>
      <div class="w-ctl">
        <Lab t="Verb"><Sel opts={VERBS.map((x, i): [number, string] => [i, x.inf + " · " + x.en[0]])} value={v} onChange={setV} /></Lab>
        <Lab t="Tense"><Sel opts={T.map((x): [string, string] => [x[0], x[1]])} value={t} onChange={setT} /></Lab>
        <Lab t="Person"><Sel opts={PERS} value={p} onChange={setP} /></Lab>
        <Lab t="Form">
          <select value={f} onChange={(e) => setF((e.currentTarget as HTMLSelectElement).value)}>
            <option value="pos">positive</option><option value="neg">negative</option><option value="q" disabled={noVerbForm(t, p, "q")}>question</option>
          </select>
        </Lab>
      </div>
      <div>
        {ps ? <OutBlock word={joinParts([[PERS.find((x) => x[0] === p)![1] + " ", "stem"], ...ps])} fa={verbFa(V, t, p, f)} en={verbEn(V, t, p, f)} />
          : <div class="hint">{t === "sart" ? "The şart (if) form has no question form: choose positive or negative." : "Not used: the question form only goes with ben, o, biz and onlar (geleyim mi? gelsin mi? gelelim mi?)."}</div>}
      </div>
    </div>
  );
}

export function ClockBox() {
  const [t, setT] = useState(39);
  const c = clockTime(t);
  const ticks = Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return <line x1={60 + 46 * Math.sin(a)} y1={60 - 46 * Math.cos(a)} x2={60 + 52 * Math.sin(a)} y2={60 - 52 * Math.cos(a)} class="tick" />; });
  return (
    <div class="widget">
      <div class="w-title">Drag to set the time</div>
      <div class="w-grid2 clock-wrap">
        <svg viewBox="0 0 120 120" class="clock" aria-hidden="true">
          <circle cx="60" cy="60" r="54" class="face" />{ticks}
          <line x1="60" y1="60" x2="60" y2="32" class="hand h" transform={`rotate(${c.hourAngle} 60 60)`} />
          <line x1="60" y1="60" x2="60" y2="16" class="hand m" transform={`rotate(${c.minuteAngle} 60 60)`} />
          <circle cx="60" cy="60" r="3" class="pin" />
        </svg>
        <div>
          <div class="w-rows">
            <div class="w-row"><span class="k">{c.clock}</span><MEl tag="span" s={c.say} cls="w-word" /></div>
            <div class="w-row"><span class="k">at</span><MEl tag="span" s={c.at} cls="w-word" /></div>
            <Fa t={c.fa} cls="w-fa" />
          </div>
          <Lab t="Time"><input type="range" min="0" max="143" step="1" value={t} aria-label="Time" onInput={(e) => setT(+(e.currentTarget as HTMLInputElement).value)} /></Lab>
        </div>
      </div>
    </div>
  );
}

const cat = (x: number, y: number, s: number) => `<g class="cat" transform="translate(${x} ${y}) scale(${s})"><path d="M-22 0c0-16 8-26 22-26s22 10 22 26z"/><circle cx="-10" cy="-32" r="11"/><path d="M-19-38l2-12 7 7zM-1-38l-2-12-7 7z"/><path d="M20-6c10-2 14-12 10-20" fill="none" stroke-width="5" stroke-linecap="round" class="tail"/></g>`;
const TABLE = '<g class="tbl"><rect x="70" y="90" width="180" height="10" rx="2"/><rect x="82" y="100" width="8" height="70"/><rect x="230" y="100" width="8" height="70"/></g>';

export function PlaceBox() {
  const [cur, setCur] = useState(0);
  const [, en, tr, fa, [x, y, s]] = PLACES[cur];
  const inner = '<line x1="10" y1="172" x2="310" y2="172" class="floor"/>' + (cur === 4 ? cat(x, y, s) + TABLE : TABLE + cat(x, y, s));
  return (
    <div class="widget">
      <div class="w-title">Where is the cat?</div>
      <div class="seg">{PLACES.map((p, i) => <button type="button" aria-pressed={i === cur ? "true" : "false"} onClick={() => setCur(i)}>{placeLabel(p[0])}</button>)}</div>
      <div class="w-grid2">
        <svg viewBox="0 0 320 205" class="place" role="img" aria-label="A cat and a table" dangerouslySetInnerHTML={{ __html: inner }} />
        <div class="w-rows"><MEl s={tr} cls="w-word" /><Fa t={fa} cls="w-fa" /><div class="w-en">{"The cat is " + en + " the table."}</div></div>
      </div>
    </div>
  );
}

/** A quiz sentence with its ___ gap, empty or filled with the answer. */
export function QuizLine({ q, fill }: { q: string; fill: string | null }) {
  const parts = quizParts(q);
  return (
    <div class="qz-q w-word" lang="tr">
      {parts.map((pt, j) => (
        <>
          {pt ? <Morph s={pt} /> : null}
          {j < parts.length - 1 ? <span class={"qz-gap" + (fill != null ? " filled" : "")}>{fill != null ? <Morph s={fill} /> : "___"}</span> : null}
        </>
      ))}
    </div>
  );
}

export function QuizBox({ o }: { o: Opts }) {
  const items = playable(o.items);
  const [i, setI] = useState(0), [right, setRight] = useState(0), [pick, setPick] = useState<number | null>(null), [end, setEnd] = useState(false);
  if (!items.length) return <div class="hint">No quiz items.</div>;
  if (end) {
    return (
      <div class="widget quiz">
        <div class="qz-top"><span class="w-title">Check yourself</span></div>
        <div class="qz-score">{right + " / " + items.length}</div>
        <div class="hint">{right === items.length ? "All correct." : "Read the rule again, then try once more."}</div>
        <div><button class="btn sm" type="button" onClick={() => { setI(0); setRight(0); setPick(null); setEnd(false); }}>Try again</button></div>
      </div>
    );
  }
  const it = items[i], a = rightIndex(it), done = pick != null, ok = pick === a;
  const answer = (j: number) => {
    if (done) return;
    setPick(j);
    if (j === a) setRight(right + 1);
    bumpDay();
    recordEx("quiz", j === a, currentLessonId() || undefined);
  };
  const next = () => { if (i < items.length - 1) { setI(i + 1); setPick(null); } else setEnd(true); };
  return (
    <div class="widget quiz">
      <div class="qz-top"><span class="w-title">Check yourself</span><span class="hint">{(i + 1) + " / " + items.length}</span></div>
      <QuizLine q={it.q} fill={done ? it.opts[a] : null} />
      <div class="qz-opts" data-done={done ? "1" : undefined}>
        {it.opts.map((op, j) => (
          <button class={"choice qz-opt" + (done ? (j === a ? " right" : j === pick ? " wrong" : "") : "")} type="button" lang="tr" disabled={done} onClick={() => answer(j)}><Morph s={op} /></button>
        ))}
      </div>
      <div class="qz-fb">
        {done ? (
          <>
            <div class={"qz-res " + (ok ? "ok" : "bad")}>{ok ? "Correct" : "Not quite"}</div>
            {it.why ? <MEl s={it.why} cls="hint" /> : null}
            {it.fa ? <Fa t={it.fa} cls="w-fa" /> : null}
            {it.en ? <div class="w-en">{bidiTxt(it.en)}</div> : null}
            <div><button class="btn sm primary" type="button" onClick={next}>{i < items.length - 1 ? "Next" : "See score"}</button></div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/** The widget names a lesson block can ask for. */
export const WIDGETS: Record<string, (o: Opts) => JSX.Element> = {
  harmony: () => <Harmony />, noun: () => <NounBox />, cases: (o) => <CasesBox o={o} />, verb: (o) => <VerbBox o={o} />,
  clock: () => <ClockBox />, quiz: (o) => <QuizBox o={o} />, place: () => <PlaceBox />,
};
