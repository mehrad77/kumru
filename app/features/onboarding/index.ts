// The onboarding feature: the full-screen flow that welcomes a new learner (name, character, about, placement, goal, class,
// reminder) and that Profile reopens in parts (edit, retake placement). Also the learner's name and hometown as the stories and the
// tutor use them. No server half (it saves through the progress document). README.md lists what it owns.
import type { WebFeature } from "../../core/feature.ts";
import { setLearnerName } from "../../ui/avatar/index.ts";
import { maybeOnboard, openOnboarding } from "./open.ts";
import { studentName } from "./personalize.ts";

export { maybeOnboard, openOnboarding } from "./open.ts";
export { studentName, personalize, personalizeStr, learnerBlurb } from "./personalize.ts";
export { translitOffline } from "./model/names.ts";
export { normProfile, profileFallback, type Answers, type Profile } from "./model/profile.ts";

export const feature: WebFeature = {
  id: "onboarding",
  // /onboarding (and the old #onb) is the dev screen of the full flow
  // offered once the learner and their progress are known, after the first deep link has opened
  boot: { routed: maybeOnboard },
  open: { onb: { open: () => openOnboarding("full") } },
};

// the cast portraits are named for the learner (ui/avatar)
setLearnerName(studentName);

