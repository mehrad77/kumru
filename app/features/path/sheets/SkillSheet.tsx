// A skill's sheet: continue it, practise its words, read its lessons, see its words.
import "../path.css";
import { S } from "../../../core/store.ts";
import { closeSheet } from "../../../ui/sheet.ts";
import { openLesson } from "../../grammar/index.ts";
import { type Card, type FlowSec, type Lesson, startSkill } from "../course.ts";
import { LessonRow, WordRow } from "./WordRow.tsx";

export function SkillSheet({ x }: { x: FlowSec["skills"][number] }) {
  const { sk, parts, l, L } = x, cards = parts.flatMap((p) => (p.t === "words" ? p.ws : [])) as Card[];
  const lessons = parts.filter((p) => p.t === "lesson").map((p) => (S.grammar as Lesson[]).find((d) => d.id === (p as { g: string }).g)).filter(Boolean) as Lesson[];
  const done = l >= L;
  return (
    <>
      <p class="hint" style="margin:0 4px">{sk.en}</p>
      <div class="us-body">
        {x.state === "placed" ? <p class="hint sk-note">You skipped this skill when you were placed or tested out. Its words are on your Catch up list. Learn it now if you like.</p> : null}
        <div class="us-sum"><span class="hint">{done ? "Done · all " + L + (L === 1 ? " part" : " parts") : l + " of " + L + (L === 1 ? " part" : " parts") + " done"}</span></div>
        <button class="btn primary block two" type="button" onClick={() => { closeSheet(); startSkill(x, done ? 0 : l); }}>
          <span>{done ? "Replay" : l ? "Continue" : "Start learning"}</span>
          <span class="b-sub">{done ? "Go through its lessons again" : l ? "Pick up at part " + (l + 1) + " of " + L : "Meet the words step by step, with short exercises"}</span>
        </button>
        {lessons.map((d) => <LessonRow key={d.id} d={d} onOpen={() => { closeSheet(); openLesson(d.id); }} />)}
        {cards.map((c) => <WordRow key={c.id} c={c} />)}
      </div>
    </>
  );
}
