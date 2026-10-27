// The Review sheet: how long (5, 10 or 15 minutes), then what to practise: weak spots, a suffix drill, the next new words, catch-up,
// the units' word lists, a quick multiple-choice review, the tutor's saved fixes.
import "../path.css";
import { useState } from "preact/hooks";
import type { IconName } from "../../../core/dom.ts";
import { local } from "../../../core/local.ts";
import { S } from "../../../core/store.ts";
import { cardTries } from "../../../lib/progress.ts";
import { Icon } from "../../../ui/Icon.tsx";
import { closeSheet } from "../../../ui/sheet.ts";
import { openDrillSheet } from "../../drills/index.ts";
import { catchUpWords, newWordBatch, startCustom } from "../../practice/index.ts";
import { rev } from "../../progress/index.ts";
import { mistakes, startMistakes } from "../../tutor/index.ts";
import { type Card, useTree, weakPool } from "../course.ts";
import { openBookSheet } from "../sheets.ts";

interface Row { icon: IconName; c: string; t: string; s: string; dis?: boolean; fn: (mins: number) => void }

export function ReviewSheet() {
  void rev.value;
  const [mins, setMins] = useState(() => { const m = +local.get("reviewMin", "10"); return [5, 10, 15].includes(m) ? m : 10; });
  const weak = weakPool(), mN = mistakes().length, nw = newWordBatch(12).words, cu = catchUpWords(), seen = ([...S.cards.values()] as Card[]).filter((c) => c.kind === "word" && cardTries(S.stats[c.id]));
  const rows: (Row | null)[] = [
    { icon: "target", c: "var(--bad)", t: "Weak spots", s: weak.length ? weak.length + " words to fix" : "Nothing weak right now", dis: !weak.length, fn: (m) => startCustom(m, { kind: "smart", pool: weak, title: "Weak spots", label: "Weak spots" }) },
    { icon: "drill", c: "var(--m-poss)", t: "Suffix drill", s: "Pick an ending, or mix them all", fn: (m) => openDrillSheet(m) },
    { icon: "flash", c: "var(--accent)", t: "New words", s: nw.length ? "Next up: " + (newWordBatch(12).label || "vocabulary") : "You've met every word", dis: !nw.length, fn: (m) => startCustom(m, { kind: "flash", pool: nw, title: "New words", label: "New words" }) },
    cu.length ? { icon: "flash", c: "var(--sage-d,var(--accent))", t: "Catch up", s: cu.length + (useTree() ? " words from skills you skipped" : " words from units you were placed past"), fn: (m) => startCustom(m, { kind: "flash", pool: newWordBatch(12, null, cu).words, title: "Catch up", label: "Catch up" }) } : null,
    useTree() ? { icon: "book", c: "var(--sage-d,var(--accent))", t: "Unit words", s: "Every unit's list, for class", fn: () => openBookSheet() } : null,
    { icon: "choice", c: "var(--m-pl)", t: "Quick review", s: seen.length ? "Multiple choice on words you've seen" : "Meet some words first", dis: seen.length < 4, fn: (m) => startCustom(m, { kind: "choice", pool: seen, title: "Quick review", label: "Quick review" }) },
    { icon: "note", c: "var(--m-q)", t: "Fix my mistakes", s: mN ? mN + (mN === 1 ? " saved fix" : " saved fixes") + " to practise" : "Fixes from the tutor show up here", dis: !mN, fn: (m) => startMistakes(m) },
  ];
  const go = (fn: Row["fn"]) => () => { local.set("reviewMin", String(mins)); closeSheet(); fn(mins); };
  return (
    <>
      <span class="lbl">How long?</span>
      <div class="seg" role="radiogroup" aria-label="Minutes">
        {[5, 10, 15].map((m) => <button type="button" role="radio" aria-checked={m === mins} aria-pressed={m === mins} onClick={() => setMins(m)}>{m + " min"}</button>)}
      </div>
      <div class="rv-opts">
        {rows.filter((r): r is Row => !!r).map((r) => (
          <button class="rv-o" type="button" style={"--c:" + r.c} disabled={r.dis || undefined} onClick={go(r.fn)}>
            <Icon name={r.icon} class="ico" />
            <span class="rv-t"><b>{r.t}</b><span class="hint">{r.s}</span></span>
            <Icon name="chev" class="go" />
          </button>
        ))}
      </div>
    </>
  );
}
