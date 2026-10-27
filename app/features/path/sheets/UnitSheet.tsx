// A unit's sheet: its words (the main book's first, then the workbook's) and its lessons.
import "../path.css";
import { useState } from "preact/hooks";
import { unitLabel } from "../../../lib/units.ts";
import { closeSheet } from "../../../ui/sheet.ts";
import { openLesson } from "../../grammar/index.ts";
import { rev, isKnown } from "../../progress/index.ts";
import { startCustom, topicRank } from "../../practice/index.ts";
import { type Card, coreWords, unitLessons, unitWords } from "../course.ts";
import { LessonRow, WordRow } from "./WordRow.tsx";

export function UnitSheet({ lv, u }: { lv: string; u: number }) {
  void rev.value;
  const [tab, setTab] = useState<"words" | "lessons">("words"), [limit, setLimit] = useState(60);
  let body;
  if (tab === "words") {
    const core = coreWords(lv, u), coreSet = new Set(core.map((c) => c.id)), rest = unitWords(lv, u).filter((c) => !coreSet.has(c.id));
    const list: Card[] = [...core.sort((a, b) => topicRank(a.topic) - topicRank(b.topic) || a.tr.localeCompare(b.tr, "tr")), ...rest.sort((a, b) => a.tr.localeCompare(b.tr, "tr"))];
    if (!list.length) body = <p class="empty">No words in this unit yet.</p>;
    else {
      const kn = list.filter(isKnown).length;
      body = (
        <>
          <div class="us-sum">
            <span class="hint">{kn + " of " + list.length + " known" + (core.length && rest.length ? " · " + core.length + " from the book, then " + rest.length + " from the workbook" : "")}</span>
            <button class="btn sm primary" type="button" onClick={() => { closeSheet(); startCustom(10, { kind: "smart", pool: list, title: lv + " " + unitLabel(lv, u), label: "Unit " + u }); }}>Practise these</button>
          </div>
          {list.slice(0, limit).map((c) => <WordRow key={c.id} c={c} />)}
          {list.length > limit ? <button class="btn block" type="button" onClick={() => setLimit(limit + 100)}>{"Show more (" + (list.length - limit) + " left)"}</button> : null}
        </>
      );
    }
  } else {
    const L = unitLessons(lv, u);
    body = L.length ? L.map((d) => <LessonRow key={d.id} d={d} onOpen={() => { closeSheet(); openLesson(d.id); }} />) : <p class="empty">No lessons in this unit.</p>;
  }
  return (
    <>
      <div class="seg">
        {([["words", "Words"], ["lessons", "Lessons"]] as const).map(([k, t]) => <button type="button" aria-pressed={tab === k} onClick={() => { setTab(k); setLimit(60); }}>{t}</button>)}
      </div>
      <div class="us-body">{body}</div>
    </>
  );
}
