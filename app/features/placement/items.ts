// The probes of the placement climb: the words and suffix items asked for one unit of the books, or one section of the skill tree.
import { S } from "../../core/store.ts";
import { plainParts } from "../../lib/morphology.ts";
import { DT, drillOptions, makeDrillQ, type DrillQ, type DrillType } from "../drills/index.ts";
import { CONF_SURE } from "../../lib/progress.ts";
import { shuffle } from "../../lib/random.ts";
import { idxUnit } from "../../lib/units.ts";
import { treeSecs } from "../path/index.ts";
import { confOf } from "../progress/index.ts";
import { pickOptions } from "./model/placement.ts";
import { meaningLang } from "../../core/lang.ts";

/** A word card as the probes need it. */
/** A card as the page keeps it. */
export interface LegacyCard { id: string; kind: string; tr: string; fa?: string; en?: string; topic?: string; src?: string; accept?: unknown; gloss?: unknown; retired?: boolean }
export type PlCard = LegacyCard & { pos?: string; ref?: string; level?: string };
export type WordItem = { k: "w"; c: PlCard; opts: PlCard[] };
export type DrillItem = { k: "g"; t: DrillType; q: DrillQ; answer: string; opts: string[] };
export type Item = WordItem | DrillItem;
/** One probe: its items, and what the climb calls it (`ref`; `label` is the heading for a section, else "<level> · Unit <n>"). */
export interface Probe { idx: number; ref: string; label?: string; lv?: string; u?: number; items: Item[] }

/** A word's meaning in the language the learner picked (Persian or English). */
export const meaningText = (c: PlCard): string => (meaningLang() === "en" ? (c.en || c.fa) : (c.fa || c.en)) as string;
export const meaningIsFa = (c: PlCard): boolean => (meaningLang() === "en" ? !c.en : !!c.fa);

const lessonRefMap = (): Record<string, string> => Object.fromEntries(S.grammar.map((g: { id: string; ref?: string }) => [g.id, g.ref || ""]));

/** The items of one probe: about 6 words of the unit or section (`member`) below score 10, with distractors from the same place, then the same level,
 * then any, plus up to 4 suffix items of its lessons (`hasLesson`). */
function plItems(lv: string, member: (c: PlCard) => boolean, hasLesson: (lesson: string) => boolean): Item[] {
  const everyone: PlCard[] = [...S.cards.values()].filter((c: PlCard) => c.kind === "word" && !c.retired && c.tr && meaningText(c));
  const pool = shuffle(everyone.filter((c) => member(c) && confOf(c.id) < CONF_SURE)), ws: PlCard[] = [];
  let verbs = 0;
  for (const c of pool) {
    const v = c.pos === "verb";
    if (v && verbs >= 2) continue;
    if (v) verbs++;
    ws.push(c);
    if (ws.length >= 6) break;
  }
  // distractors: same unit, then same level, then any; within each, the same topic first
  const wordItems: WordItem[] = ws.map((c) => {
    const near: PlCard[][] = Array.from({ length: 6 }, () => []);
    for (const x of everyone) if (x.id !== c.id) near[((member(x) ? 0 : x.level === lv ? 1 : 2) * 2) + (c.topic && x.topic === c.topic ? 0 : 1)].push(x);
    return { k: "w", c, opts: shuffle(pickOptions(c, near.flatMap((n) => shuffle(n)), meaningText)) };
  });
  const ts = DT.filter((t) => hasLesson(t.lesson)), per = ts.length >= 3 ? 1 : 2, gi: DrillItem[] = [];
  for (const t of ts) {
    const seen = new Set<string>();
    for (let i = 0; i < per; i++) {
      let q: DrillQ, answer: string, tries = 0;
      do { q = makeDrillQ(t); answer = plainParts(q.ps); } while (seen.has(answer) && ++tries < 6);
      seen.add(answer);
      gi.push({ k: "g", t, q, answer, opts: shuffle([answer, ...drillOptions(q, answer)]) });
    }
  }
  return [...wordItems, ...gi.slice(0, 4)];
}

/** The probe of one unit of the books (idx = its place in the 18 units). */
export function plUnitItems(idx: number): Probe {
  const { lv, u } = idxUnit(idx), ref = lv + "_" + u, lm = lessonRefMap();
  return { idx, lv, u, ref, items: plItems(lv, (c) => c.ref === ref, (g) => lm[g] === ref) };
}

/** The same probe for a section of the skill tree (idx = its place in the tree's sections). */
export function plSectionItems(idx: number): Probe {
  const sec = treeSecs()[idx];
  const ids = new Set(sec.skills.flatMap((k) => k.words || [])), ls = new Set(sec.skills.flatMap((k) => k.lessons || []));
  return { idx, label: "Section " + sec.order + " · " + sec.title, ref: "sec:" + sec.id, items: plItems(sec.level, (c) => ids.has(c.id), (g) => ls.has(g)) };
}
