// The stats pill at the top of the Path: days in a row, XP today against the goal (the ring), all your XP. It melts into the app bar
// on scroll (melt.ts); its body and drips are `.pt-goo`, which an SVG goo filter (#ptGoo in index.html) blends.
import { S } from "../../core/store.ts";
import { Icon } from "../../ui/Icon.tsx";
import { Ring } from "../../ui/Ring.tsx";
import { currentStreak } from "../profile/index.ts";
import { xpToday } from "../progress/index.ts";

export function TopBar() {
  const goal = S.prefs.goal || 20, today = xpToday(), stk = currentStreak();
  return (
    <div class="pt-top card">
      <div class="pt-goo" aria-hidden="true"><b /><i /><i /></div>
      <div class="pt-stat" title="Days in a row"><Icon name="flame" class="pt-ico flame" /><b>{String(stk)}</b><span class="hint">{stk === 1 ? "day" : "days"}</span></div>
      <div class="pt-stat goal" title="XP today"><Ring v={today} max={goal} small /><b>{today + " / " + goal}</b><span class="hint">XP today</span></div>
      <div class="pt-stat" title="All your XP"><Icon name="spark" class="pt-ico xp" /><b>{String(S.xp || 0)}</b><span class="hint">XP</span></div>
    </div>
  );
}
