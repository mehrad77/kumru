// What the flow starts from: the learner's name, character, hometown and language as they are now. Pure, and careful: these come
// from a progress document another device, an older version or a hand-edited copy may have written, so any field may be missing or
// of another shape. A throw here would be the flow's first draw failing (model/answers.test.ts).
import type { Answers } from "../Flow.tsx";
import type { Mode } from "./flow.ts";
import { guessLang, uiLangOf } from "./words.ts";

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** The parts of the page state the flow reads. */
export interface StartState { nick?: unknown; profileName?: unknown; char?: unknown; profile?: unknown }

export function initAnswers(mode: Mode, s: StartState, help: string, browserLangs: readonly string[]): Answers {
  const p = s.profile && typeof s.profile === "object" ? (s.profile as { city?: unknown }) : {};
  const city = typeof p.city === "string" ? p.city : p.city && typeof p.city === "object" ? str((p.city as { raw?: unknown }).raw) : "";
  return {
    // a learner who has not picked a help language yet ("none") starts on the browser's
    lang: help === "none" ? guessLang(browserLangs) : uiLangOf(help),
    name: (str(s.nick) || str(s.profileName).trim().split(/\s+/)[0] || "").slice(0, 30),
    char: s.char ?? null,
    ans: { city: city.slice(0, 40), job: "", hobby: "", why: "" },
    self: mode === "update" ? "keep" : null, res: null, ai: null, skipPlace: false, useAlt: "",
  };
}
