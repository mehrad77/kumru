// The other steps: what's new (existing learners), joining a class, the daily reminder, and the cast, which ends on the first story.
import { useEffect, useState } from "preact/hooks";
import { S } from "../../../core/store.ts";
import { Lazy } from "../../../ui/Lazy.tsx";
import { Avatar } from "../../../ui/avatar/Avatar.tsx";
import { Pup } from "../../../ui/Pup.tsx";
import { toast } from "../../../ui/toast.ts";
import { classes } from "../../classes/index.ts";
import { loadRemindBody, remindStep } from "../../reminders/index.ts";
import { openStory } from "../../stories/index.ts";
// static: the entry has this module already (stories/index.ts); a dynamic import of it would split the entry into more chunks
import { loadStories, nextStory } from "../../stories/state.ts";
import { ONB_CLASSES } from "../model/flow.ts";
import { CAST_HEADS } from "../cast.gen.ts";
import { Nav, Quiet, StepView, useFlow } from "../Flow.tsx";

export function WhatsNewStep() {
  const { t, go, finish } = useFlow();
  return (
    <StepView dots foot={<><Nav text={t("newGo")} onClick={go} /><Quiet text={t("notNow")} onClick={() => finish()} /></>}>
      <Pup mood="happy" size={120} />
      <h1 lang="tr">Yeni karakterin!</h1>
      <p>{t("newBody")}</p>
    </StepView>
  );
}

/** The classes every new learner is offered; both are taught by admin (migration 0005); joining shares progress with the teacher. A learner who is in a class already never sees this step. */
export function ClassStep() {
  const { O, t, go } = useFlow();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const show = () => { if (live) setReady(true); };
    classes.list().then((l) => { if (!live) return; if (l.length && !O.classPicked) { O.classOut = true; go(); } else show(); }, show);
    return () => { live = false; };
  }, []);
  const done = () => { O.classPicked = true; go(); };
  const pick = async (c: { code: string }) => {
    try { await classes.join(c.code, true); }
    catch (e) { toast((e as { message?: string } | null)?.message || t("classFailed")); }
    done();
  };
  if (!ready) return <StepView dots />;
  return (
    <StepView dots foot={<Nav text={t("classNone")} onClick={done} />}>
      <Pup mood="happy" size={96} />
      <h1 lang="tr">Sınıfın var mı?</h1>
      <p>{t("classAsk")} {t("classBody")}</p>
      <div class="onb-classes">{ONB_CLASSES.map((c) => <button class="btn block" type="button" onClick={() => pick(c)}>{t("classN", { n: c.name })}</button>)}</div>
    </StepView>
  );
}

/** One reminder a day at the chosen hour, only on days the learner hasn't read yet: a new story is waiting (the hourly cron, docs/SPECS.md section 10.6). */
export function RemindStep() {
  const { t, go } = useFlow();
  const [st] = useState(() => remindStep());
  const head = <><Pup mood="happy" size={96} /><h1 lang="tr">Hatırlatıcı</h1><Lazy load={loadRemindBody} props={{ text: t("remindBody"), none: t("remindNo"), hour: t("remindHour") }} /></>;
  if (!st.supported) return <StepView dots foot={<Nav onClick={go} />}>{head}</StepView>;
  return (
    <StepView dots foot={<><Nav text={t("remindOn")} onClick={async () => { await st.turnOn(); go(); }} /><Quiet text={t("notNow")} onClick={go} /></>}>
      {head}
    </StepView>
  );
}

/** The first story the learner may open (the Stories tab's "Next for you"), once the stories have loaded. */
async function openFirstStory(): Promise<void> {
  await loadStories();
  const s = nextStory();
  if (s) openStory(s.id);
}

export function CastStep() {
  const { O, t, finish } = useFlow();
  const n = O.name || "";
  return (
    <StepView dots foot={<>
      <Nav text={t("castRead")} onClick={() => finish(() => { void openFirstStory().catch((e) => console.warn("first story", e)); })} />
      <Quiet text={t("castLook")} onClick={() => finish()} />
    </>}>
      <div class="onb-you"><Avatar char={S.char || O.char} size={120} cls="ring" label={n || "You"} />{n ? <b>{n}</b> : null}</div>
      <h1 lang="tr">{n ? "Merhaba, " + n + "!" : "Merhaba!"}</h1>
      <p>{t("castBody")}</p>
      <div class="onb-cast">
        <Avatar cast="kerim" size={46} cls="ring" />
        {/* the Season 1 cast's heads, drawn at build time (cast.gen.ts, scripts/avatar-art.ts) */}
        {CAST_HEADS.map((c) => <span key={c.id} class="chr sahne ring" role="img" aria-label={c.name} style="width:46px;height:46px" dangerouslySetInnerHTML={{ __html: c.svg }} />)}
      </div>
    </StepView>
  );
}
