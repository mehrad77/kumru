// Kerim's line for the Path and the Profile header, from the learner's day (the rules are model/companion.ts).
import { S } from "../../core/store.ts";
import { currentStreak } from "../profile/index.ts";
import { xpToday } from "../progress/index.ts";
import { companionLine as lineFor } from "./model/companion.ts";

/** [mood, Turkish, Persian] */
export function companionLine(): [string, string, string] {
  return lineFor({
    name: S.nick || S.profileName || "", goal: S.prefs.goal || 20, today: xpToday(), streak: currentStreak(),
    started: Object.keys(S.stats).length > 0 || Object.keys(S.nd).length > 0, hour: new Date().getHours(),
  });
}
