// The reader's settings, on this device (`kumru:story:*`): shown in the Profile's Stories card (Settings.tsx) and read by the
// reader each time a story opens.
import { local } from "../../core/local.ts";

export const pref = (k: string, d: boolean): boolean => local.get("story:" + k, d ? "1" : "0") === "1";
export const setPref = (k: string, v: boolean): void => local.set("story:" + k, v ? "1" : "0");

/**
 * Bubbles on stage: `auto` (sideways or a wide screen), `theatre` (always) or `log` (never; the lines only in the log). Kept under
 * `story:view2`: the first version's `story:view` is no longer read, so every device starts again on Auto.
 */
export type StoryView = "auto" | "theatre" | "log";
export const storyView = (): StoryView => {
  const v = local.get("story:view2", "auto");
  return v === "theatre" || v === "log" ? v : "auto";
};
export const setStoryView = (v: StoryView): void => local.set("story:view2", v);
