// The placement feature: the adaptive check of words and suffixes that finds where a learner starts (onboarding's quiz step) or
// whether they may skip ahead (the Path's Jump here and Test out). The climb is a binary search over units (or tree sections).
// No screen of its own and no server half. README.md lists what it owns and what the legacy page still calls.
import type { WebFeature } from "../../core/feature.ts";

export { PL_SELF, plNudge } from "./model/placement.ts";
export { applyPlacement, scoreRecs, type PlacementInput, type PlacementResult, type Recs } from "./apply.ts";
export { plSectionItems } from "./items.ts";
/** The quiz component, for another feature to draw (this index carries no Preact). */
export const loadClimb = () => import("./Climb.tsx").then((m) => m.Climb);

export const feature: WebFeature = { id: "placement" };
