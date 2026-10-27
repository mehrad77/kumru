// Opening the Path's sheets. DOM only: the sheet (focus trap, inert background, Escape) appears at once, and its body is a Preact
// component in sheets/ that draws as soon as Preact and its chunk have loaded.
import type { ComponentType } from "preact";
import { openIsland } from "../../ui/open.ts";
import { unitLabel } from "../../lib/units.ts";
import { type FlowSec, type RoadUnit, buildTree, treeSecs } from "./course.ts";

function sheet<P extends object>(title: string, aria: string, load: () => Promise<ComponentType<P>>, props: P, cls?: string): void {
  const back = openIsland(title, aria, load, props);
  if (cls) back.querySelector(".sheet")?.classList.add(cls);
}

/** A unit's words and lessons. */
export const openUnitSheet = (lv: string, u: number): void =>
  sheet(lv + " · " + unitLabel(lv, u), "Unit " + u, () => import("./sheets/UnitSheet.tsx").then((m) => m.UnitSheet), { lv, u }, "us");

/** The Review sheet: what to practise for 5, 10 or 15 minutes. */
export const openReviewSheet = (): void => sheet("Review", "Review", () => import("./sheets/ReviewSheet.tsx").then((m) => m.ReviewSheet), {});

/** Every unit of the book with its word count: the way into the units' own word lists once the tree replaces the units. */
export const openBookSheet = (): void => sheet("Unit words", "Unit words", () => import("./sheets/BookSheet.tsx").then((m) => m.BookSheet), {}, "us");

/** "What do the steps mean?": one puck per state, drawn by the same code as the path. */
export const openPathLegend = (): void => sheet("What the steps mean", "What the steps mean", () => import("./sheets/Legend.tsx").then((m) => m.Legend), {});

/** A skill's sheet: continue it, practise its words, read its lessons, see its words. */
export const openSkillSheet = (x: FlowSec["skills"][number]): void =>
  sheet(x.sk.title, x.sk.title, () => import("./sheets/SkillSheet.tsx").then((m) => m.SkillSheet), { x }, "us");

/** Jump here: a locked unit opens only after a short adaptive check of the units being skipped (docs/PROGRESS.md, section 5). */
export const jumpHere = (x: RoadUnit): void =>
  sheet("Jump to " + x.lv + " Unit " + x.u + "?", "Jump to " + x.lv + " Unit " + x.u + "?", () => import("./sheets/JumpSheet.tsx").then((m) => m.JumpSheet), { x });

/** Test out: a locked section opens only after a short adaptive check of the sections being skipped (docs/PROGRESS.md, section 8). */
export function testOut(x: FlowSec): void {
  const secs = treeSecs(), cur = buildTree().cur;
  if (!cur) return;
  const C = secs.indexOf(cur.sec), T = secs.indexOf(x.sec);
  const title = "Test out of " + (T - C > 1 ? "sections " + secs[C].order + "–" + secs[T - 1].order : "section " + secs[C].order) + "?";
  sheet(title, title, () => import("./sheets/TestOutSheet.tsx").then((m) => m.TestOutSheet), { C, T });
}
