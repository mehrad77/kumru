// The friends feature: one public profile per learner, follows (two learners who follow each other are friends), cheers, the weekly
// leaderboard and invite links. The Friends tab, a learner's sheet, the badge on the tab bar. Server half: worker/features/friends;
// contract: shared/friends.ts; routes: docs/SPECS_API.md section 6. README.md lists what it owns.
import type { WebFeature } from "../../core/feature.ts";
import { addSaveHook } from "../progress/index.ts";
import { saveProfileSoon, start } from "./actions.ts";

export { addProfiles } from "./actions.ts";
export { openFriendSheet, type SheetExtra } from "./sheet.ts";

export const feature: WebFeature = {
  id: "friends",
  // loads Friends, opens a /@name link that names this learner, then acts on invite links
  boot: { identity: start },
  tabs: [{ id: "friends", label: "Friends", icon: "users", order: 40, load: () => import("./FriendsTab.tsx").then((m) => m.FriendsTab) }],
};

// a saved progress document refreshes my public profile (the book summary rides along: features/yeni)
addSaveHook({ saved: saveProfileSoon });

