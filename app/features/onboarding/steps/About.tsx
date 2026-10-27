// The "about you" step: hometown, job, hobby, why Turkish (all optional). The tutor writes them up as clean forms the learner can check;
// without it they are kept as typed. The stories use them (model/personalize.ts, the tutor's blurb).
import { useEffect, useRef, useState } from "preact/hooks";
import { renderUser } from "../../../core/shell/appbar.ts";
import { S } from "../../../core/store.ts";
import { Pup } from "../../../ui/Pup.tsx";
import { toast } from "../../../ui/toast.ts";
import { saveProgress } from "../../progress/index.ts";
import { ABOUT } from "../model/flow.ts";
import { profileFallback, type Profile, type ProfileItem } from "../model/profile.ts";
import { studentName } from "../personalize.ts";
import { Next, Skip, StepView, Think, useFlow } from "../Flow.tsx";
import { aiErrText, aiState, buildProfile } from "../../tutor/index.ts";

const Row = ({ k, x, fa }: { k: string; x: ProfileItem | null; fa?: boolean }) => x ? (
  <div class="onb-prow">
    <span class="lbl">{k}</span>
    <div>
      <b lang="tr">{x.tr || x.raw}</b>
      {x.en && x.en !== x.tr ? <span class="hint">{" · " + x.en}</span> : null}
      {fa && x.fa && x.fa !== x.tr ? <span class="hint" lang="fa" dir="rtl">{" · " + x.fa}</span> : null}
    </div>
  </div>
) : null;

function Card({ p, onEdit }: { p: Profile; onEdit: () => void }) {
  const { O, go } = useFlow(), [, tick] = useState(0);
  const alt = p.name && p.name.alt, useAlt = alt && alt.toLocaleLowerCase("tr") !== (O.name || "").toLocaleLowerCase("tr");
  const save = () => {
    S.profile = { ...p, name: { ...p.name } };
    if (O.useAlt) { S.nick = O.useAlt; O.name = O.useAlt; }
    saveProgress();
    renderUser();
    go();
  };
  return (
    <StepView dots foot={<><Next text="Looks right" onClick={save} /><button class="btn" type="button" onClick={onEdit}>Edit</button></>}>
      <Pup mood="cheer" size={96} />
      <h1 lang="tr">Böyle mi?</h1>
      <p>Is this right?</p>
      <div class="onb-card card">
        <Row k="Hometown" x={p.city} fa />
        <Row k="Job or study" x={p.job} />
        <Row k="Hobby" x={p.hobby} />
        <Row k="Why Turkish" x={p.why} />
        {useAlt ? (
          <div class="onb-prow">
            <span class="lbl">Easier name</span>
            <div><b lang="tr">{alt}</b>{p.name.why ? <span class="hint">{" · " + p.name.why}</span> : null}</div>
            <button class="btn sm" type="button" aria-pressed={O.useAlt === alt} onClick={() => { O.useAlt = O.useAlt === alt ? "" : alt; tick((n) => n + 1); }}>{O.useAlt === alt ? "Using " + alt : "Use " + alt}</button>
          </div>
        ) : null}
        {p.bio && p.bio.en ? <p class="hint">{p.bio.en}</p> : null}
      </div>
      {p.ai ? null : <p class="hint">Saved as you typed it.</p>}
    </StepView>
  );
}

export function AboutStep() {
  const { O, mode, go } = useFlow();
  const [, tick] = useState(0);
  const [view, setView] = useState<"form" | "card">("form"), [profile, setProfile] = useState<Profile | null>(null), [busy, setBusy] = useState<{ stop: () => void } | null>(null);
  const alive = useRef(true), ctl = useRef<AbortController | null>(null);
  // leaving the step (back, or the flow closing) stops the tutor's call
  useEffect(() => () => { alive.current = false; ctl.current?.abort(); }, []);
  const submit = async () => {
    for (const [k] of ABOUT) O.ans[k] = O.ans[k].trim();
    const a = { name: O.name || studentName(), ...O.ans };
    if (!(a.city || a.job || a.hobby || a.why)) {
      if (mode === "edit" && S.profile) { S.profile = null; saveProgress(); }
      return go();
    }
    let p: Profile;
    if (aiState() === "ready") {
      const c = ctl.current = new AbortController();
      setBusy({ stop: () => c.abort() });
      try { p = (await buildProfile(a, c.signal)) as Profile; }
      catch (e) {
        if (!alive.current) return;
        ctl.current = null;
        if (e && (e as { code?: string }).code === "cancelled") { setBusy(null); return; }
        toast(aiErrText(e) || "Couldn't reach the tutor");
        p = profileFallback(a);
      }
      ctl.current = null;
      setBusy(null);
    } else p = profileFallback(a);
    if (!alive.current) return;
    O.useAlt = "";
    setProfile(p);
    setView("card");
  };
  if (busy) return <Think msg="The tutor is writing it down…" stop={busy.stop} />;
  if (view === "card" && profile) return <Card p={profile} onEdit={() => setView("form")} />;
  return (
    <StepView dots foot={<><Next onClick={submit} /><Skip /></>}>
      <Pup mood="happy" size={96} />
      <h1 lang="tr">Biraz anlat!</h1>
      <p>Tell me a little about you. The characters will remember it. Every answer is optional.</p>
      <div class="fields">
        {ABOUT.map(([k, l, ph]) => (
          <label class="fld">
            <span class="lbl">{l}</span>
            <input type="text" maxLength={80} dir="auto" placeholder={ph} aria-label={l} value={O.ans[k]} onInput={(e) => { O.ans[k] = (e.currentTarget as HTMLInputElement).value; tick((n) => n + 1); }} />
          </label>
        ))}
      </div>
    </StepView>
  );
}
