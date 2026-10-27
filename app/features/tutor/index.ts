// The tutor feature: the AI tutor and what it keeps. AI access (the host has none on Kumru's Worker, so the offline paths run),
// the sentence checker behind the lesson page's "Try it", the tutor's private document with the saved fixes, "Fix my mistakes", the
// writing helpers onboarding needs (a Persian name in Latin letters, the profile, the placement sample) and the editors' tutor lab.
// No tab, no server half beyond the `tutor` document and the `/api/ai` stub. README.md lists what it owns.
import type { ComponentType } from "preact";
import type { WebFeature } from "../../core/feature.ts";
import { rerender } from "../../core/router.ts";
import { initAI } from "./ai.ts";
import { loadTutorDoc } from "./doc.ts";

export { aiErrText, aiReady, aiState, aiStatus, initAI, type AiState } from "./ai.ts";
export { buildProfile, checkPlacement, checkSentence, translitName } from "./check.ts";
export { addMistake, loadTutorDoc, mistakeSeen, mistakes, recordCheck, saveTutorDoc, seedPlacementMistakes } from "./doc.ts";
export { openTutorLab } from "./lab.ts";
export { pickMistake, startMistakes } from "./session.ts";
export { sameSent } from "./model/diff.ts";
export type { Mistake } from "./model/mistakes.ts";
export { tryItBox } from "./tryit.ts";
export type { PlaceResult } from "./model/prompts.ts";

/** The correction pieces as Preact components, for another feature to draw through `Lazy` (this index carries no Preact). */
export const loadExplain = () => import("./parts.tsx").then((m) => m.Explain as ComponentType<{ fa?: string; en?: string; cls?: string }>);
export const loadFixNote = () => import("./parts.tsx").then((m) => m.FixNote as ComponentType<{ m: import("./model/mistakes.ts").Mistake }>);

export const feature: WebFeature = {
  id: "tutor",
  boot: { gated: (ctx) => { if (!ctx.gated) initAI(); }, progress: () => { void loadTutorDoc().then(() => rerender()); } },
};

