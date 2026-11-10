// The hometown step (optional): the stories use it (model/personalize.ts, the tutor's blurb). A typed or picked town becomes the
// profile: the tutor's clean form when it is ready, else as typed (`profileFallback`: a known town gets its Turkish, English and
// Persian forms either way). Job, hobby and why stay empty.
import { useState } from "preact/hooks";
import { S } from "../../../core/store.ts";
import { Pup } from "../../../ui/Pup.tsx";
import { saveProgress } from "../../progress/index.ts";
import { CITIES, profileFallback } from "../model/profile.ts";
import { studentName } from "../personalize.ts";
import { Nav, Quiet, StepView, Think, useFlow } from "../Flow.tsx";
import { aiErrText, aiState, buildProfile } from "../../tutor/index.ts";
import { toast } from "../../../ui/toast.ts";
import type { Profile } from "../model/profile.ts";

/** The towns offered as one tap (the learners' most common). */
const QUICK = CITIES.slice(0, 6);

export function HomeStep() {
  const { O, mode, t, go } = useFlow();
  const [v, setV] = useState(O.ans.city), [busy, setBusy] = useState<AbortController | null>(null);
  const save = async (city: string) => {
    O.ans.city = city.trim();
    if (!O.ans.city) {
      if (mode === "edit" && S.profile) { S.profile = null; saveProgress(); }
      return go();
    }
    const a = { name: O.name || studentName(), ...O.ans };
    let p = profileFallback(a);
    if (aiState() === "ready") {
      const c = new AbortController();
      setBusy(c);
      try { p = (await buildProfile(a, c.signal)) as Profile; }
      catch (e) {
        if (e && (e as { code?: string }).code === "cancelled") { setBusy(null); return; }
        toast(aiErrText(e) || "Couldn't reach the tutor");
      }
      setBusy(null);
    }
    S.profile = p;
    saveProgress();
    go();
  };
  if (busy) return <Think msg={t("homeBusy")} stop={() => busy.abort()} />;
  const cityName = (c: (typeof CITIES)[number]) => (O.lang === "fa" ? c[2] : c[1]);
  return (
    <StepView dots foot={<><Nav onClick={() => void save(v)} /><Quiet text={t("skip")} onClick={() => void save("")} /></>}>
      <Pup mood="happy" size={96} />
      <h1 lang="tr">Nerelisin?</h1>
      <p>{t("homeAsk")}</p>
      <input class="nm-in" type="text" maxLength={40} dir="auto" placeholder={t("homePh")} aria-label={t("homeAsk")} value={v}
        onInput={(e) => setV((e.currentTarget as HTMLInputElement).value)} onKeyDown={(e) => { if (e.key === "Enter") void save(v); }} />
      <div class="onb-sug">
        {QUICK.map((c) => <button class="onb-chip" type="button" aria-pressed={v === cityName(c)} onClick={() => setV(cityName(c))}>{cityName(c)}</button>)}
      </div>
    </StepView>
  );
}
