// The suffix-drill picker: "Mixed · weakest first", then the noun drills and the verb drills the learner's level has.
import { useEffect, useRef } from "preact/hooks";
import { closeSheet } from "../../ui/sheet.ts";
import { myLevel } from "../progress/index.ts";
import { DrillGrid } from "./DrillGrid.tsx";
import { startDrillSession } from "./start.ts";
import { myDrills } from "./model/drills.ts";

export interface DrillSheetProps { mins: number; lab?: boolean; verbs?: boolean }

export function DrillSheet({ mins, lab, verbs }: DrillSheetProps) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { const t = setTimeout(() => first.current?.focus(), 30); return () => clearTimeout(t); }, []);
  const all = myDrills(myLevel());
  const go = (k: string) => { closeSheet(); startDrillSession(mins, k, { lab, verbs }); };
  return (
    <>
      <button ref={first} class="btn primary block" type="button" onClick={() => go("")}>Mixed · weakest first</button>
      <span class="lbl">Nouns</span>
      <DrillGrid drills={all.filter((d) => !d.verb)} onPick={(d) => go(d.k)} />
      <span class="lbl">Verbs</span>
      <DrillGrid drills={all.filter((d) => d.verb)} onPick={(d) => go(d.k)} />
    </>
  );
}
