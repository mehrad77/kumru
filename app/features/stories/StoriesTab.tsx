// The Stories tab, the home tab: every story out so far as a timeline, week by week, each with its opening scene. The learner's
// next story (the first unfinished one: the stories open in order) is drawn large with Read, and the tab opens scrolled to it;
// the ones after it are locked, today's is marked, and the one coming tomorrow closes the line. Translations follow the help
// language. Before Season 1 opens (state.ts) learners see the "coming" card; editors and ?stories see everything, drafts marked.
import "./stories.css";
import { useEffect } from "preact/hooks";
import { faTxt } from "../../core/i18n.ts";
import { helpLangs } from "../../core/lang.ts";
import { redrawTick, signals } from "../../core/store.ts";
import { pup } from "../../ui/kerim/kerim.ts";
import { BuiltNode } from "../../ui/island.tsx";
import { Icon } from "../../ui/Icon.tsx";
import { toast } from "../../ui/toast.ts";
import { personalizeStr } from "../onboarding/index.ts";
import { openStory } from "./open.ts";
import { launched, loadStories, loaded, nextStory, openStories, preview, readable, record, thumbBase, today, upcoming, type Story } from "./state.ts";
import { Thumb } from "./Thumb.tsx";
import { SEASON_LAUNCH } from "../../../shared/stories.ts";

const kerim = (mood: "happy" | "idle") => () => pup(mood, 88, { pose: "flying", enter: false, label: "Kerim" });

