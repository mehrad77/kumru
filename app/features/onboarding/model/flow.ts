// The onboarding flow's plain data: which steps each mode walks through, the defaults and the answers it collects. Pure.

/** full = a new learner; update = an existing learner, once (the path is new); edit = name, character, about (from Profile); place = retake the placement. */
export type Mode = "full" | "update" | "edit" | "place";
export type StepKey = "whatsnew" | "name" | "avatar" | "about" | "self" | "quiz" | "writing" | "result" | "class" | "remind" | "cast";

/** The version of the onboarding: a learner who has done an older one is shown the "update" flow once. */
export const ONB_V = 4;

export const ORDER: Record<Mode, StepKey[]> = {
  full: ["name", "avatar", "about", "self", "quiz", "writing", "result", "class", "remind", "cast"],
  // v4: the new character builder (the avatar step skips itself for a learner who already has a Sahne character)
  update: ["whatsnew", "avatar"],
  edit: ["name", "avatar", "about"],
  place: ["self", "quiz", "writing", "result"],
};

/** Classes offered to a new learner; the admin teaches both (worker/migrations/0005_suggested_classes.sql). */
export const ONB_CLASSES = [{ name: "504", code: "YK0504" }, { name: "506", code: "YK0506" }];

/** The "about you" questions: [key, question, placeholder]. Only the hometown is asked; job, hobby and why stay empty (the profile keeps the fields). */
export const ABOUT: [keyof About, string, string][] = [["city", "Where are you from?", "e.g. Shiraz"]];
export interface About { city: string; job: string; hobby: string; why: string }


/** What the writing sample came back with (the tutor's reading of it). */
export interface WritingResult { language: string; level: string; unit: number; sentences: { orig: string; fixed: string; ok: boolean; notes: { fa: string; en: string; lesson: string }[] }[] }
