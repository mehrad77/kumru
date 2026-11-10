// The help language (Profile → Language): which translations sit beside the Turkish. It is `prefs.lang` (also `S.mlang`, kept on
// the device for the first paint): "fa", "en", "ru" or "none"; new learners start on "none". The old "both" (Persian and English,
// from when there were two) reads as "fa": new words still show English under the Persian (practice's `bothFor`). Stories
// show exactly what it says (`helpLangs`); the screens that need a meaning to work at all (practice, placement, the tutor) read
// `meaningLang()`, where "none" means English. Russian falls back to English wherever a text has no Russian yet (`ruOr`).
import { S } from "./store.ts";

export type HelpLang = "fa" | "en" | "ru" | "none";

/** The learner's help language. */
export const helpLang = (): HelpLang => (S.mlang === "both" ? "fa" : ["fa", "en", "ru", "none"].includes(S.mlang) ? S.mlang : "fa") as HelpLang;

/** Which translations a story shows: Persian, English, Russian, or none (a tapped word still has its meaning). */
export function helpLangs(): { fa: boolean; en: boolean; ru: boolean } {
  const l = helpLang();
  return { fa: l === "fa", en: l === "en", ru: l === "ru" };
}

/** The language of a meaning where one must be shown (a flashcard, a placement item, the tutor): "none" falls back to English. */
export const meaningLang = (): "fa" | "en" | "ru" => { const l = helpLang(); return l === "none" ? "en" : l; };

/** The Russian of a text that may not have one yet, else its English. */
export const ruOr = (t: { en?: string; ru?: string }): string | undefined => t.ru || t.en;
