// The lesson page's "Try it" box as a node (the lesson page draws it with `BuiltNode`): a node, or null when the AI is not there or the
// learner turned the box off.
import { el } from "../../core/dom.ts";
import { S } from "../../core/store.ts";
import { mountInto } from "../../ui/open.ts";
import { aiReady } from "./ai.ts";
import type { Lesson } from "./model/prompts.ts";

export function tryItBox(lesson: Lesson): HTMLElement | null {
  if (!aiReady() || S.prefs.tryIt === false) return null;
  const host = el("div", { style: "display:contents" });
  void mountInto(host, () => import("./TryIt.tsx").then((m) => m.TryIt), { lesson });
  return host;
}
