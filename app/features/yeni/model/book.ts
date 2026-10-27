// Notebook as Kumru sees it (docs/SPECS.md §10.3 and §10.10). The reader syncs a notebook
// (`NotebookFile`, apps/reader/src/lib/notebook/schema.ts) to the learner's account; the page reads it back with
// notebook() (../api.ts) and turns it into a model keyed by Kumru unit ref ("A1_3"). Pure: the fetching and drawing are in
// ../state.ts and the components. Data flows reader -> Kumru only, and nothing here writes the notebook.

/** Printed pages per unit and book (Kumru cannot know the reader's page lists): last page - first page + 1 of the AGENTS.md range table. Index 0 is Ünite 1. */
export const BK_PAGES: Record<string, Record<string, number[]>> = {
  A1: { ders: [18, 20, 18, 20, 18, 20], calisma: [6, 6, 9, 7, 5, 7] },
  A2: { ders: [20, 18, 16, 18, 18, 18], calisma: [7, 6, 7, 7, 7, 8] },
  B1: { ders: [20, 20, 22, 20, 20, 20], calisma: [7, 8, 7, 6, 6, 6] },
};
export const BK_BOOKS = ["ders", "calisma"] as const;
export const BK_BOOK_NAME: Record<string, string> = { ders: "Ders", calisma: "Çalışma" };
const BK_FRESH = 30 * 864e5, BK_MAX = 4096;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the reader's notebook is an open document
type NotebookFile = any;

export interface BookId { lv: string; book: string; n: number; ref: string }

/** "a1/ders/03_Unite_3_Ne_Yapiyorsun" -> {lv:"A1",book:"ders",n:3,ref:"A1_3"}; the alphabet (00_Baslangic), the listening scripts and the answer key are none. */
export function bkParse(id: unknown): BookId | null {
  const m = /^(a1|a2|b1)\/(ders|calisma)\/\d+_Unite_([1-6])(?:_|$)/i.exec(String(id || ""));
  return m ? { lv: m[1].toUpperCase(), book: m[2].toLowerCase(), n: +m[3], ref: m[1].toUpperCase() + "_" + m[3] } : null;
}

/** The latest time anything happened in one unit record of the notebook. */
export function bkRecAt(r: NotebookFile): number {
  let t = 0;
  const up = (v: unknown) => { if (typeof v === "number" && v > t) t = v; };
  if (r.pos) up(r.pos.at);
  if (r.done) up(r.done.at);
  for (const k in r.pages || {}) up(r.pages[k]);
  for (const k in r.ex || {}) up((r.ex[k] || {}).at);
  up(r.updated);
  return t;
}

export interface BookRec { read: number; total: number; done: boolean; at: number; page: number | null; tried: number; solved: number; seen: number }
export interface BookUnitModel { ref: string; lv: string; n: number; d: 0 | 1; p: number; s: [number, number, number]; at: number; books: Record<string, BookRec> }
export interface BookLast { ref: string; lv: string; n: number; book: string; page: number | null; at: number }
export interface BookModel { units: Record<string, BookUnitModel>; doneRefs: string[]; done: number; last: BookLast | null }

/**
 * Turn the reader's NotebookFile into what Kumru needs, keyed by Kumru unit ref ("A1_3"):
 * units[ref] = {ref, lv, n, d, p, s, at, books}, where
 *   d      1 when every book of the unit (ders and calisma) is marked done in the notebook (a missing record is not done);
 *   p      share of the printed pages read, 0..1, over both books (BK_PAGES gives the totals);
 *   s      [tried, solved, total] exercises: tried = entries the learner checked (n > 0) or revealed, solved = every slot right
 *          (ok === n), total = entries with any activity. Kumru does not know how many exercises a unit has, so total counts
 *          only what the learner has touched;
 *   at     last activity in the unit;
 *   books  per book {read, total, done, at, page} (page = the last printed page seen).
 * Also last = {ref, lv, n, book, page, at} (the unit last opened: meta.last when it is a numbered unit, else the newest page seen),
 * doneRefs (book-done refs in book order) and done (their count). Returns null for anything that is not a notebook.
 */
