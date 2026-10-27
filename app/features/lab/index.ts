// The Lab feature: Kerim's Lab, the tab between Stories and Friends for practice the learner chooses (decks, the question-type gym,
// Prove it, the verb gym, the listening lab). It shows to editors and to anyone who opened the page with ?lab. Practice starts
// through the practice feature (startCustom). README.md lists what it owns and what it owns.
import type { WebFeature } from "../../core/feature.ts";
import { BOOT } from "../../core/router.ts";
import { toast } from "../../ui/toast.ts";
import { applyLabSwitch, labOn } from "./access.ts";

export { labOn } from "./access.ts";

// ?lab / ?lab=0 is remembered before the router decides which tab to open
applyLabSwitch();

export const feature: WebFeature = {
  id: "lab",
  boot: { identity: () => { if (BOOT.tab === "lab" && !labOn()) toast("Kerim's Lab isn't open on this account."); } },
  tabs: [{ id: "lab", label: "Lab", icon: "flask", order: 30, when: labOn, load: () => import("./LabTab.tsx").then((m) => m.LabTab) }],
};