function Coming() {
  const d = new Date(SEASON_LAUNCH[1] + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  return (
    <div class="st-soon">
      <h1>Stories</h1>
      <div class="empty">
        <BuiltNode render={kerim("happy")} />
        <p lang="tr">Yeni hikâyeler geliyor.</p>
        <p>Kerim's stories open on {d}: a newcomer's first weeks in Istanbul, and you are the newcomer.</p>
        <p lang="fa" dir="rtl">داستان‌های تازه در راه است.</p>
      </div>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return <span class="st-stars" aria-label={`${n} of 3 stars`}>{[1, 2, 3].map((i) => <i class={i <= n ? "on" : ""} />)}</span>;
}

/** A title (or summary) in Turkish with the help language's translations under it. */
function Titles({ s }: { s: Story }) {
  const H = helpLangs();
  return (
    <span class="st-ent-t">
      <b lang="tr">{personalizeStr(s.title, "tr")}</b>
      {H.en && s.titleEn ? <small>{personalizeStr(s.titleEn, "en")}</small> : null}
      {H.fa && s.titleFa ? <small class="fa" lang="fa" dir="rtl">{faTxt(personalizeStr(s.titleFa, "fa"))}</small> : null}
    </span>
  );
}

const Chips = ({ s, isToday }: { s: Story; isToday: boolean }) => (
  <>
    {isToday ? <span class="pchip st-today-chip">Bugün · Today</span> : null}
    {s.kind === "special" ? <span class="pchip">Special</span> : null}
    {s.draft ? <span class="pchip new">Draft</span> : null}
  </>
);

/** The learner's next story, drawn large in its place on the line. */
function Next({ s, n, isToday }: { s: Story; n: number; isToday: boolean }) {
  const H = helpLangs(), r = record(s.id);
  return (
    <li class={"st-ent next" + (isToday ? " today" : "")} id={"st-" + s.id}>
      <div class="card st-next">
        <button class="st-next-pic" type="button" aria-label={"Read " + personalizeStr(s.title, "tr")} onClick={() => openStory(s.id)}><Thumb id={s.id} cls="big" eager /></button>
        <div class="st-next-meta"><small>{r.reads ? "Pick up where you left off" : "Next for you"} · Bölüm {n}</small><Chips s={s} isToday={isToday} /></div>
        <Titles s={s} />
        {H.en && s.summary ? <p>{personalizeStr(s.summary, "en")}</p> : null}
        {H.fa && s.summaryFa ? <p class="fa" lang="fa" dir="rtl">{faTxt(personalizeStr(s.summaryFa, "fa"))}</p> : null}
        <button class="btn primary block" type="button" onClick={() => openStory(s.id)}>Read{H.fa ? <span class="fa" lang="fa" dir="rtl">بخوان</span> : null}</button>
      </div>
    </li>
  );
}

function Entry({ s, n, isToday }: { s: Story; n: number; isToday: boolean }) {
  const r = record(s.id), open = readable(s.id);
  const state = r.done ? "done" : open ? "open" : "locked";
  return (
    <li class={"st-ent " + state + (isToday ? " today" : "")} id={"st-" + s.id}>
      <button class="st-row" type="button" aria-disabled={open ? undefined : "true"} onClick={() => openStory(s.id)}>
        <Thumb id={s.id} />
        <span class="st-ent-b">
          <small class="st-ent-n">Bölüm {n} <Chips s={s} isToday={isToday} /></small>
          <Titles s={s} />
        </span>
        <span class="st-ent-m">{r.done ? <Stars n={r.stars ?? 1} /> : open ? <Icon name="chev" /> : <Icon name="lock" />}</span>
      </button>
    </li>
  );
}

function Upcoming({ s, n }: { s: Story; n: number }) {
  const d = new Date(s.releaseDate + "T12:00:00Z"), t = new Date(today() + "T12:00:00Z");
  const when = d.getTime() - t.getTime() <= 86_400_000 ? "Yarın · Tomorrow" : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return (
    <li class="st-ent soon">
      <button class="st-row" type="button" aria-disabled="true" onClick={() => toast(`Bölüm ${n} comes out ${when.includes("Tomorrow") ? "tomorrow" : "on " + when}.`)}>
        <span class="st-th" aria-hidden="true"><Icon name="clock" /></span>
        <span class="st-ent-b"><small class="st-ent-n">Bölüm {n} <span class="pchip">{when}</span></small><span class="st-ent-t"><b>A new story</b><small>Kerim is still writing it.</small></span></span>
      </button>
    </li>
  );
}

let shown = false;
/** Once each time the tab is opened: the learner's next story in the middle of the screen (the last one when all are read). */
function toNext(tab: string, id: string | null): void {
  if (tab !== "stories") { shown = false; return; }
  if (shown || !id) return;
  shown = true;
  requestAnimationFrame(() => document.getElementById("st-" + id)?.scrollIntoView({ block: "center" }));
}

export function StoriesTab() {
  void redrawTick.value; void thumbBase.value;
  const tab = signals.tab.value;
  const ready = loaded.value && (launched() || preview());
  const list = ready ? openStories() : [], next = ready ? nextStory() : null, soon = ready ? upcoming() : null;
  useEffect(() => { toNext(tab, next?.id ?? list[list.length - 1]?.id ?? null); });
  if (!loaded.value) { void loadStories(); return <div class="st-soon"><h1>Stories</h1><p class="hint">Loading…</p></div>; }
  if (!ready) return <Coming />;
  const H = helpLangs(), day = today();
  const weeks: { arc: Story["arc"]; items: Story[] }[] = [];
  for (const s of list) {
    const w = weeks.find((x) => x.arc?.id === s.arc?.id);
    if (w) w.items.push(s); else weeks.push({ arc: s.arc, items: [s] });
  }
  if (soon) { const w = weeks.find((x) => x.arc?.id === soon.arc?.id); if (!w) weeks.push({ arc: soon.arc, items: [] }); }
  const done = list.filter((s) => record(s.id).done).length;
  const num = (s: Story) => list.indexOf(s) + 1;
  return (
    <div class="st-tab">
      <h1>Hikâyeler <small>Stories · {done}/{list.length}</small></h1>
      {!launched() ? <p class="hint">Preview: learners see these from {SEASON_LAUNCH[1]}.</p> : null}
      {!next && list.length ? <div class="empty"><BuiltNode render={kerim("happy")} /><p>You've read every story. Aferin!</p></div> : null}
      <ol class="st-tl">
        {weeks.map((w) => (
          <>
            <li class="st-wk">
              <h2><span lang="tr">{w.arc?.tr}</span>{H.en && w.arc?.en ? <small>{w.arc.en}</small> : null}{H.fa && w.arc?.fa ? <small class="fa" lang="fa" dir="rtl">{w.arc.fa}</small> : null}</h2>
            </li>
            {w.items.map((s) => (s === next ? <Next s={s} n={num(s)} isToday={s.releaseDate === day} /> : <Entry s={s} n={num(s)} isToday={s.releaseDate === day} />))}
            {soon && soon.arc?.id === w.arc?.id ? <Upcoming s={soon} n={list.length + 1} /> : null}
          </>
        ))}
      </ol>
    </div>
  );
}
