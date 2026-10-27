// The Path's book box: the "In the book" line and, when one applies, the checkpoint or jump offer. Nothing without a notebook.
import "./yeni.css";
import { useEffect } from "preact/hooks";
import { Icon } from "../../ui/Icon.tsx";
import { bookPath } from "../path/index.ts";
import { unitTitle } from "../../lib/units.ts";
import { bookAct, bookDismiss, bookEnsure, dismissed, linked, model } from "./book.ts";
import { YiMark } from "./Mark.tsx";
import { BK_BOOK_NAME, bkReaderUrl, bookLast, bookOffer } from "./model/book.ts";
import { READER } from "./model/reader.ts";

export function PathBits() {
  useEffect(() => { bookEnsure(); });   // cached first, refetched at most every 10 minutes: asked each time the Path draws
  const M = linked() ? model.value : null;
  if (!M) return null;
  const last = bookLast(M, Date.now());
  const offer = bookOffer(M, bookPath(), dismissed());
  const u = offer ? M.units[offer.ref] : null;
  const ck = !!offer && offer.kind === "checkpoint", name = u ? unitTitle(u.lv, u.n) : "";
  return (
    <>
      {last ? (
        <a class="bk-line" href={bkReaderUrl(READER, last.lv, last.book, last.n, last.page)} target="_blank" rel="noopener noreferrer">
          <YiMark />
          <span class="bk-line-t">
            <span class="hint">In the book</span>
            <b>{last.lv + " · Ünite " + last.n + " · " + BK_BOOK_NAME[last.book] + (last.page ? ", p. " + last.page : "")}</b>
          </span>
          <Icon name="chev" class="bi" />
        </a>
      ) : null}
      {offer && u ? (
        <section class="bk-offer card" aria-label="From the book">
          <YiMark />
          <div class="bk-offer-b">
            <b>{ck ? "You finished " + u.lv + " Ünite " + u.n + " in the book" : "Ready to jump ahead?"}</b>
            <span class="hint">{ck ? "Take the checkpoint to move on here too." : "You finished " + u.lv + " Ünite " + u.n + (name ? " · " + name : "") + " in the book. Test out to open it."}</span>
            <div class="bk-offer-act">
              <button class="btn sm primary" type="button" onClick={() => bookAct(offer)}>{ck ? "Take the checkpoint" : "Test out to Ünite " + u.n}</button>
              <button class="btn sm ghost" type="button" onClick={() => bookDismiss(offer.ref)}>Not now</button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
