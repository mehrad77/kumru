// The name step: what the stories call the learner. A name in Persian letters is turned into Latin ones (so Turkish endings fit it);
// the tutor suggests spellings when it can, else a rough offline guess.
import { useEffect, useRef, useState } from "preact/hooks";
import { renderUser } from "../../../core/shell/appbar.ts";
import { S } from "../../../core/store.ts";
import { Pup } from "../../../ui/Pup.tsx";
import { saveProgress } from "../../progress/index.ts";
import { cap, hasFa, nameSuffix } from "../model/names.ts";
import { Nav, StepView, useFlow } from "../Flow.tsx";
import { aiState, translitName } from "../../tutor/index.ts";

export function NameStep() {
  const { O, mode, t, go } = useFlow();
  const [v, setV] = useState(O.name), [sug, setSug] = useState<{ label: string; list: string[] } | null>(null);
  const box = useRef<HTMLInputElement>(null);
  const s = v.trim(), bad = !s || hasFa(s);
  useEffect(() => { const h = setTimeout(() => box.current?.focus(), 50); return () => clearTimeout(h); }, []);
  // a Persian name: after a pause, ask for Latin spellings (the tutor's, or the offline guess)
  useEffect(() => {
    setSug(null);
    if (!s || !hasFa(s)) return;
    const ac = new AbortController(), h = setTimeout(async () => {
      const list = await translitName(s, ac.signal);
      if (ac.signal.aborted || !list.length) return;
      setSug({ label: aiState() === "ready" ? t("nameAi") : t("nameGuess"), list });
    }, 350);
    return () => { clearTimeout(h); ac.abort(); };
  }, [s]);
  const ok = () => {
    if (bad) return;
    O.name = cap(s);
    S.nick = O.name;
    saveProgress();
    renderUser();
    go();
  };
  const hint = !s ? "" : !hasFa(s) ? t("nameEnds") + " " + nameSuffix(cap(s), "ın") + " · " + nameSuffix(cap(s), "a") : t("nameLatin");
  return (
    <StepView dots foot={<Nav onClick={ok} disabled={bad} />}>
      <Pup mood={mode === "full" ? "greet" : "happy"} size={96} />
      <h1 lang="tr">Adın ne?</h1>
      <p>{mode === "full" ? t("nameAsk") : t("nameCheck")}</p>
      <input
        ref={box} class="nm-in" type="text" maxLength={30} placeholder={t("namePh")} autoComplete="given-name" aria-label={t("namePh")} dir="auto" value={v}
        onInput={(e) => setV((e.currentTarget as HTMLInputElement).value)} onKeyDown={(e) => { if (e.key === "Enter" && !bad) ok(); }}
      />
      <p class="hint" aria-live="polite"><bdi>{hint}</bdi></p>
      <div class="onb-sug">
        {sug ? <>
          <span class="hint">{sug.label}</span>
          {sug.list.map((x) => <button class="onb-chip" type="button" dir="ltr" onClick={() => { setV(x); box.current?.focus(); }}>{x}</button>)}
        </> : null}
      </div>
    </StepView>
  );
}
