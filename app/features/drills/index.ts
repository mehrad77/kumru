// The drills feature: the suffix drill engine (the drill table, question building, wrong options, explanations) and the picker sheet.
// No tab, no server half. The question screen of a drill session is the practice feature's (Drill.tsx).
import type { ComponentType } from "preact";
import type { WebFeature } from "../../core/feature.ts";
import { openIsland } from "../../ui/open.ts";

export { DT, drillChip, drillOptions, drillTally, drillVariants, drillWhy, lessonDrillStart, lessonDrillTypes, makeDrillQ, myDrills, pickDrillType, vgroup, vgroupOf, type DrillQ, type DrillType } from "./model/drills.ts";
export { startDrill } from "./start.ts";

export const feature: WebFeature = { id: "drills" };

/** The drill chips grid, for another feature to draw through `Lazy` (its index carries no Preact). */
export const loadDrillGrid = () => import("./DrillGrid.tsx").then((m) => m.DrillGrid as ComponentType<{ drills: import("./model/drills.ts").DrillType[]; onPick: (d: import("./model/drills.ts").DrillType) => void }>);

/** The picker sheet. `mins` is the session length (0 = no limit; default 10). */
export function openDrillSheet(mins?: number, opt: { lab?: boolean; verbs?: boolean } = {}): void {
  openIsland("Suffix drill", "Choose a drill", () => import("./DrillSheet.tsx").then((m) => m.DrillSheet), { mins: mins === 0 ? 0 : mins || 10, lab: !!opt.lab, verbs: !!opt.verbs });
}
