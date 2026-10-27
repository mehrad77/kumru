// What the AI tutor is asked, and its replies made safe. Pure: the learner's level, lessons and blurb are passed in. The prompts
// are the product's wording; change them in step with the tutor lab's fixtures (tutorlab/fixtures).
import { levelRank } from "../../../lib/units.ts";
import { normW } from "./diff.ts";

/** The AI tutor's prompt version, saved with each tutor lab run. */
export const TUTOR_V = "p0.1";

/** What the AI tutor may expect at each level (the course's grammar). */
export const LEVEL_NOTES: Record<string, string> = {
  A1: "Beginner: present -iyor, past -di, future -ecek, the five cases, possessives, var/yok, mi questions, bu/şu/o. Short, concrete sentences.",
  A2: "Elementary: A1 plus imperative and optative (-sin, -elim), reported past -miş, aorist -r/-mez, ability -ebil/-eme, -ip and -madan, gibi/kadar, çünkü/bu yüzden, hem…hem, ne…ne. Short everyday sentences with simple linking.",
  B1: "Intermediate: A2 plus past continuous -iyordu, -ken, -arak, verbal nouns -mak/-ma/-iş, necessity -malı, wishes and conditionals -se/-seydi, -ince, reported commands. Connected sentences with subordinate clauses are expected.",
};

/** A grammar lesson as the prompts and the checks need it. */
export interface Lesson {
  id: string; order: number; title: string; en?: string; level?: string;
  practice?: { task_tr?: string; task_fa?: string; task_en?: string; target?: string };
}
/** What a prompt needs to know about the learner. */
export interface Ctx { level: string; grammar: Lesson[]; learned: Record<string, unknown>; blurb: string }

/** The lessons the learner has met (id: title), one per line. */
export function lessonList(upTo: number, c: Ctx): string {
  return c.grammar.filter((g) => g.order <= Math.max(upTo, 12) || levelRank(g.level || "A1") < levelRank(c.level) || c.learned[g.id]).map((g) => g.id + ": " + g.title).join("\n");
}

export function checkPrompt(lesson: Lesson, text: string, c: Ctx): string {
  const p = lesson.practice || {};
  return [
    "You are a kind Turkish teacher for Persian-speaking adults at level " + c.level + ". Check ONE short piece of student writing.", "Level: " + LEVEL_NOTES[c.level], "About the learner: " + c.blurb,
    "",
    "Lesson: " + lesson.order + ". " + lesson.title + " — " + lesson.en,
    "Task given to the student: " + (p.task_en || ("Write a sentence that uses: " + lesson.title)),
    "Target grammar: " + (p.target || lesson.title),
    "",
    "Lessons the student has seen (id: title):", lessonList(lesson.order, c),
    "",
    "Student wrote: \"\"\"" + String(text).slice(0, 400) + "\"\"\"",
    "",
    "Rules:",
    "- Only flag real errors: grammar, case endings, vowel harmony, spelling (ı/i, ö/o, ü/u, ş, ç, ğ), word order that is wrong. Accept natural alternatives. Ignore capital letters and missing final punctuation.",
    "- \"corrected\": the closest natural, correct " + c.level + " sentence that keeps the student's own words and meaning. If already correct, copy it unchanged.",
    "- \"usesTarget\": true if the writing uses the target grammar (even with a small slip).",
    "- \"notes\": at most 2, only for real errors (empty if ok). Each: \"fa\" = one short sentence in simple Persian, \"en\" = the same in simple English, \"lesson\" = the best matching lesson id from the list, or \"\".",
    "- If the student wrote Persian, English or another language instead of Turkish: ok=false, language=that language, corrected = a simple " + c.level + " Turkish version of what they meant, one note telling them how to say it.",
    "- Watch for typical Persian-speaker errors: Persian ezafe order copied (\"kitabı Ali\" instead of \"Ali'nin kitabı\"), missing possessive ending after benim/senin, missing or extra accusative -ı, wrong case with verbs (binmek -e, inmek -den, sormak -e), plural after numbers, mi joined to the word or in the wrong place, de (also) joined to the word, -de vs -e confusion, wrong vowel harmony in suffixes.",
    "- \"praise\": 2-5 encouraging Turkish words fitting the result.",
    "",
    "Reply with only this JSON:",
    "{\"ok\": true, \"usesTarget\": true, \"corrected\": \"...\", \"notes\": [{\"fa\": \"...\", \"en\": \"...\", \"lesson\": \"g_a1_3_yonelme\"}], \"praise\": \"...\", \"language\": \"tr\"}",
  ].join("\n");
}

