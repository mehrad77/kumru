/* eslint-disable @typescript-eslint/no-explicit-any -- a session and its steps are open records (types.ts) */
// "I already know this" on a new-word card or a question: the word counts as known (confidence level 3), leaves this lesson's pool and
// queue, and the tap can be undone for a few seconds.
import type { ComponentType } from "preact";
import { el } from "../../core/dom.ts";
import { S } from "../../core/store.ts";
import { mountInto } from "../../ui/open.ts";
import { toast, undoToast } from "../../ui/toast.ts";
import { bumpConf, saveProgress } from "../progress/index.ts";
import { renderStep } from "./engine.ts";
import { ConfMove } from "./ConfMove.tsx";
import { type Move, takeMove } from "./move.ts";
import type { Card, Session, Step } from "./types.ts";

const loadMove = () => Promise.resolve(ConfMove as ComponentType<{ mv: Move }>);

/** The toast after "I already know this": the word and its new confidence. */
export function knownMsg(c: Card): HTMLElement {
  const msg = el("span", { class: "toast-msg" }, "«" + c.tr + "» marked as known"), mv = takeMove(c.id);
  if (mv) {
    const host = el("span", { style: "display:contents" });
    msg.appendChild(host);
    void mountInto(host, loadMove, { mv });
  }
  return msg;
}

export function markKnownNow(st: Step): void {
  const s = S.session as Session | null, c = st.c as Card, pool = st.pool as Card[] | undefined;
  if (!s || !pool || !pool.includes(c)) return;
  const snap = {
    prev: S.conf[c.id], pool: pool.slice(), queue: s.queue.slice(), total: s.total, i: s.i, newWords: s.newWords.slice(), used: s.used.has(c.id),
    fields: s.queue.filter((x) => x.pool === pool).map((x): [Step, string, any, any] => [x, x.k, x.n, x.of]),
    cards: s.queue.filter((x) => x.cards).map((x): [Step, Card[]] => [x, x.cards]),
  };
  bumpConf(c.id, "claim");
  pool.splice(pool.indexOf(c), 1);
  s.newWords = s.newWords.filter((x) => x !== c);
  s.used.delete(c.id);
  /* the steps that ask this word go; a match round loses its pair, and goes when fewer than two are left */
  {
    const before = s.queue.length;
    s.queue = s.queue.filter((x) => x.c !== c);
    for (const x of s.queue) if (x.cards && x.cards.includes(c)) x.cards = x.cards.filter((y: Card) => y !== c);
    s.queue = s.queue.filter((x) => !(x.cards && x.cards.length < 2));
    s.total -= before - s.queue.length;
  }
  if (!pool.length) {
    const before = s.queue.length;
    s.queue = s.queue.filter((x) => x.pool !== pool);
    s.total -= before - s.queue.length;
  } else {
    for (const x of s.queue) if (x.pool === pool && x.k === "match" && pool.length < 3) x.k = "type";
    /* keep the "n of N" numbering contiguous: the cards already seen plus the ones still ahead */
    const ahead = s.queue.filter((x) => x.k === "learn" && x.pool === pool), seen = pool.length - ahead.length;
    ahead.forEach((x, j) => { x.n = seen + j + 1; x.of = pool.length; });
  }
  saveProgress();
  s.i++;
  renderStep();
  if (s.reported) toast(knownMsg(c));
  else undoToast(knownMsg(c), () => {
    if (snap.prev) S.conf[c.id] = snap.prev; else delete S.conf[c.id];
    pool.splice(0, pool.length, ...snap.pool);
    snap.fields.forEach(([x, k, n, of]) => { x.k = k; x.n = n; x.of = of; });
    snap.cards.forEach(([x, cd]) => { x.cards = cd; });
    s.queue = snap.queue;
    s.total = snap.total;
    s.i = snap.i;
    s.newWords = snap.newWords;
    if (snap.used) s.used.add(c.id);
    s.queue.unshift(st);
    saveProgress();
    renderStep();
  });
}
