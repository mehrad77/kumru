// The suffix markup of the grammar lessons: "ev[ler:pl]" is a stem with a plural suffix. Pure: it splits a string into plain
// pieces and coloured suffixes; Morph.tsx and dom.ts draw them. The engine that builds the forms is app/lib/morphology.ts.

/** What each suffix role is called (the tooltip of a coloured suffix). */
export const ROLE_NAMES: Record<string, string> = { pl: "plural", poss: "possessive", case: "case", tense: "tense", pers: "person / to be", neg: "negative", q: "question", buf: "buffer letter", der: "other suffix" };

export type MorphPiece = { text: string; role?: undefined } | { text: string; role: string };

/** `[text:role]` marks a suffix; everything else is plain. */
export function splitMorph(str: string): MorphPiece[] {
  const out: MorphPiece[] = [];
  const re = /\[([^\]:]+):(\w+)\]/g;
  let i = 0, m: RegExpExecArray | null;
  while ((m = re.exec(str))) {
    if (m.index > i) out.push({ text: str.slice(i, m.index) });
    out.push({ text: m[1], role: m[2] });
    i = re.lastIndex;
  }
  if (i < str.length) out.push({ text: str.slice(i) });
  return out;
}

/** A quiz sentence cut at its `___` gap(s): the text between them. */
export const quizParts = (q: string): string[] => q.split(/_{2,}/);

export interface QuizItem { q: string; opts: string[]; a?: number; why?: string; fa?: string; en?: string }

/** The quiz items of a widget that can be played (a sentence and two or more options). */
export const playable = (items: unknown): QuizItem[] =>
  ((items as QuizItem[]) || []).filter((it) => it && typeof it.q === "string" && Array.isArray(it.opts) && it.opts.length > 1);

/** The index of an item's right option, kept inside its options. */
export const rightIndex = (it: QuizItem): number => Math.max(0, Math.min(it.opts.length - 1, +(it.a as number) || 0));
