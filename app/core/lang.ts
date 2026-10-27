// The help language (Profile → Language): which translations sit beside the Turkish. It is `prefs.lang` (also `S.mlang`, kept on
// the device for the first paint): "fa", "en", "both" or "none"; new learners start on "none". Stories show exactly what it says
// (`helpLangs`); the screens that need a meaning to work at all (practice, placement, the tutor) read `meaningLang()`, where
// "none" means English.
import { S } from "./store.ts";

export type HelpLang = "fa" | "en" | "both" | "none";

/** The learner's help language. */
export const helpLang = (): HelpLang => (["fa", "en", "both", "none"].includes(S.mlang) ? S.mlang : "fa") as HelpLang;

/** Which translations a story shows: Persian, English, both, or none (Turkish only; a tapped word still has its meaning). */
export function helpLangs(): { fa: boolean; en: boolean } {
  const l = helpLang();
  return { fa: l === "fa" || l === "both", en: l === "en" || l === "both" };
}

/** The language of a meaning where one must be shown (a flashcard, a placement item, the tutor): "none" falls back to English. */
export const meaningLang = (): "fa" | "en" | "both" => { const l = helpLang(); return l === "none" ? "en" : l; };
