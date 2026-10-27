// The Profile tab: who you are (the header), then two cards that open pages (your numbers, Stats.tsx; your notes, the words
// feature's), then a grid of settings cards. The cards are a slot (`profileCards`, core/slots.ts): the Account, Classes and
// Reminders cards, "My notes" and Notebook banner come from their own features, and this one fills the slot with the
// settings (Cards.tsx).
import "./profile.css";
import { useMemo } from "preact/hooks";
import { bidiTxt } from "../../core/i18n.ts";
import { myPortrait } from "../../ui/avatar/index.ts";
import { S, redrawTick } from "../../core/store.ts";
import { BuiltNode } from "../../ui/island.tsx";
import { pupLine } from "../../ui/kerim/kerim.ts";
import { Icon } from "../../ui/Icon.tsx";
import { Slot } from "../../ui/Slot.tsx";
import { openOnboarding } from "../onboarding/index.ts";
import { companionLine } from "../path/index.ts";
import { rev } from "../progress/index.ts";
import { streakDays } from "./model/stats.ts";
import { StatsCard } from "./Stats.tsx";

interface Fact { tr?: string; raw?: string }

function Head() {
  void rev.value;
  const tick = redrawTick.value;
  const p = S.profile as Record<string, Fact | undefined> | null;
  const bits = p ? [p.city, p.job, p.hobby].filter(Boolean).map((x) => (x as Fact).tr || (x as Fact).raw).join(" · ") : "";
  const name: string = S.nick || S.profileName || "";
  const streak = streakDays(S.days);
  // the portrait and Kerim's line are DOM-built (avatar facade, the path's companion line)
  const portrait = useMemo(() => () => myPortrait(96, "ring"), [tick, S.char]);
  const line = useMemo(() => () => { const [mood, tr, fa] = companionLine(); return pupLine(mood, tr, fa); }, [tick]);
  return (
    <section class="card pf-head">
      <BuiltNode render={portrait} contents />
      <div class="pf-who">
        <h1>{bidiTxt(name || "Welcome")}</h1>
        {S.profileName ? <p class="pf-un" dir="ltr">{"@" + S.profileName}</p> : null}
        <p class="hint">{bidiTxt(bits || "Add your name, your character and a few things about you.")}</p>
        <div class="pf-meta">
          <span class="pchip mid"><Icon name="spark" class="bi" />{(S.xp || 0) + " XP"}</span>
          {streak ? <span class="pchip hot"><Icon name="flame" class="bi" />{streak + "-day streak"}</span> : null}
          {S.pos ? <span class="pchip new"><Icon name="target" class="bi" />{S.pos.lv + " · Unit " + S.pos.u}</span> : null}
        </div>
        <BuiltNode render={line} contents />
      </div>
      <button class="btn sm" type="button" onClick={() => openOnboarding("edit")}>Edit</button>
    </section>
  );
}

export function ProfileTab() {
  return (
    <>
      <Head />
      <div class="set-grid">
        <StatsCard />
        <Slot name="profileCards" />
      </div>
    </>
  );
}
