// "Try it yourself" on a lesson page: the learner writes one sentence in Turkish, the AI tutor checks it and shows the fix,
// the notes and a link to the lesson. Wrong Turkish sentences join the tutor's saved fixes (doc.ts). Hidden without the AI.
import { useRef, useState } from "preact/hooks";
import { bidiTxt } from "../../core/i18n.ts";
import { local } from "../../core/local.ts";
import { Pup } from "../../ui/Pup.tsx";
import { SpeakBtn } from "../../ui/Speak.tsx";
import { Mic } from "../../ui/TypeAids.tsx";
import { aiErrText, aiStatus } from "./ai.ts";
import { checkSentence } from "./check.ts";
import { recordCheck } from "./doc.ts";
import { wordDiff } from "./model/diff.ts";
import type { CheckResult, Lesson } from "./model/prompts.ts";
import { DiffLine, Explain, LessonLink } from "./parts.tsx";
import "./tutor.css";
import { meaningLang } from "../../core/lang.ts";

type Out = { k: "wait" } | { k: "res"; r: CheckResult; text: string } | { k: "err"; m: string } | null;

/** The task in the learner's language(s). */
const taskText = (p: { task_fa?: string; task_en?: string }): string => {
  const L = meaningLang();
  return (L === "en" ? p.task_en : L === "both" ? p.task_fa + " · " + p.task_en : p.task_fa) || "";
};

export function TryIt({ lesson }: { lesson: Lesson }) {
  const p = lesson.practice || { task_tr: "Bu dersle bir cümle yaz.", task_fa: "با این درس یک جمله بنویس.", task_en: "Write a sentence using this lesson.", target: lesson.title };
  const box = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(""), [out, setOut] = useState<Out>(null), [busy, setBusy] = useState<AbortController | null>(null);
  const [info, setInfo] = useState(local.get("aiInfo", "") !== "1");
  // a host that withdraws the AI takes the box away
  if (aiStatus.value !== "ready") return null;
  const go = async () => {
    const t = text.trim();
    if (!t || busy) return;
    const ctl = new AbortController();
    setBusy(ctl);
    setOut({ k: "wait" });
    try {
      const r = await checkSentence(lesson, t, { signal: ctl.signal });
      local.set("aiInfo", "1");
      setInfo(false);
      setOut({ k: "res", r, text: t });
      void recordCheck(lesson, t, r);
    } catch (e) {
      const m = aiErrText(e);
      setOut(m ? { k: "err", m } : null);
    } finally {
      setBusy(null);
    }
  };
  const en = meaningLang() === "en";
  return (
    <section class="try-box">
      <div class="try-top"><span class="lbl">Try it yourself</span><span class="pill ai-pill">AI</span></div>
      <div class="try-task"><b lang="tr">{bidiTxt(p.task_tr || "")}</b><span class="hint" lang={en ? "en" : "fa"} dir={en ? undefined : "auto"}>{bidiTxt(taskText(p))}</span></div>
      <div class="type-row">
        <textarea
          ref={box} class="try-in" rows={2} lang="tr" dir="auto" maxLength={300} placeholder="Türkçe yaz…" aria-label="Your sentence" autocapitalize="sentences" spellcheck={false}
          value={text} onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void go(); } }}
        />
        <Mic box={box} />
      </div>
      <div class="try-act">
        <button class="btn primary" type="button" disabled={!!busy || !text.trim()} onClick={() => void go()}>Check</button>
        <button class="btn ghost" type="button" hidden={!busy} onClick={() => busy?.abort()}>Stop</button>
      </div>
      <p class="hint try-info" hidden={!info}>Checks use the AI tutor.</p>
      <div class="try-out" aria-live="polite">
        {out?.k === "wait" ? (
          <div class="try-wait"><Pup mood="think" size={54} /><div class="tw-col"><span>The tutor is checking…</span><div class="think-bar"><span /></div></div></div>
        ) : out?.k === "err" ? (
          <div class="try-err">{out.m}</div>
        ) : out?.k === "res" ? (
          <Result r={out.r} text={out.text} lesson={lesson} target={p.target || ""} again={() => { setText(""); setOut(null); box.current?.focus(); }} />
        ) : null}
      </div>
    </section>
  );
}

function Result({ r, text, lesson, target, again }: { r: CheckResult; text: string; lesson: Lesson; target: string; again: () => void }) {
  const { src, dst } = wordDiff(text, r.corrected);
  return (
    <>
      {r.ok ? (
        <div class="try-h ok"><Pup mood="cheer" size={54} /><div><b lang="tr">{bidiTxt(r.praise || "Harika!")}</b><span class="hint">{bidiTxt(r.usesTarget ? "Correct, and you used the target grammar." : "Correct! Now try it with: " + target)}</span></div></div>
      ) : (
        <div class="try-h fix"><Pup mood="happy" size={54} /><div><b lang="tr">{bidiTxt(r.praise || "Az kaldı!")}</b><span class="hint">{r.language !== "tr" ? "Here's how to say it in Turkish:" : "Almost. Here's the fix:"}</span></div></div>
      )}
      {!r.ok && r.language === "tr" ? (
        <div class="try-diff">
          <div><span class="lbl">You wrote</span><DiffLine parts={src} mark="del" /></div>
          <div><span class="lbl">Better</span><DiffLine parts={dst} mark="ins" /><SpeakBtn text={r.corrected} /></div>
        </div>
      ) : null}
      {!r.ok && r.language !== "tr" ? (
        <div class="try-diff"><div><span class="lbl">In Turkish</span><span class="dline" lang="tr">{bidiTxt(r.corrected)}</span><SpeakBtn text={r.corrected} /></div></div>
      ) : null}
      {r.notes.map((n) => <div class="try-note"><Explain fa={n.fa} en={n.en} />{n.lesson && n.lesson !== lesson.id ? <LessonLink id={n.lesson} /> : null}</div>)}
      <button class="linkish" type="button" onClick={again}>Try another sentence</button>
    </>
  );
}
