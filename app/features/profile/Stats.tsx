// The learner's numbers: four tiles, the activity calendar and the suffix skills practised. They are a page of their own, opened
// from the Stats card on Profile (`StatsCard`, which shows the short version).
import { local } from "../../core/local.ts";
import { S, redrawTick, signals } from "../../core/store.ts";
import { DT, myDrills } from "../drills/index.ts";
import { openLesson } from "../grammar/index.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { drillAcc, isKnown, myLevel, rev } from "../progress/index.ts";
import { calendar, WEEKS } from "./model/calendar.ts";
import { barColor, streakDays, totals } from "./model/stats.ts";
import { Icon } from "../../ui/Icon.tsx";
import { openPage } from "../../ui/page.ts";
import { Tile } from "./parts.tsx";

function Calendar() {
  const jal = signals.calMode.value !== "greg";
  const cal = calendar(S.days, jal);
  const pick = (v: string) => { S.calMode = v; local.set("cal", v); };
  return (
    <div class="card ipanel wide">
      <div class="ihead">
        <h3>Activity</h3>
        <div class="seg">
          {([["jal", "Jalali"], ["greg", "Gregorian"]] as const).map(([v, t]) => (
            <button type="button" aria-pressed={(jal ? "jal" : "greg") === v ? "true" : "false"} onClick={() => pick(v)}>{t}</button>
          ))}
        </div>
      </div>
      <div class="cal-wrap">
        <div class="cal">
          <span class="ml" />
          {cal.weekdays.map((t) => <span class="wdl">{t}</span>)}
          {cal.weeks.map((w) => (
            <>
              <span class="ml">{w.label}</span>
              {w.cells.map((c) => (c ? <span class={"d l" + c.level + (c.today ? " today" : "")} title={c.title} /> : <span class="d empty" />))}
            </>
          ))}
        </div>
      </div>
      <div class="legend-row">
        <span>{cal.total + " answers in the last " + WEEKS + " weeks · " + cal.active + " active days"}</span>
        <span class="cal-key">Less {[0, 1, 2, 3, 4].map((l) => <span class={"d l" + l} />)}More</span>
      </div>
    </div>
  );
}

function SkillRow({ label, k, lessonId }: { label: string; k: string; lessonId: string }) {
  const { t, acc } = drillAcc(k);
  const g = lessonId && (S.grammar as { id: string; order: number }[]).find((x) => x.id === lessonId);
  return (
    <div class="skill">
      <div class="sname">
        <span>{bidiTxt(label)}</span>
        {g ? <button class="linkish" type="button" onClick={() => openLesson(g.id)}>{"Lesson " + g.order}</button> : null}
      </div>
      <div class="bar"><span style={`width:${t ? Math.round(acc * 100) : 0}%;background:${barColor(acc)}`} /></div>
      <div class="meta">{t ? Math.round(acc * 100) + "% · " + t : "not tried"}</div>
    </div>
  );
}

/** The headline numbers: words known, answers and how many were right, active days and the streak. */
function numbers() {
  const t = totals(S.stats, S.drill, DT.map((x) => x.k));
  const answers = t.g + t.e + t.r + t.w + t.a, good = t.g + t.e + t.r;
  const known = ([...S.cards.values()] as { id: string; kind: string; retired?: boolean }[]).filter((c) => c.kind === "word" && !c.retired).filter(isKnown).length;
  const active = (Object.values(S.days) as number[]).filter((n) => n > 0).length;
  return { answers, good, known, active, streak: streakDays(S.days) };
}

/** Profile's Stats card: the short version, and the way to the page. */
export function StatsCard() {
  void rev.value;
  void redrawTick.value;
  const { answers, good, known, streak } = numbers();
  const bits = [known + " words", streak + "-day streak", ...(answers ? [Math.round((good / answers) * 100) + "% right"] : [])];
  return (
    <button class="card link-card" type="button" onClick={() => openPage("Stats", () => Promise.resolve(Stats), {}, "pf-page")}>
      <Icon name="target" class="link-ico" />
      <span class="link-t"><b>Stats</b><span class="hint">{bits.join(" · ")}</span></span>
      <Icon name="chev" />
    </button>
  );
}

export function Stats() {
  void rev.value;
  void redrawTick.value;
  const { answers, good, known, active, streak } = numbers();
  const skills = myDrills(myLevel()).map((d) => ({ d, ...drillAcc(d.k) })).filter((x) => x.t);
  return (
    <section>
      <div class="tiles">
        <Tile k="Words known" v={String(known)} s="at level 3 or higher" icon="book" />
        <Tile k="Accuracy" v={answers ? Math.round((good / answers) * 100) + "%" : "—"} s={answers + " answers"} bar={answers ? (good / answers) * 100 : null} icon="target" />
        <Tile k="Lessons learned" v={String(Object.keys(S.learned).length)} s={"of " + S.grammar.length} icon="bulb" />
        <Tile k="Active days" v={String(active)} s={streak + "-day streak"} icon="flame" />
      </div>
      <Calendar />
      {skills.length ? (
        <details class="more-stats">
          <summary>Suffix skills{" "}<span class="hint">{skills.length + " practised"}</span></summary>
          <div class="card ipanel wide">{skills.map((x) => <SkillRow label={x.d.label} k={x.d.k} lessonId={x.d.lesson} />)}</div>
        </details>
      ) : null}
    </section>
  );
}
