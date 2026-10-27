// The tutor's questions to the AI: check a sentence ("Try it", the tutor lab), spell a Persian name in Latin letters, tidy the
// onboarding answers into a profile, read the placement writing sample. Each throws a `{code}` error the caller turns into words
// with `aiErrText`; the name and profile calls fall back to the offline forms without the AI.
import { S } from "../../core/store.ts";
import { LEVELS } from "../../lib/units.ts";
import { type Answers, type Profile, learnerBlurb, normProfile, profileFallback, translitOffline } from "../onboarding/index.ts";
import { myLevel } from "../progress/index.ts";
import { aiReady, askJson } from "./ai.ts";
import { type CheckResult, type Ctx, type Lesson, type PlaceResult, checkPrompt, normCheck, normLatin, normPlace, placePrompt, profilePrompt, translitPrompt } from "./model/prompts.ts";

const grammar = (): Lesson[] => S.grammar as Lesson[];
const ids = (): Set<string> => new Set(grammar().map((g) => g.id));
const ctx = (): Ctx => ({ level: myLevel(), grammar: grammar(), learned: S.learned || {}, blurb: learnerBlurb() });

/** One "Try it" sentence: one quick call, validated here. */
export async function checkSentence(lesson: Lesson, text: string, opts?: { signal?: AbortSignal }): Promise<CheckResult> {
  if (!aiReady()) throw { code: "capability_disabled" };
  const t0 = Date.now();
  const r = await askJson(checkPrompt(lesson, text, ctx()), opts?.signal);
  return normCheck(r, text, ids(), Date.now() - t0);
}

/** Up to three Latin spellings of a Persian name; the offline guess alone without the AI or when it fails. */
export async function translitName(fa: string, signal?: AbortSignal): Promise<string[]> {
  const rough = translitOffline(fa), off = rough ? [rough] : [];
  if (!aiReady()) return off;
  try { const l = normLatin(await askJson(translitPrompt(fa), signal)); return l.length ? l : off; } catch { return off; }
}

/** The onboarding answers as clean forms: the AI's, or the learner's words as typed. */
export async function buildProfile(a: Answers, signal?: AbortSignal): Promise<Profile> {
  if (!aiReady() || !(a.city || a.job || a.hobby || a.why)) return profileFallback(a);
  return normProfile(await askJson(profilePrompt(a), signal), a);
}

/** The AI's reading of the placement writing sample. */
export async function checkPlacement(text: string, signal?: AbortSignal): Promise<PlaceResult> {
  if (!aiReady()) throw { code: "capability_disabled" };
  return normPlace(await askJson(placePrompt(text, grammar()), signal), ids(), LEVELS);
}
