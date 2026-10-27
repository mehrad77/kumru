// The grid of drill chips (a drill's name and how it is going) that the picker sheet and the Lab's verb gym both show.
import { bidiTxt } from "../../core/i18n.ts";
import { drillAcc } from "../progress/index.ts";
import { drillChip, type DrillType } from "./model/drills.ts";
import "./drills.css";

export function DrillGrid({ drills, onPick }: { drills: DrillType[]; onPick: (d: DrillType) => void }) {
  return (
    <div class="dgrid">
      {drills.map((d) => {
        const { t, acc } = drillAcc(d.k), chip = drillChip(t, acc);
        return (
          <button class="dchip" type="button" onClick={() => onPick(d)}>
            <span class="dn">{bidiTxt(d.label)}</span><span class={chip.cls}>{chip.text}</span>
          </button>
        );
      })}
    </div>
  );
}