/** One correction note: a short sentence in Persian and in English, and the lesson it points to ("" for none). */
export interface Note { fa: string; en: string; lesson: string }
export interface CheckResult { ok: boolean; usesTarget: boolean; corrected: string; praise: string; language: string; notes: Note[]; ms: number }

const note = (n: unknown, ids: Set<string>): Note => {
  const o = (n || {}) as Record<string, unknown>;
  return { fa: String(o.fa || "").slice(0, 300), en: String(o.en || "").slice(0, 300), lesson: ids.has(o.lesson as string) ? (o.lesson as string) : "" };
};

/** The AI's reply to `checkPrompt` made safe. A reply that says "ok" but corrects the sentence with notes is not ok. Throws `{code: "invalid_json"}` for no object. */
export function normCheck(r: unknown, text: string, ids: Set<string>, ms: number): CheckResult {
  if (!r || typeof r !== "object") throw { code: "invalid_json" };
  const o = r as Record<string, unknown>;
  const out: CheckResult = {
    ok: !!o.ok, usesTarget: o.usesTarget !== false, corrected: String(o.corrected || text).slice(0, 400), praise: String(o.praise || "").slice(0, 60), language: String(o.language || "tr").slice(0, 8),
    notes: (Array.isArray(o.notes) ? o.notes : []).slice(0, 2).map((n) => note(n, ids)), ms,
  };
  if (out.ok && normW(out.corrected).replace(/\s+/g, " ") !== normW(text).replace(/\s+/g, " ") && out.notes.length) out.ok = false;
  return out;
}

// ---------- the learner's profile and the placement writing sample (onboarding) ----------

export function translitPrompt(fa: string): string {
  return ["Give up to 3 Latin spellings of this Persian first name that a Turkish speaker would read correctly (use ş ç ğ ı ö ü where they fit). Most common first.", "Name: " + String(fa).slice(0, 40), "Reply with only this JSON: {\"latin\":[\"...\"]}"].join("\n");
}

