// "Fix my mistakes" as the practice session sees it: start one, and pick the next saved fix. The two question types (`spot`,
// `fixit`) are the practice feature's (steps/Mistakes.tsx); they use these.
import { S } from "../../core/store.ts";
import { toast } from "../../ui/toast.ts";
import { startCustom } from "../practice/index.ts";
import { mistakes } from "./doc.ts";
import { type Mistake, pickMistake as pick } from "./model/mistakes.ts";

/** Starts a session of saved fixes (10 minutes unless told otherwise). */
export function startMistakes(mins?: number): void {
  if (!mistakes().length) { toast("No saved fixes yet. They come from “Try it” and your chats."); return; }
  startCustom(mins || 10, { kind: "mist", title: "Fix my mistakes", label: "Fix my mistakes" });
}

/** The next saved fix of the running session (none repeats until all were shown), or null. */
export function pickMistake(): Mistake | null {
  const s = S.session;
  s.usedM = s.usedM || new Set<string>();
  return pick(mistakes(), s.usedM);
}
