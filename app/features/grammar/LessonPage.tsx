// The lesson page: a focused full-screen reader over whatever the learner was doing. A top bar (back, where the lesson sits in
// its unit, n / total), the lesson (title, blocks, examples, the thing to remember, "Try it") and a foot with "Mark as learned",
// "Drill this" and the neighbouring lessons.
import { useCallback, useEffect } from "preact/hooks";
import { ICON } from "../../core/dom.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { S } from "../../core/store.ts";
import { refUnit, unitTitle } from "../../lib/units.ts";
import { BuiltNode } from "../../ui/island.tsx";
import { SpeakBtn } from "../../ui/Speak.tsx";
import { drillTally, lessonDrillStart, lessonDrillTypes, startDrill } from "../drills/index.ts";
import { rev } from "../progress/index.ts";
import { tryItBox } from "../tutor/index.ts";
import { Block } from "./Block.tsx";
import { closeLesson, lessonById, lessonId, lessons, openLesson, toggleLearned } from "./lesson.ts";
import { Fa, MEl } from "./Text.tsx";
import "./grammar.css";

/** How the lesson's drills are going. */
function DrillTag({ id }: { id: string }) {
  const types = lessonDrillTypes(id);
  if (!types.length) return null;
  const t = drillTally(types, S.drill);
  if (!t) return <span class="pchip new">Drill: not tried</span>;
  return <span class={"pchip " + (t.acc < 60 ? "bad" : t.acc < 80 ? "mid" : "ok")}>{"Drill " + t.n + "× · " + t.acc + "%"}</span>;
}

function TryIt({ d }: { d: { id: string } }) {
  const build = useCallback(() => tryItBox(d as never), [d]);
  return <BuiltNode contents render={build} />;
}

export function LessonPage({ host }: { host: HTMLElement }) {
  void rev.value; // progress changed in place (learned, drills)
  const id = lessonId.value;
  const d = id ? lessonById(id) : undefined;
  useEffect(() => { host.scrollTop = 0; }, [id, host]);
  useEffect(() => { if (d) host.setAttribute("aria-label", "Lesson " + d.order + ": " + d.title); }, [d, host]);
  if (!d) return null;
  const L = lessons(), idx = L.indexOf(d), prev = L[idx - 1], next = L[idx + 1];
  const done = !!S.learned[d.id];
  const secAll = L.filter((x) => x.ref === d.ref);
  const r = refUnit(d);
  const crumb = r ? r.lv + " · " + (unitTitle(r.lv, r.u) || "Unit " + r.u) : (d.level || "A1") + " · " + (d.section || "");
  const drillK = lessonDrillStart(d.id);
  const toggle = () => toggleLearned(d.id);
  return (
    <>
      <div class="lp-bar">
        <button class="lp-back" type="button" aria-label="Back" onClick={() => closeLesson()} dangerouslySetInnerHTML={{ __html: ICON.back }} />
        <div class="lp-crumb"><span>{bidiTxt(crumb)}</span><div class="lp-seg">{secAll.map((x) => <i class={(S.learned[x.id] ? "on" : "") + (x === d ? " cur" : "")} />)}</div></div>
        <span class="lp-count">{(idx + 1) + " / " + L.length}</span>
      </div>
      <article class="lp-wrap">
        <header class="lp-head">
          <div class="lp-num"><span>Lesson</span><b>{String(d.order)}</b></div>
          <div class="lp-titles">
            <div class="lp-tags"><span class="lvl">{d.level || "A1"}</span>{done ? <span class="pchip ok">Learned</span> : null}<DrillTag id={d.id} /></div>
            <h1><MEl tag="span" s={d.title} /></h1>
            <p class="lp-en">{bidiTxt(d.en)}</p>
            <Fa tag="p" t={d.fa} cls="lp-fa" />
          </div>
        </header>
        <div class="lp-body">
          {(d.blocks || []).map((b: { t: string }) => <Block b={b} />)}
          {d.ex && d.ex.length ? (
            <div class="ex-list">
              <div class="lbl">Examples</div>
              {d.ex.map(([tr, fa, en]: string[]) => (
                <div class="exi">
                  <div class="i-top"><span class="w-word" lang="tr">{tr}</span><SpeakBtn text={tr} /></div>
                  <Fa t={fa} cls="w-fa" /><div class="w-en">{bidiTxt(en)}</div>
                </div>
              ))}
            </div>
          ) : null}
          {d.tip ? <div class="tip mem"><div class="lbl">Remember</div><div>{bidiTxt(d.tip.en)}</div>{d.tip.fa ? <Fa t={d.tip.fa} /> : null}</div> : null}
          <TryIt key={d.id} d={d} />
        </div>
      </article>
      <footer class="lp-foot">
        <button class={"btn" + (done ? "" : " primary")} type="button" onClick={toggle}>{done ? "Mark as not learned" : "Mark as learned"}</button>
        {drillK != null && !S.session ? <button class="btn" type="button" onClick={() => { closeLesson(); startDrill(drillK); }}>Drill this</button> : null}
        <div class="lp-nav">
          {prev ? <button class="btn ghost" type="button" aria-label="Previous lesson" onClick={() => openLesson(prev.id)}>{"‹ " + prev.order}</button> : null}
          {next ? <button class="btn ghost" type="button" aria-label="Next lesson" onClick={() => openLesson(next.id)}>{next.order + " ›"}</button> : null}
        </div>
      </footer>
    </>
  );
}
