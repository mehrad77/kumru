// The session screen (#session): the top bar with its close button and progress, the question, the footer; and the keyboard
// (Enter checks or continues, 1 to 4 pick an answer, Escape ends the session).
import { useEffect } from "preact/hooks";
import { S } from "../../core/store.ts";
import { Icon } from "../../ui/Icon.tsx";
import { closeSession, foot, next, progress, view } from "./engine.ts";
import { Foot } from "./Foot.tsx";
import type { Prep } from "./prepare.ts";
import { endSession } from "./session.ts";
import type { Step } from "./types.ts";
import { Build } from "./steps/Build.tsx";
import { Choice } from "./steps/Choice.tsx";
import { Drill } from "./steps/Drill.tsx";
import { Flash } from "./steps/Flash.tsx";
import { Learn } from "./steps/Learn.tsx";
import { CardQ, Intro, LessonDone, LiteCard, Read } from "./steps/Lesson.tsx";
import { Match } from "./steps/Match.tsx";
import { AllFixed, Fixit, Spot } from "./steps/Mistakes.tsx";
import { Report } from "./steps/Report.tsx";
import { TypeStep } from "./steps/Type.tsx";
import "./practice.css";

function Question({ p, st }: { p: Prep; st: Step }) {
  switch (p.type) {
    case "flash": return <Flash p={p} st={st} />;
    case "choice": return <Choice p={p} st={st} />;
    case "type": return <TypeStep p={p} st={st} />;
    case "match": return <Match p={p} st={st} />;
    case "build": return <Build p={p} st={st} />;
    case "drill": return <Drill p={p} st={st} />;
    case "learn": return <Learn p={p} />;
    case "spot": return <Spot p={p} st={st} />;
    case "fixit": return <Fixit p={p} st={st} />;
    case "allfixed": return <AllFixed />;
    case "intro": return <Intro p={p} />;
    case "read": return <Read p={p} />;
    case "card": return <LiteCard p={p} />;
    case "cardq": return <CardQ p={p} />;
    case "lessondone": return <LessonDone p={p} />;
    case "report": return <Report p={p} />;
  }
}

/* Enter = Check or Continue (a focused button handles Enter itself), 1 to 4 = the nth answer, Escape = end the session */
function onKey(e: KeyboardEvent): void {
  if (!S.session) return;
  const tag = (e.target as HTMLElement).tagName;
  if (e.key === "Enter" && tag !== "BUTTON") {
    const f = foot.value;
    const go = f.t === "check" ? (f.ready ? f.run : null) : f.t === "fb" ? next : f.t === "rate" ? () => f.rate("g", "right") : null;
    if (go) { e.preventDefault(); go(); }
  } else if (/^[1-4]$/.test(e.key) && tag !== "INPUT") {
    const c = document.querySelectorAll<HTMLButtonElement>("#session .choice")[+e.key - 1];
    if (c && !c.disabled) c.click();
  } else if (e.key === "Escape") endSession();
}

export function Runner() {
  const v = view.value, p = progress.value;
  useEffect(() => {
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <div class="s-top">
        <button class="s-close" type="button" aria-label="End session" onClick={() => { if (!closeSession()) endSession(); }}><Icon name="close" /></button>
        <div class="s-bar" role="progressbar" aria-valuemin={0} aria-valuemax={p.max} aria-valuenow={p.now}><span style={"width:" + p.pct + "%"} /></div>
        <div class="s-count">{p.count}</div>
      </div>
      {v.t === "step" ? <div class="s-body" key={v.n}><Question p={v.prep} st={v.st} /></div> : null}
      <Foot />
    </>
  );
}
