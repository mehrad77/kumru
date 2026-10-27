// Match pairs: tap a Turkish word, then its meaning.
import { useRef, useState } from "preact/hooks";
import { faTxt, bidiTxt } from "../../../core/i18n.ts";
import { speak } from "../../../ui/speech.ts";
import { bumpConf, recordCard, recordEx } from "../../progress/index.ts";
import { meaningIsFa, meaningText } from "../cards.ts";
import { QKind, ansLine } from "../common.tsx";
import { feedback, markMiss, requeue } from "../engine.ts";
import type { Prep } from "../prepare.ts";
import type { Card, Step } from "../types.ts";
import { useHint } from "./parts.tsx";

type Side = "L" | "R";

export function Match({ p, st }: { p: Extract<Prep, { type: "match" }>; st: Step }) {
  const { picks, left, right } = p;
  const [done, setDone] = useState<ReadonlySet<string>>(new Set());
  const [sel, setSel] = useState<{ side: Side; id: string } | null>(null);
  const [shake, setShake] = useState<ReadonlySet<string>>(new Set());
  const run = useRef({ left: left.length, mist: 0, bad: new Set<string>(), sel: null as { side: Side; c: Card } | null });
  useHint("Tap a Turkish word, then its meaning");

  const pick = (side: Side, c: Card) => {
    const r = run.current, key = side + c.id;
    if (done.has(c.id)) return;
    if (!r.sel || r.sel.side === side) {
      r.sel = { side, c };
      setSel({ side, id: c.id });
      if (side === "L") speak(c.tr);
      return;
    }
    const a = r.sel;
    r.sel = null;
    setSel(null);
    if (a.c.id === c.id) {
      setDone(new Set([...done, c.id]));
      r.left--;
      const slipped = r.bad.has(c.id);
      recordCard(c.id, slipped ? "w" : "r");
      bumpConf(c.id, slipped ? "slip" : "right");
      if (!r.left) {
        recordEx("match", r.mist === 0);
        const missed = picks.filter((x) => r.bad.has(x.id));
        missed.forEach((x) => requeue({ k: "choice", c: x, dir: "t", dpool: p.pool, pool: p.pool, label: p.label }));
        feedback(r.mist === 0, r.mist === 0 ? "All pairs matched" : "Matched with " + r.mist + (r.mist === 1 ? " mistake" : " mistakes"), ...missed.map(ansLine));
      }
    } else {
      r.mist++;
      const ids = [a.c.id, c.id];
      ids.forEach((i) => r.bad.add(i));
      picks.filter((x) => ids.includes(x.id)).forEach((x) => markMiss(x.tr, meaningText(x)));
      const keys = [a.side + a.c.id, key];
      setShake(new Set(keys));
      setTimeout(() => setShake((s) => new Set([...s].filter((k) => !keys.includes(k)))), 350);
    }
  };
  const cls = (side: Side, c: Card) => "tilebtn" + (sel && sel.side === side && sel.id === c.id ? " sel" : "") + (done.has(c.id) ? " done" : "") + (shake.has(side + c.id) ? " shake" : "");
  return (
    <>
      <QKind text="Match pairs" st={st} />
      <h2 class="q-title">Tap the pairs</h2>
      <div class="pairs">
        <div class="col">
          {left.map((c) => <button class={cls("L", c)} type="button" lang="tr" data-id={c.id} disabled={done.has(c.id)} onClick={() => pick("L", c)}>{bidiTxt(c.tr)}</button>)}
        </div>
        <div class="col">
          {right.map((c) => {
            const fa = meaningIsFa(c);
            return <button class={cls("R", c)} type="button" lang={fa ? "fa" : undefined} dir={fa ? "rtl" : undefined} data-id={c.id} disabled={done.has(c.id)} onClick={() => pick("R", c)}>{fa ? faTxt(meaningText(c)) : bidiTxt(meaningText(c))}</button>;
          })}
        </div>
      </div>
    </>
  );
}
