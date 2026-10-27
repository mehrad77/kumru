// What the runner shows, as signals. The imperative API in engine.ts writes them; Runner.tsx and Foot.tsx read them. Only signals-core
// here, so the entry chunk can carry the engine without Preact.
import { signal } from "@preact/signals-core";
import type { Foot, Progress, View } from "./types.ts";

/** The body of the screen. */
export const view = signal<View>({ t: "none" });
/** The footer. */
export const foot = signal<Foot>({ t: "none" });
/** The top bar. */
export const progress = signal<Progress>({ count: "", pct: 0, now: 0, max: 0 });