export function bookModel(file: NotebookFile): BookModel | null {
  if (!file || typeof file !== "object" || !file.units || typeof file.units !== "object") return null;
  const units: Record<string, BookUnitModel> = {};
  let newest: BookLast | null = null;
  for (const id in file.units) {
    const p = bkParse(id), r = file.units[id];
    if (!p || !r || typeof r !== "object") continue;
    const total = ((BK_PAGES[p.lv] || {})[p.book] || [])[p.n - 1] || 0, pages = r.pages && typeof r.pages === "object" ? r.pages : {}, ex = r.ex && typeof r.ex === "object" ? r.ex : {};
    let tried = 0, solved = 0, seen = 0;
    for (const k in ex) {
      const e = ex[k] || {}, did = (e.n || 0) > 0 || !!e.shown, typed = Array.isArray(e.v) && e.v.some((x: unknown) => x != null && x !== "");
      if (did || typed) seen++;
      if (did) tried++;
      if ((e.n || 0) > 0 && e.ok === e.n) solved++;
    }
    const at = bkRecAt(r), b: BookRec = { read: Object.keys(pages).length, total, done: !!(r.done && r.done.v), at, page: r.pos && +r.pos.page > 0 ? +r.pos.page : null, tried, solved, seen };
    const u = units[p.ref] || (units[p.ref] = { ref: p.ref, lv: p.lv, n: p.n, d: 0, p: 0, s: [0, 0, 0], at: 0, books: {} });
    u.books[p.book] = b;
    u.at = Math.max(u.at, at);
    if (r.pos && (!newest || r.pos.at > newest.at)) newest = { ref: p.ref, lv: p.lv, n: p.n, book: p.book, page: b.page, at: r.pos.at };
  }
  for (const ref in units) {
    const u = units[ref], bs = BK_BOOKS.map((k) => u.books[k]);
    u.d = bs.every((b) => b && b.done) ? 1 : 0;
    let read = 0, total = 0;
    for (const k of BK_BOOKS) {
      const b = u.books[k];
      total += ((BK_PAGES[u.lv] || {})[k] || [])[u.n - 1] || 0;
      if (b) read += b.read;
    }
    u.p = total ? Math.min(1, read / total) : 0;
    u.s = BK_BOOKS.reduce<[number, number, number]>((a, k) => {
      const b = u.books[k];
      return b ? [a[0] + b.tried, a[1] + b.solved, a[2] + b.seen] : a;
    }, [0, 0, 0]);
  }
  const order = (r: BookUnitModel) => (r.lv === "A1" ? 0 : r.lv === "A2" ? 6 : 12) + r.n;
  const doneRefs = Object.keys(units).filter((r) => units[r].d).sort((a, b) => order(units[a]) - order(units[b]));
  let last: BookLast | null = null;
  const ml = file.meta && file.meta.last, mp = ml && bkParse(ml.unit);
  if (mp && units[mp.ref] && units[mp.ref].books[mp.book]) {
    const rec = file.units[ml.unit];
    last = { ref: mp.ref, lv: mp.lv, n: mp.n, book: mp.book, page: units[mp.ref].books[mp.book].page, at: +ml.at || bkRecAt(rec) };
  } else if (newest) last = newest;
  return { units, doneRefs, done: doneRefs.length, last };
}

/** The "In the book" line's source: the last place read, only when it was within 30 days. */
export function bookLast(model: BookModel | null | undefined, now: number): BookLast | null {
  const l = model && model.last;
  return l && l.at && now - l.at <= BK_FRESH ? l : null;
}

