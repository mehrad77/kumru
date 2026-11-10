// The onboarding flow's plain data: which steps each mode walks through, the defaults and the answers it collects. Pure.

/** full = a new learner; update = an existing learner, once (the character is new); edit = name, character, hometown (from Profile); place = retake the placement (from Profile). */
export type Mode = "full" | "update" | "edit" | "place";
/** The character's steps: one per section of Sahne's builder, the live character always on top (steps/Character.tsx). */
export const CHAR_SCREENS = ["body", "face", "hair", "clothes", "extras"] as const;
export type CharScreen = (typeof CHAR_SCREENS)[number];
export type StepKey = "whatsnew" | "lang" | "name" | CharScreen | "home" | "self" | "quiz" | "writing" | "result" | "class" | "remind" | "cast";

export { ONB_V } from "./version.ts";

/** The steps of each mode. A new learner's onboarding is about the stories: no level or path step (Profile's "Retake" is the
 *  placement, `place`). */
export const ORDER: Record<Mode, StepKey[]> = {
  full: ["lang", "name", ...CHAR_SCREENS, "home", "class", "remind", "cast"],
  // the character screens skip themselves for a learner who already has a Sahne character
  update: ["whatsnew", ...CHAR_SCREENS],
  edit: ["name", ...CHAR_SCREENS, "home"],
  place: ["self", "quiz", "writing", "result"],
};

/** Classes offered to a new learner; the admin teaches both (worker/migrations/0005_suggested_classes.sql). */
export const ONB_CLASSES = [{ name: "504", code: "YK0504" }, { name: "506", code: "YK0506" }];

/** The profile's "about you" fields. Only the hometown is asked; job, hobby and why stay empty. */
export interface About { city: string; job: string; hobby: string; why: string }

/** What the writing sample came back with (the tutor's reading of it). */
export interface WritingResult { language: string; level: string; unit: number; sentences: { orig: string; fixed: string; ok: boolean; notes: { fa: string; en: string; lesson: string }[] }[] }
