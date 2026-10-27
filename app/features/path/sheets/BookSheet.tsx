// Every unit of the book with its word count.
import "../path.css";
import { idxUnit, unitLabel } from "../../../lib/units.ts";
import { closeSheet } from "../../../ui/sheet.ts";
import { Icon } from "../../../ui/Icon.tsx";
import { unitInfo } from "../../practice/index.ts";
import { openUnitSheet } from "../sheets.ts";

export function BookSheet() {
  const rows = [];
  for (let i = 0; i < 18; i++) {
    const { lv, u } = idxUnit(i), x = unitInfo(lv, u);
    if (!x.n && !x.lessons) continue;
    rows.push(
      <button class="us-l" type="button" onClick={() => { closeSheet(); openUnitSheet(lv, u); }}>
        <span class="num">{String(u)}</span>
        <span class="lt"><span class="ttl">{lv + " · " + unitLabel(lv, u)}</span><span class="hint">{x.known + "/" + x.n + " words known"}</span></span>
        <Icon name="chev" class="go" />
      </button>,
    );
  }
  return (
    <>
      <p class="hint" style="margin:0 4px 8px">The words of each unit of the book, for use in class.</p>
      <div class="us-body">{rows}</div>
    </>
  );
}