/** The reader's address for a unit (and a printed page): <reader>/<level>/<book>/<unit number>/#p-<page>. */
export function bkReaderUrl(base: string, lv: string, book: string, n: number, page?: number | null): string {
  return base + "/" + lv.toLowerCase() + "/" + book + "/" + n + "/" + (page ? "#p-" + page : "");
}

export interface BookSummary { v: 1; at: number; units: Record<string, { d: 0 | 1; p: number; s: [number, number, number] }>; last: { ref: string; at: number } | null }

/**
 * The book summary a learner may share with a class (shared/api.ts BookDoc, <= 4 KB): per unit {d, p, s}, never answers or
 * writing. Only units with some activity are listed; if the JSON would pass 4 KB the quietest units are dropped.
 */
export function bookSummary(model: BookModel | null | undefined, now: number): BookSummary {
  const units: BookSummary["units"] = {};
  if (model) {
    for (const ref in model.units) {
      const u = model.units[ref];
      if (u.d || u.p > 0 || u.s[0] > 0 || u.s[2] > 0) units[ref] = { d: u.d ? 1 : 0, p: Math.round(u.p * 100) / 100, s: [u.s[0], u.s[1], u.s[2]] };
    }
  }
  const l = model && model.last, doc: BookSummary = { v: 1, at: now, units, last: l ? { ref: l.ref, at: l.at } : null };
  if (JSON.stringify(doc).length > BK_MAX) {
    const keys = Object.keys(units).sort((a, b) => (units[a].d - units[b].d) || (units[a].p - units[b].p));
    while (JSON.stringify(doc).length > BK_MAX && keys.length) delete units[keys.shift() as string];
  }
  return doc;
}

/** The summary without its time, to tell whether it changed since the last one sent. */
export const bookSig = (doc: BookSummary | null | undefined): string => (doc ? JSON.stringify({ u: doc.units, l: doc.last }) : "");

/** Where Kumru has a unit: the learner's current unit or tree section, placed past (checkpoint not passed), locked, or done; and whether its checkpoint is unlocked now. */
export interface PathState { refs: Record<string, { where: "cur" | "past" | "later" | "done"; cp?: boolean }> }
export type BookOfferResult = { kind: "checkpoint" | "jump"; ref: string } | null;

/**
 * Which unit, if any, the Path should offer a checkpoint or a jump for. `st.refs[ref]` says where Kumru has the unit:
 *   where  "cur" (the learner's current unit or tree section), "past" (placed past, checkpoint not passed), "later" (locked) or "done";
 *   cp     whether its checkpoint is unlocked now (cur: the same lock the button obeys; past: always).
 * Rules (docs/PROGRESS.md: a learner passes a unit only through its checkpoint or a tested jump; this never sets a position):
 *   1. a book-done unit that is current with an unlocked checkpoint -> {kind:"checkpoint"};
 *   2. else one placed past (lowest first) -> {kind:"checkpoint"} (its checkpoint is open);
 *   3. else the furthest locked one ahead -> {kind:"jump"}, which runs the existing tested jump / test out;
 *   a unit Kumru already has done, one the learner dismissed (`dismissed[ref]`) and one with a locked checkpoint offer nothing.
 */
export function bookOffer(model: BookModel | null | undefined, st: PathState | null | undefined, dismissed?: Record<string, unknown> | null): BookOfferResult {
  if (!model || !st || !st.refs) return null;
  dismissed = dismissed || {};
  const ok = model.doneRefs.filter((r) => st.refs[r] && st.refs[r].where !== "done" && !dismissed[r]);
  const cur = ok.find((r) => st.refs[r].where === "cur" && st.refs[r].cp);
  if (cur) return { kind: "checkpoint", ref: cur };
  const past = ok.find((r) => st.refs[r].where === "past");
  if (past) return { kind: "checkpoint", ref: past };
  const later = ok.filter((r) => st.refs[r].where === "later");
  if (later.length) return { kind: "jump", ref: later[later.length - 1] };
  return null;
}
