// Small pieces the Profile's components share: a tile of the stats row.
import type { IconName } from "../../core/dom.ts";
import { Icon } from "../../ui/Icon.tsx";

/** One number in the stats row: a label, the value, an optional bar (percent) and a line under it. */
export function Tile({ k, v, s, bar, icon }: { k: string; v: string; s?: string; bar?: number | null; icon?: IconName }) {
  return (
    <div class="card tile">
      <div class="k">{icon ? <Icon name={icon} class="tile-ic" /> : null}{k}</div>
      <div class="v">{v}</div>
      {bar != null ? <div class="minibar"><span style={"width:" + Math.min(100, bar) + "%"} /></div> : null}
      {s ? <div class="s">{s}</div> : null}
    </div>
  );
}
