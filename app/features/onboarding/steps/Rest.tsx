// The other steps: what's new (existing learners), joining a class, the daily reminder, and the cast.
import { useEffect, useState } from "preact/hooks";
import { S } from "../../../core/store.ts";
import { Lazy } from "../../../ui/Lazy.tsx";
import { Avatar } from "../../../ui/avatar/Avatar.tsx";
import { Pup } from "../../../ui/Pup.tsx";
import { toast } from "../../../ui/toast.ts";
import { classes } from "../../classes/index.ts";
import { startCustom } from "../../practice/index.ts";
import { loadRemindBody, remindStep } from "../../reminders/index.ts";
import { ONB_CLASSES } from "../model/flow.ts";
import { CAST_HEADS } from "../cast.gen.ts";
import { Next, Skip, StepView, useFlow } from "../Flow.tsx";

export function WhatsNewStep() {
  const { go, finish } = useFlow();
  return (
    <StepView dots foot={<><Next text="Let's go" onClick={go} /><Skip text="Not now" onClick={() => finish()} /></>}>
      <Pup mood="happy" size={120} />
      <h1 lang="tr">Yeni karakterin!</h1>
      <p>Make your own paper character: your friends see it, and it will be you in Kerim's stories, coming soon. Your progress is kept.</p>
    </StepView>
  );
}

/** The classes every new learner is offered; both are taught by admin (migration 0005); joining shares progress with the teacher. A learner who is in a class already never sees this step. */
export function ClassStep() {
  const { O, go } = useFlow();
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
    catch (e) { toast((e as { message?: string } | null)?.message || "Couldn't join the class. You can join later in Friends."); }
    done();
  };
  if (!ready) return <StepView dots />;
  return (
    <StepView dots foot={<Next text="No class for now" onClick={done} />}>
      <Pup mood="happy" size={96} />
      <h1>Join a class?</h1>
      <p>Learning with a class? Your teacher, admin, will see your position, streak and weakest words. You can stop sharing any time in Friends.</p>
      <div class="onb-classes">{ONB_CLASSES.map((c) => <button class="btn block" type="button" onClick={() => pick(c)}>{"Class " + c.name}</button>)}</div>
    </StepView>
  );
}

/** One reminder a day at the chosen hour, only if the learner hasn't studied yet (the hourly cron, docs/SPECS.md section 10.6). */
export function RemindStep() {
  const { go } = useFlow();
  const [st] = useState(() => remindStep());
  const head = <><Pup mood="happy" size={96} /><h1>Daily reminder</h1><Lazy load={loadRemindBody} props={{}} /></>;
  if (!st.supported) return <StepView dots foot={<Next onClick={go} />}>{head}</StepView>;
  return (
    <StepView dots foot={<><Next text="Turn on" onClick={async () => { await st.turnOn(); go(); }} /><Skip text="Not now" onClick={go} keep /></>}>
      {head}
    </StepView>
  );
}

export function CastStep() {
  const { O, finish } = useFlow();
  const n = O.name || "";
  return (
    <StepView dots foot={<>
      <button class="btn primary" type="button" onClick={() => finish(() => startCustom(10))}>Start a 10-minute study plan</button>
      <button class="linkish" type="button" onClick={() => finish()}>Look around first</button>
    </>}>
      <div class="onb-you"><Avatar char={S.char || O.char} size={120} cls="ring" label="Your character" />{n ? <b>{n}</b> : null}</div>
      <h1 lang="tr">{n ? "Merhaba, " + n + "!" : "Merhaba!"}</h1>
      <p>In our stories you are the newcomer in Istanbul. These friends will help you:</p>
      <div class="onb-cast">
        <Avatar cast="kerim" size={46} cls="ring" />
        {/* the Season 1 cast's heads, drawn at build time (cast.gen.ts, scripts/avatar-art.ts) */}
        {CAST_HEADS.map((c) => <span key={c.id} class="chr sahne ring" role="img" aria-label={c.name} style="width:46px;height:46px" dangerouslySetInnerHTML={{ __html: c.svg }} />)}
      </div>
    </StepView>
  );
}
