// The Profile banner, last on the Profile tab: the reader in one card; connected, it shows the notebook's state.
import "./yeni.css";
import { useEffect } from "preact/hooks";
import { signals } from "../../core/store.ts";
import { bookEnsure, linked, model } from "./book.ts";
import { YiMark } from "./Mark.tsx";
import { bkReaderUrl, bookLast } from "./model/book.ts";
import { READER } from "./model/reader.ts";
import { openConnections } from "./sheets.ts";

export function Promo() {
  // asks the notebook (at most every few minutes) once the account's progress has loaded
  const ready = signals.progLoaded.value, me = signals.me.value;
  useEffect(() => { bookEnsure(); }, [ready, me]);
  if (!me) return null;
  const isLinked = linked(), M = isLinked ? model.value : null;
  const last = M && bookLast(M, Date.now());
  const open = <a class="btn sm primary" href={last ? bkReaderUrl(READER, last.lv, last.book, last.n, last.page) : READER} target="_blank" rel="noopener noreferrer">Open the reader ↗</a>;
  const manage = <button class="btn sm" type="button" onClick={openConnections}>Manage connections</button>;
  return (
    <section class="bk-promo card" aria-label="Notebook">
      <YiMark />
      <div class="bk-promo-b">
        {isLinked ? (
          <>
            <b>Your notebook</b>
            <p class="hint">{M ? (M.done === 1 ? "1 unit done" : M.done + " units done") + (last ? " · last opened " + last.lv + " · Ünite " + last.n : "") : "Connected. Nothing in your notebook yet: read a page in the reader and it appears here."}</p>
            <div class="bk-promo-act">{open}{manage}</div>
          </>
        ) : (
          <>
            <b>Notebook</b>
            <p class="hint">The whole book online, with your answers, writing and progress in a notebook.</p>
            <p class="hint">Connect it in the reader's Ayarlar to keep your notebook on every device.</p>
            <div class="bk-promo-act">{open}{manage}</div>
          </>
        )}
      </div>
    </section>
  );
}
