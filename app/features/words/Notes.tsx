// "My notes": the starter class notes and example sentences, read-only (the shared notebook takes no contributions or votes on
// this host). Most recent first; ten at a time. A page of its own, opened from the card on Profile (`NotesCard`).
import "./words.css";
import { bidiTxt } from "../../core/i18n.ts";
import { S, signals } from "../../core/store.ts";
import { Icon } from "../../ui/Icon.tsx";
import { openPage } from "../../ui/page.ts";
import { SpeakBtn } from "../../ui/Speak.tsx";
import { PracticeChip } from "./PracticeChip.tsx";
import { noteKind, noteLimit, setNoteKind, type NoteKind } from "./state.ts";

interface NoteCard { id: string; kind: string; tr: string; fa?: string; en?: string; detail?: string; ex?: string; exFa?: string; origin?: string; level?: string; pos?: string; topic?: string; at?: number; retired?: boolean }

const KINDS: [NoteKind, string][] = [["note", "Class notes"], ["sentence", "Sentences"]];
const fa = (t?: string) => (t ? <div class="fa" lang="fa" dir="rtl">{bidiTxt(t)}</div> : null);

function Item({ c }: { c: NoteCard }) {
  return (
    <article class="item card">
      <div class="main">
        {c.kind === "sentence"
          ? <div class="i-top"><span class="tr" lang="tr">{c.tr}</span><SpeakBtn text={c.tr} /></div>
          : <div class="tr">{bidiTxt(c.tr)}</div>}
        {fa(c.fa)}
        {c.en ? <div class="en">{bidiTxt(c.en)}</div> : null}
        {c.detail ? <div class="detail">{bidiTxt(c.detail)}</div> : null}
        {c.ex || c.exFa ? <div class="ex">{c.ex ? <div lang="tr">{c.ex}</div> : null}{fa(c.exFa)}</div> : null}
        <div class="meta">
          {c.kind !== "note" ? <PracticeChip id={c.id} /> : null}
          {c.level ? <span class="lvl">{c.level}</span> : null}
          {c.origin ? <span class={"pill " + (c.origin === "shared" ? "shared" : "false")}>{c.origin === "shared" ? "Shared root" : "False friend"}</span> : null}
          {c.pos === "verb" ? <span>Verb</span> : null}
          {c.topic ? <span>{bidiTxt(c.topic)}</span> : null}
          <span>Starter entry</span>
        </div>
      </div>
    </article>
  );
}

const live = (c: NoteCard) => (c.kind === "note" || c.kind === "sentence") && !c.retired;

/** Profile's card: how many notes and sentences there are, and the way to the page. */
export function NotesCard() {
  const n = signals.loaded.value ? ([...S.cards.values()] as NoteCard[]).filter(live).length : null;
  return (
    <button class="card link-card" type="button" onClick={() => openPage("My notes", () => Promise.resolve(Notes), {})}>
      <Icon name="note" class="link-ico" />
      <span class="link-t"><b>My notes</b><span class="hint">{n === null ? "…" : n === 1 ? "1 class note or sentence" : n + " class notes and sentences"}</span></span>
      <Icon name="chev" />
    </button>
  );
}

export function Notes() {
  const kind = noteKind.value, limit = noteLimit.value, loaded = S.loaded;
  const items: NoteCard[] = loaded
    ? ([...S.cards.values()] as NoteCard[]).filter((c) => c.kind === kind && !c.retired).sort((a, b) => (b.at || 0) - (a.at || 0))
    : [];
  return (
    <section class="card ipanel wide" id="pf-notes">
      <div class="ihead">
        <div class="seg">{KINDS.map(([k, t]) => <button type="button" aria-pressed={kind === k ? "true" : "false"} onClick={() => setNoteKind(k)}>{t}</button>)}</div>
      </div>
      <p class="hint">{kind === "note" ? "Summaries from class, shared with everyone." : "Example sentences the class has collected."}</p>
      <div class="list">
        {!loaded ? <div class="empty">{S.db ? "Loading the notebook…" : "The shared notebook isn't available in this view."}</div>
          : !items.length ? <div class="empty">Nothing here yet.</div>
          : <>
            {items.slice(0, limit).map((c) => <Item key={c.id} c={c} />)}
            {items.length > limit ? <button class="btn more" type="button" onClick={() => { noteLimit.value = limit + 20; }}>{"Show more (" + (items.length - limit) + " left)"}</button> : null}
          </>}
      </div>
    </section>
  );
}
