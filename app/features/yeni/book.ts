// Notebook, as Kumru sees it (docs/SPECS.md §10.3, §10.10). The reader syncs a notebook to the
// learner's account; this reads it back (api.ts, GET /api/yeni/notebook) and uses it for three things: the "In the book" line and
// the checkpoint offers on the Path, the Profile banner, and the small book summary a learner may share with a class.
// Data flows reader -> Kumru only, and the page never writes the notebook. The pure half is model/book.ts.
//
// `model` is the cached notebook as a model. A fetch runs at most once per 10 minutes and only for an account with a reader
// connection (prefs.yeniLinked), or once a day to find out whether one exists. Nothing polls: the Path and Profile call
// bookEnsure() when they are drawn.
import { signal } from "@preact/signals-core";
import { local } from "../../core/local.ts";
import { rerender } from "../../core/router.ts";
import { S, signals } from "../../core/store.ts";
import { toast } from "../../ui/toast.ts";
import { bookClasses } from "../classes/index.ts";
import { bookPathAct, bookPathReveal } from "../path/index.ts";
import { saveProgress } from "../progress/index.ts";
import { yeni } from "./api.ts";
import { bookModel, bookSig, bookSummary, type BookModel, type BookOfferResult } from "./model/book.ts";

export const model = signal<BookModel | null>(null);
let doc: unknown = null;
let at = 0, busy = false, sent = "", sentAt = 0;
const EVERY = 10 * 60e3, RECHECK = 864e5;

/** Whether this account has a reader connection (a progress setting, so the other phones know too). Reactive. */
export const linked = (): boolean => signals.prefs.value.yeniLinked === true;

/** Record whether this account has a reader connection. */
export function bookLinked(v: boolean): void {
  v = !!v;
  if (S.prefs.yeniLinked === v || (!v && S.prefs.yeniLinked !== true)) return;
  S.prefs = { ...S.prefs, yeniLinked: v };
  if (!v) { model.value = null; doc = null; }
  saveProgress();
  if (S.tab === "profile") rerender();
}

function setDoc(d: unknown): void {
  doc = d;
  model.value = d ? bookModel(d) : null;
}

/** Load the cached notebook (instant), then refresh it from the server when due. Called whenever the Path or Profile is drawn. */
export function bookEnsure(): void {
  if (!S.me || S.localOnly || !S.progLoaded) return;
  if (linked() && !doc) { const c = yeni.cached(); if (c) setDoc(c); }
  bookPush();   // a book switch just turned on, or the hourly resend, rides the next progress save
  if (linked()) bookClasses(true);   // loads the classes list, which says whether the summary is shared
  const k = "yeniChk:" + S.me, last = +local.get(k, "0") || 0;
  const due = Date.now() - last > (linked() ? EVERY : RECHECK) || (linked() && !doc && !at);   // a linked account with nothing cached asks once per page load
  if (!due || busy) return;
  busy = true;
  local.set(k, String(Date.now()));
  yeni.notebook().then((d) => {
    busy = false;
    at = Date.now();
    const had = JSON.stringify(model.value);
    if (d && !linked()) bookLinked(true);
    if (!d || !linked()) return;
    setDoc(d);
    if (had !== JSON.stringify(model.value)) bookPush();
  }, () => { busy = false; at = Date.now(); });
}

const sharing = (): string[] => bookClasses();

/** What the progress save should carry as `book`: the summary, only when it is shared with a class and changed since the last one sent. */
export function bookPayload(): { doc: ReturnType<typeof bookSummary>; sig: string } | null {
  const ids = sharing();
  if (!ids.length || !model.value) return null;
  const now = Date.now(), d = bookSummary(model.value, now);
  // resent when it changed, when the set of classes it goes to changed (a switch turned on), or after an hour (the server keeps it only while a class shares)
  const sig = bookSig(d) + "|" + [...ids].sort().join(",");
  return sig === sent && now - sentAt < 36e5 ? null : { doc: d, sig };
}
export const bookSent = (sig: string): void => { sent = sig; sentAt = Date.now(); };
/** Save progress so a changed summary reaches the classes it is shared with (also after a book switch is turned on). */
export function bookPush(): void { if (bookPayload()) saveProgress(); }

export const dismissed = (): Record<string, number> => (signals.prefs.value.bookDismiss as Record<string, number>) || {};
export function bookDismiss(ref: string): void {
  S.prefs = { ...S.prefs, bookDismiss: { ...dismissed(), [ref]: Date.now() } };
  saveProgress();
}

/** Run an offer through the same entry the Path's own buttons use (their lock checks included): never sets the position. */
export function bookAct(offer: NonNullable<BookOfferResult>): void { bookPathAct(offer.ref, offer.kind); }

/** /unit/<REF>: the Path scrolled to that unit (or its tree section), expanded unless locked, with the unit sheet open for the book's units. */
export function bookOpenUnit(ref: string): void {
  if (!bookPathReveal(ref)) toast("That unit isn't on your path.");
}
