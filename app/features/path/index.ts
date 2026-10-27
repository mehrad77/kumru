// The path feature: the Path tab (the learner's road: the skill tree's sections and the book's units, the next step, Review), its
// sheets (a unit's words, Review, a skill, what the steps mean, Jump here and Test out), the learner's place on the road. The session kinds (features/practice) ask this feature for a node's words and lessons; the Yeni
// İstanbul feature draws its book box in the `pathBanners` slot and asks for where each unit stands. README.md lists what it owns.
import type { WebFeature } from "../../core/feature.ts";
import { applyTreeSwitch, watchMigration } from "./course.ts";
import { closeUnits } from "./state.ts";

export { companionLine } from "./companion.ts";
export { bookPath, bookPathAct, bookPathReveal } from "./book.ts";
export {
  coreWords, nextUnitIdx, secLessons, secWords, skillReview, treePlacedWords, treeSecs, treeSync, treeSyncPos, treeWordIds, unitLessons, useTree, weakPool,
} from "./course.ts";
export { openReviewSheet } from "./sheets.ts";
export { closeUnits };

// ?tree / ?tree=0 is remembered before the router decides which tab to open
applyTreeSwitch();
watchMigration();

export const feature: WebFeature = {
  id: "path",
  tabs: [{ id: "path", label: "Path", icon: "map", order: 10, load: () => import("./PathTab.tsx").then((m) => m.PathTab) }],
  // the sections a learner unfolded fold again when they leave, so the Path always opens on the next step
  onLeave: (tab) => { if (tab !== "path") closeUnits(); },
};
