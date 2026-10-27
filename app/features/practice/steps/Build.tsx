// Build the sentence: tap the words into the right order, or drag them. Tiles slide (FLIP) between the bank and the line and
// when they are reordered; the line is a keyed list, and every move records where the tiles were before the state changes.
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { faTxt, bidiTxt } from "../../../core/i18n.ts";
import { fly } from "../../../ui/motion.ts";
import { speak } from "../../../ui/speech.ts";
import { bumpConf, confBand, confOf, recordCard, recordEx } from "../../progress/index.ts";
import { CONF_SURE, wordGlossIdx } from "../cards.ts";
import { HintedPrompt, HintedText, QKind } from "../common.tsx";
import { feedback, footCheck, markMiss } from "../engine.ts";
import { checkBuilt } from "../model/answers.ts";
import { glossSegments } from "../model/gloss.ts";
import type { Prep } from "../prepare.ts";
import type { Step } from "../types.ts";
import { AudioPrompt } from "./parts.tsx";
import { meaningLang } from "../../../core/lang.ts";

/** What to do once the new order is on screen: slide the tiles that were already there from where they were, then `after`. */
interface Pending { rects: Map<Element, DOMRect>; after?: () => void }

export function Build({ p, st }: { p: Extract<Prep, { type: "build" }>; st: Step }) {
  const { s, tiles, hint, audio } = p;
  const [order, setOrder] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const orderRef = useRef(order), lockedRef = useRef(locked);
  orderRef.current = order;
  lockedRef.current = locked;
  const line = useRef<HTMLDivElement>(null), bank = useRef<HTMLDivElement>(null);
  const pend = useRef<Pending | null>(null);
  /* the new order is known at once, before it is drawn, so two quick taps never work from a stale one */
  const put = (o: number[]) => { orderRef.current = o; setOrder(o); };
  /* a click the pointer code did not handle (keyboard, or a touch it dropped) also removes the word; a tap or a drag that just ended must not do so twice */
  const stamps = useRef(new Map<number, { tap: number; drag: number }>());
  const stamp = (i: number) => { let x = stamps.current.get(i); if (!x) stamps.current.set(i, x = { tap: 0, drag: 0 }); return x; };
  const lineEl = (i: number) => line.current?.querySelector(`[data-i="${i}"]`) as HTMLElement | null;
  const bankEl = (i: number) => bank.current?.querySelector(`[data-i="${i}"]`) as HTMLElement | null;
  const snapshot = (skip?: Element | null) => {
    const m = new Map<Element, DOMRect>();
    for (const c of line.current!.children) if (c !== skip) m.set(c, c.getBoundingClientRect());
    return m;
  };
  useLayoutEffect(() => {
    const pd = pend.current;
    if (!pd) return;
    pend.current = null;
    for (const c of line.current!.children) { const r = pd.rects.get(c); if (r) fly(c as HTMLElement, r, 220); }
    pd.after?.();
  }, [order]);

  const place = (i: number) => {
    if (orderRef.current.includes(i) || lockedRef.current) return;
    const from = bankEl(i)!.getBoundingClientRect();
    pend.current = { rects: snapshot(), after: () => { const e = lineEl(i); if (e) fly(e, from); } };
    speak(tiles[i].t, 1);
    put([...orderRef.current, i]);
  };
  const unplace = (i: number) => {
    const e = lineEl(i);
    if (lockedRef.current || !e || !orderRef.current.includes(i)) return;
    const from = e.getBoundingClientRect();
    pend.current = { rects: snapshot(e), after: () => { const b = bankEl(i); if (b) fly(b, from); } };
    put(orderRef.current.filter((x) => x !== i));
  };
  /* a placed tile: a tap (press without moving) takes it back; a drag moves it among its neighbours, which slide aside */
  const startDrag = (ev: PointerEvent, i: number) => {
    const t = ev.currentTarget as HTMLElement, ln = line.current!;
    if (lockedRef.current || ev.button > 0) return;
    const id = ev.pointerId, sx = ev.clientX, sy = ev.clientY, r0 = t.getBoundingClientRect(), gx = sx - r0.left, gy = sy - r0.top;
    let drag = false, last = ev;
    const slop = ev.pointerType === "touch" ? 14 : 6;   /* a finger always moves a little: under 14px it is still a tap */
    try { t.setPointerCapture(id); } catch { /* not capturable */ }
    const follow = (e: PointerEvent) => { t.style.transform = "none"; const r = t.getBoundingClientRect(); t.style.transform = `translate(${e.clientX - gx - r.left}px,${e.clientY - gy - r.top}px) scale(1.06)`; };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      last = e;
      if (!drag) { if (Math.hypot(e.clientX - sx, e.clientY - sy) < slop) return; drag = true; t.classList.add("drag"); }
      let best: Element | null = null, bd = Infinity;
      for (const c of ln.children) {
        if (c === t) continue;
        const r = c.getBoundingClientRect(), d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        if (d < bd) { bd = d; best = c; }
      }
      if (best) {
        const r = best.getBoundingClientRect(), after = e.clientY > r.bottom || (e.clientY >= r.top && e.clientX > r.left + r.width / 2), ref = after ? best.nextElementSibling : best;
        if (ref !== t && ref !== t.nextElementSibling) {
          const kids = [...ln.children].filter((c) => c !== t), ids = kids.map((c) => +(c as HTMLElement).dataset.i!);
          ids.splice(ref ? kids.indexOf(ref) : kids.length, 0, i);
          /* moving the node in the DOM drops its pointer capture, so it is taken again once the new order is drawn */
          pend.current = { rects: snapshot(t), after: () => { try { t.setPointerCapture(id); } catch { /* gone */ } follow(last); } };
          put(ids);
          return;
        }
      }
      follow(e);
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerup", end, true);
      document.removeEventListener("pointercancel", end, true);
      try { t.releasePointerCapture(id); } catch { /* released */ }
      if (!drag) { if (e.type === "pointerup") { stamp(i).tap = Date.now(); unplace(i); } return; }
      stamp(i).drag = Date.now();
      const cur = t.getBoundingClientRect();
      t.style.transition = "none"; t.style.transform = ""; t.classList.remove("drag");
      const a = fly(t, cur, 200), clear = () => { t.style.transition = ""; };
      if (a) a.finished.then(clear, clear); else clear();
    };
    document.addEventListener("pointermove", move, true);
    document.addEventListener("pointerup", end, true);
    document.addEventListener("pointercancel", end, true);
  };
  const onKey = (ev: KeyboardEvent, i: number) => {
    const d = ({ ArrowLeft: -1, ArrowRight: 1 } as Record<string, number>)[ev.key], cur = orderRef.current, at = cur.indexOf(i), to = at + (d || 0);
    if (!d || lockedRef.current || to < 0 || to >= cur.length) return;
    ev.preventDefault();
    const next = cur.slice();
    [next[at], next[to]] = [next[to], next[at]];
    pend.current = { rects: snapshot(), after: () => lineEl(i)?.focus() };
    put(next);
  };

  const check = () => {
    const placed = orderRef.current.map((i) => tiles[i].t), res = checkBuilt(placed, s.tr, s.accept), ok = res.ok;
    setLocked(true);
    recordCard(s.id, ok ? "r" : "w");
    recordEx("build", ok);
    if (ok && res.kind !== "swap") {
      const seen = new Set<string>();
      for (const sg of glossSegments(s.tr, wordGlossIdx(), s.gloss)) {   /* a correct sentence adds a small step to each word in it the learner has already met */
        const cd = sg.hit && sg.hit.card;
        if (cd && !seen.has(cd.id as string) && confBand(cd.id as string) !== "new" && confOf(cd.id as string) < CONF_SURE) { seen.add(cd.id as string); bumpConf(cd.id as string, "near"); }
      }
    }
    if (!ok) markMiss(s.tr, s.fa);
    speak(s.tr);
    const note = res.kind === "swap" ? "Two words were swapped. Fixed for you." : res.kind === "order" ? "Right words, different order." : res.kind === "variant" ? "Your version works too." : "";
    feedback(ok, res.kind === "swap" ? "Almost" : ok ? "Correct" : "Correct sentence",
      st.hint ? <div class="w-word"><HintedText tr={s.tr} gloss={s.gloss} /></div> : <div class="w-word" lang="tr">{s.tr}</div>,
      s.en ? <div class="hint">{bidiTxt(s.en)}</div> : null,
      ...(res.kind === "exact" ? [] : [<div class="hint you">You wrote: {placed.map((t, i) => <><span class={res.bad.includes(i) ? "slip" : ""} lang="tr">{t}</span>{" "}</>)}</div>]),
      ...(note ? [<div class="hint">{note}</div>] : []));
  };
  const checkRef = useRef(check);
  checkRef.current = check;
  const ready = !locked && order.length > 0;
  useLayoutEffect(() => { if (!locked) footCheck("Check", () => ready, () => checkRef.current()); }, [ready, locked]);

  return (
    <>
      <QKind text={audio ? "Hear and build" : "Build the sentence"} st={st} />
      <h2 class="q-title">{audio ? "Build what you hear" : "Translate into Turkish"}</h2>
      {audio ? <AudioPrompt tr={s.tr} /> : (
        <div class="q-mean">
          <div class="q-word" lang="fa" dir="rtl" style="font-size:clamp(22px,5.5vw,30px)">{hint && meaningLang() !== "en" ? <HintedPrompt prompt={s.fa} tr={s.tr} gloss={s.gloss} lang="fa" /> : faTxt(s.fa)}</div>
          {s.en ? <div class="q-sub">{hint && meaningLang() !== "fa" ? <HintedPrompt prompt={s.en} tr={s.tr} gloss={s.gloss} lang="en" /> : bidiTxt(s.en)}</div> : null}
        </div>
      )}
      <div class="answer-line" aria-label="Your sentence" ref={line}>
        {order.map((i) => (
          <button key={i} class="word-tile" type="button" lang="tr" data-i={i} disabled={locked}
            onPointerDown={(ev) => startDrag(ev as unknown as PointerEvent, i)}
            onKeyDown={(ev) => onKey(ev as unknown as KeyboardEvent, i)}
            onClick={() => { const n = Date.now(), x = stamp(i); if (n - x.tap < 700 || n - x.drag < 700) return; unplace(i); }}>{tiles[i].t}</button>
        ))}
      </div>
      <div class="bank" ref={bank}>
        {tiles.map((x, i) => <button class={"word-tile" + (order.includes(i) ? " ghost" : "")} type="button" lang="tr" data-i={i} disabled={locked} onClick={() => place(i)}>{x.t}</button>)}
      </div>
    </>
  );
}
