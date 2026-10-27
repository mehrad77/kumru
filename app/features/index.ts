// The feature list, in tab order. A new screen is a folder under features/ and one line here.
import { registerFeature, type WebFeature } from "../core/feature.ts";
import { feature as account } from "./account/index.ts";
import { feature as classes } from "./classes/index.ts";
import { feature as dev } from "./dev/index.ts";
import { feature as drills } from "./drills/index.ts";
import { feature as friends } from "./friends/index.ts";
import { feature as grammar } from "./grammar/index.ts";
import { feature as lab } from "./lab/index.ts";
import { feature as onboarding } from "./onboarding/index.ts";
import { feature as path } from "./path/index.ts";
import { feature as owner } from "./owner/index.ts";
import { feature as placement } from "./placement/index.ts";
import { feature as practice } from "./practice/index.ts";
import { feature as profile } from "./profile/index.ts";
import { feature as progress } from "./progress/index.ts";
import { feature as reminders } from "./reminders/index.ts";
import { feature as stories } from "./stories/index.ts";
import { feature as tutor } from "./tutor/index.ts";
import { feature as words } from "./words/index.ts";
import { feature as yeni } from "./yeni/index.ts";

const FEATURES: WebFeature[] = [progress, path, account, stories, lab, friends, classes, owner, yeni, words, reminders, placement, drills, grammar, practice, onboarding, tutor, profile, dev];

export function registerFeatures(): void {
  for (const f of FEATURES) registerFeature(f);
}
