// The progress feature: the learner's progress as state, its document, saving and recording. No screen. Other features read
// `rev` and the signals in `state.ts` and call what is exported here; the server half is worker/features/progress (later step).
import type { WebFeature } from "../../core/feature.ts";
import { applyLocalCopy, mergeServerProgress } from "./boot.ts";

export { rev, touch } from "./state.ts";
export * from "./api.ts";

export const feature: WebFeature = {
  id: "progress",
  boot: { gated: (ctx) => { if (!ctx.gated) applyLocalCopy(); }, progress: mergeServerProgress },
};

