// The learner's name and hometown as the other screens read them: the model's functions with the state filled in.
import { S } from "../../core/store.ts";
import { blurbOf, firstName, homeOf, personalizeAll, personalizeText } from "./model/personalize.ts";

/** The learner's first name, or Nima. */
export const studentName = (): string => firstName(S.nick, S.profileName);
/** The hometown the learner gave, unless it is Tehran. */
export const homeCity = () => homeOf(S.profile);
/** Swaps Nima's name and Tahran in a story text for the learner's. */
export const personalizeStr = <T>(s: T, k?: string): T => personalizeText(s, k, studentName(), homeCity());
/** Only the learner's name, Tahran kept: how a recorded line is found (its clip leaves the name out but says Tahran). */
export const personalizeName = (s: string, k?: string): string => personalizeText(s, k, studentName(), null);
/** The same for a whole story document. */
export const personalize = (v: unknown, k?: string): unknown => personalizeAll(v, k, studentName(), homeCity());
/** What the AI tutor is told about the learner. */
export const learnerBlurb = (): string => blurbOf(studentName(), S.profile);
