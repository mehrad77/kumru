// The name step: what the stories call the learner. A name in Persian letters is turned into Latin ones (so Turkish endings fit it);
// the tutor suggests spellings when it can, else a rough offline guess.
import { useEffect, useRef, useState } from "preact/hooks";
import { renderUser } from "../../../core/shell/appbar.ts";
import { S } from "../../../core/store.ts";
import { Pup } from "../../../ui/Pup.tsx";
import { saveProgress } from "../../progress/index.ts";
import { cap, hasFa, nameSuffix } from "../model/names.ts";
import { Next, Skip, StepView, useFlow } from "../Flow.tsx";
import { aiState, translitName } from "../../tutor/index.ts";

export function NameStep() {
  const { O, first, go } = useFlow();
  const [v, setV] = useState(O.name), [sug, setSug] = useState<{ label: string; list: string[] } | null>(null);
  const box = useRef<HTMLInputElement>(null);
  const t = v.trim(), bad = !t || hasFa(t);
  useEffect(() => { const h = setTimeout(() => box.current?.focus(), 50); return () => clearTimeout(h); }, []);
  // a Persian name: after a pause, ask for Latin spellings (the tutor's, or the offline guess)
  useEffect(() => {
    setSug(null);
    if (!t || !hasFa(t)) return;
    const ac = new AbortController(), h = setTimeout(async () => {
      const list = await translitName(t, ac.signal);
      if (ac.signal.aborted || !list.length) return;
      setSug({ label: aiState() === "ready" ? "Latin spelling:" : "Rough guess, please edit:", list });
    }, 350);
    return () => { clearTimeout(h); ac.abort(); };
  }, [t]);
  const ok = () => {
    if (bad) return;
    O.name = cap(t);
    S.nick = O.name;
    saveProgress();
    renderUser();
    go();
  };
  const hint = !t ? "" : !hasFa(t) ? "Turkish endings will look like this: " + nameSuffix(cap(t), "ın") + " · " + nameSuffix(cap(t), "a") : "Write it in Latin letters so Turkish endings fit, like Mehrad'ın.";
  return (
    <StepView dots foot={<><Next text="Devam" onClick={ok} disabled={bad} /><Skip /></>}>
      {first ? <Pup mood="greet" size={130} pose="hero" /> : <Pup mood="happy" size={96} />}
      <h1 lang="tr">{first ? "Hoş geldin!" : "Adın ne?"}</h1>
      <p>{first ? "Let's learn Turkish together. What should we call you?" : "Check your name. The stories add Turkish endings to it."}</p>
      <input
        ref={box} class="nm-in" type="text" maxLength={30} placeholder="Your name" autoComplete="given-name" aria-label="Your name" dir="auto" value={v}
        onInput={(e) => setV((e.currentTarget as HTMLInputElement).value)} onKeyDown={(e) => { if (e.key === "Enter" && !bad) ok(); }}
      />
      <p class="hint" aria-live="polite">{hint}</p>
      <div class="onb-sug">
        {sug ? <>
          <span class="hint">{sug.label}</span>
          {sug.list.map((x) => <button class="onb-chip" type="button" onClick={() => { setV(x); box.current?.focus(); }}>{x}</button>)}
        </> : null}
      </div>
    </StepView>
  );
}