/** The Latin spellings in a reply to `translitPrompt`: letters only, at most three, none repeated. */
export function normLatin(r: unknown): string[] {
  const l = ((r && Array.isArray((r as { latin?: unknown }).latin) ? (r as { latin: unknown[] }).latin : []) as unknown[]).map((x) => String(x || "").trim().slice(0, 30)).filter((x) => /^[A-Za-zÇĞİÖŞÜçğıöşü' -]+$/.test(x));
  return [...new Set(l)].slice(0, 3);
}

export interface ProfileAnswers { name: string; city?: string; job?: string; hobby?: string; why?: string }

export function profilePrompt(a: ProfileAnswers): string {
  return ["You help a Turkish-learning app personalise stories for a Persian-speaking adult learner. Turn their answers into clean forms. Do not invent facts; leave a field empty when the answer is empty.",
    "", "Answers:", "name: " + a.name, "hometown or city: " + (a.city || ""), "job or field of study: " + (a.job || ""), "one hobby: " + (a.hobby || ""), "why they learn Turkish: " + (a.why || ""),
    "", "Rules:",
    "- Answers may be Persian, English or Turkish. \"tr\" is Latin Turkish orthography exactly as a Turkish person writes it (Şiraz, Tebriz, İsfahan, mühendis). \"en\" is English. \"fa\" is Persian script (name and city only).",
    "- For job and hobby prefer simple, common words an A1 learner could meet (öğretmen, mühendis, doktor, futbol, kitap okumak). Keep each to 1-4 words, a noun or short phrase, never a sentence. \"why\" is one short phrase.",
    "- name.tr is the name in Turkish letters. name.alt is a shorter or simpler friendly form ONLY if the name is long, has sounds Turkish spelling handles badly, or is awkward with Turkish endings; otherwise the same as name.tr. name.why_alt is one short English reason or empty.",
    "- bio.en: 1-2 sentences, third person, at most 50 words, for a tutor, using only what was given. bio.tr: one very simple A1 Turkish sentence about them.",
    "", "Reply with only this JSON:",
    "{\"name\":{\"tr\":\"\",\"alt\":\"\",\"en\":\"\",\"fa\":\"\",\"why_alt\":\"\"},\"city\":{\"tr\":\"\",\"en\":\"\",\"fa\":\"\"},\"job\":{\"tr\":\"\",\"en\":\"\"},\"hobby\":{\"tr\":\"\",\"en\":\"\"},\"why\":{\"tr\":\"\",\"en\":\"\"},\"bio\":{\"en\":\"\",\"tr\":\"\"}}"].join("\n");
}

export function placePrompt(text: string, grammar: Lesson[]): string {
  return ["You are a careful Turkish teacher placing a Persian-speaking adult in a Turkish course (A1, A2, B1; six units each). Read a short self-introduction and estimate the level it clearly shows.",
    "A1: " + LEVEL_NOTES.A1, "A2: " + LEVEL_NOTES.A2, "B1: " + LEVEL_NOTES.B1,
    "", "Student's text: \"\"\"" + String(text).slice(0, 800) + "\"\"\"",
    "", "Rules:",
    "- language: \"tr\" if mostly Turkish, otherwise \"fa\" or \"en\".",
    "- level and unit (1-6): the course position this writing clearly shows. Be conservative: when unsure choose the lower one. A few correct simple sentences are A1 unit 1-3.",
    "- Split into sentences. For each: orig, fixed (closest correct natural version keeping their words), ok (no real error), notes (at most 1, only for a real error: fa one short sentence in simple Persian, en the same in English, lesson = best matching id below or empty).",
    "Lessons (id: title):", grammar.map((g) => g.id + ": " + g.title).join("\n"),
    "", "Reply with only this JSON:",
    "{\"language\":\"tr\",\"level\":\"A1\",\"unit\":2,\"sentences\":[{\"orig\":\"...\",\"fixed\":\"...\",\"ok\":true,\"notes\":[{\"fa\":\"...\",\"en\":\"...\",\"lesson\":\"\"}]}]}"].join("\n");
}

export interface PlaceSentence { orig: string; fixed: string; ok: boolean; notes: Note[] }
export interface PlaceResult { language: string; level: string; unit: number; sentences: PlaceSentence[] }

/** The AI's reading of a writing sample made safe. Throws `{code: "invalid_json"}` for a reply with no sentence list. */
export function normPlace(r: unknown, ids: Set<string>, levels: readonly string[]): PlaceResult {
  const o = r as Record<string, unknown> | null;
  if (!o || typeof o !== "object" || !Array.isArray(o.sentences)) throw { code: "invalid_json" };
  const sentences = (o.sentences as unknown[]).slice(0, 10).map((s) => {
    const x = (s || {}) as Record<string, unknown>;
    return { orig: String(x.orig || "").slice(0, 300), fixed: String(x.fixed || x.orig || "").slice(0, 300), ok: !!x.ok, notes: (Array.isArray(x.notes) ? x.notes : []).slice(0, 1).map((n) => note(n, ids)) };
  }).filter((x) => x.orig || x.fixed);
  return { language: String(o.language || "tr").slice(0, 8), level: levels.includes(o.level as string) ? (o.level as string) : "", unit: Math.max(1, Math.min(6, Math.round(+(o.unit as number)) || 1)), sentences };
}
