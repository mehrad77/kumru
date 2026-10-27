// The small pieces of a correction, as Preact: the explanation in the learner's language, the word diff, the link to the lesson.
// `notes.ts` offers the same pieces as DOM nodes for the DOM-built practice screens.
import { bidiTxt, faTxt } from "../../core/i18n.ts";
import { lessonOrder, lessonTitle, openLesson } from "../grammar/index.ts";
import type { DiffPart } from "./model/diff.ts";
import type { Mistake } from "./model/mistakes.ts";
import { meaningLang } from "../../core/lang.ts";

/** The explanation in the learner's preferred language (Persian, English or both). */
export function Explain({ fa, en, cls }: { fa?: string; en?: string; cls?: string }) {
  const L = meaningLang();
  return (
    <div class={cls || "ai-expl"}>
      {(L === "fa" || L === "both") && fa ? <div class="fa" lang="fa" dir="rtl">{faTxt(fa)}</div> : null}
      {(L === "en" || L === "both" || !fa) && en ? <div class="en">{bidiTxt(en)}</div> : null}
    </div>
  );
}

/** A sentence with the words that changed marked: struck out (`del`) or added (`ins`). */
export function DiffLine({ parts, mark }: { parts: DiffPart[]; mark: "del" | "ins" }) {
  const Tag = mark;
  return (
    <span class="dline" lang="tr">
      {parts.map(([w, k], x) => <>{x ? " " : null}{k ? <Tag class={k < 0 ? "d-del" : "d-ins"}>{bidiTxt(w)}</Tag> : bidiTxt(w)}</>)}
    </span>
  );
}

/** "Lesson 12: Title ›", opening that lesson. */
export const LessonLink = ({ id }: { id: string }) => (
  <button class="linkish" type="button" onClick={() => openLesson(id)}>{bidiTxt("Lesson " + lessonOrder(id) + ": " + lessonTitle(id) + " ›")}</button>
);

/** What a saved fix says: its explanation and the lesson it belongs to. */
export const FixNote = ({ m }: { m: Mistake }) => (
  <div><Explain fa={m.fa} en={m.en} />{m.lesson ? <LessonLink id={m.lesson} /> : null}</div>
);
