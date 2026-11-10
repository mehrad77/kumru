// The help language (Profile → Language): which translations sit beside the Turkish. It is `prefs.lang` (also `S.mlang`, kept on
// the device for the first paint): "fa", "en", "ru", "both" (Persian and English) or "none"; new learners start on "none". Stories
// show exactly what it says (`helpLangs`); the screens that need a meaning to work at all (practice, placement, the tutor) read
// `meaningLang()`, where "none" means English. Russian falls back to English wherever a text has no Russian yet (`ruOr`).
import { S } from "./store.ts";

export type HelpLang = "fa" | "en" | "ru" | "both" | "none";

/** The learner's help language. */
export const helpLang = (): HelpLang => (["fa", "en", "ru", "both", "none"].includes(S.mlang) ? S.mlang : "fa") as HelpLang;

/** Which translations a story shows: Persian, English, Russian, Persian and English, or none (a tapped word still has its meaning). */
export function helpLangs(): { fa: boolean; en: boolean; ru: boolean } {
  const l = helpLang();
  return { fa: l === "fa" || l === "both", en: l === "en" || l === "both", ru: l === "ru" };
}

/** The language of a meaning where one must be shown (a flashcard, a placement item, the tutor): "none" falls back to English. */
export const meaningLang = (): "fa" | "en" | "ru" | "both" => { const l = helpLang(); return l === "none" ? "en" : l; };

/** The Russian of a text that may not have one yet, else its English. */
export const ruOr = (t: { en?: string; ru?: string }): string | undefined => t.ru || t.en;
