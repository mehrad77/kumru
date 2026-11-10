// The character, one onboarding step per section of Sahne's builder (model/flow.ts CHAR_SCREENS: body, face, hair, clothes,
// extras). The builder (sahne/packages/sahne/DESIGN.md §10, from the lazy `builder` bundle, app/lib/builder.ts) is mounted once for
// the five steps and kept in the flow's answers (`O.kit`): each step moves its element in and shows its own section, so the live
// preview, undo and Back keep the character as it was. It has no tabs and no emotion strip (the steps are the tabs), adults only;
// the preview stays on top and frames what is being chosen (a hat, the shoes). Every step saves the character when the learner goes
// on, normalized as untrusted. A slow load keeps waiting, and after 8 s offers "Skip the character"; a load that fails
// (or that skip) says so and leaves out the other character steps.
import { useEffect, useRef, useState } from "preact/hooks";
import { renderUser } from "../../../core/shell/appbar.ts";
import { S } from "../../../core/store.ts";
import { loadLib } from "../../../host/lib.ts";
import { charKind } from "../../../lib/char.ts";
import { confirmAsk } from "../../../ui/sheet.ts";
import { saveProgress } from "../../progress/index.ts";
import { Nav, Quiet, StepView, useFlow, type Answers, type Flow } from "../Flow.tsx";
import type { CharScreen } from "../model/flow.ts";

type BuilderLib = typeof import("../../../lib/builder.ts");
export interface CharKit { lib: BuilderLib; ui: import("../../../lib/builder.ts").BuilderUI; el: HTMLElement }
const TOO_SLOW = 8000;

let loading: Promise<void> | null = null;
/** Mount the builder once per flow, into an element of its own that the steps move in and out. */
function loadKit(O: Answers, f: Flow): Promise<void> {
  if (O.kit) return Promise.resolve();
  return loading ??= (async () => {
    try {
      const lib = await (loadLib("builder") as Promise<BuilderLib>);
      // the learner skipped the character while it loaded
      if (O.kit === "failed") return;
      const el = document.createElement("div");
      el.className = "av-builder";
      const theme = document.documentElement.dataset.theme;   // set by the profile's theme switch (profile/theme.ts)
      const ui = await lib.mount(el, {
        doc: charKind(O.char) === "avatar" ? O.char : null,
        theme: theme === "light" || theme === "dark" ? theme : "auto",
        onChange: (d) => { O.char = d; },
        // only "Start over" asks: the builder here has no Cancel
        confirm: () => confirmAsk({ title: f.t("resetAsk"), body: f.t("resetBody"), label: f.t("resetOk") }),
      });
      O.kit = { lib, ui, el };
      O.char = ui.doc;
    } catch (e) {
      console.warn("character maker", e);
      O.kit = "failed";
    } finally { loading = null; }
  })();
}

export function CharStep({ screen }: { screen: CharScreen }) {
  const f = useFlow(), { O, t, go } = f;
  const host = useRef<HTMLDivElement>(null), [, tick] = useState(0), [slow, setSlow] = useState(false);
  const kit = O.kit;
  useEffect(() => {
    let live = true;
    const h = setTimeout(() => { if (live) setSlow(true); }, TOO_SLOW);
    void loadKit(O, f).then(() => { if (live) tick((n) => n + 1); });
    return () => { live = false; clearTimeout(h); };
  }, []);
  // a slow phone keeps waiting; after a while the learner may go on without the character (it is made later from Profile)
  const skipChar = () => { if (!O.kit) O.kit = "failed"; go(); };
  // this step's section, in this step's frame
  useEffect(() => {
    if (!kit || kit === "failed" || !host.current) return;
    host.current.append(kit.el);
    kit.ui.setSection(screen);
    return () => { kit.el.remove(); };
  }, [kit, screen]);
  if (kit === "failed") {
    return <StepView dots foot={<Nav onClick={go} />}><h1>{t(screen)}</h1><p class="hint" role="status">{t("charFailed")}</p></StepView>;
  }
  const done = () => {
    if (kit) {
      const doc = kit.lib.storable(kit.ui.doc);
      if (doc) { S.char = doc; O.char = doc; saveProgress(); renderUser(); }
    }
    go();
  };
  return (
    <StepView dots fill foot={<><Nav onClick={done} text={screen === "extras" ? t("looksLikeMe") : undefined} disabled={!kit} />{!kit && slow ? <Quiet text={t("charSkip")} onClick={skipChar} /> : null}</>}>
      <h2 class="onb-sec">{t(screen)}</h2>
      {!kit ? <p class="hint" role="status">{t("charLoading")}</p> : null}
      <div class="av-host" ref={host} />
    </StepView>
  );
}

/** The flow is closing: the builder goes with it. */
export function dropKit(O: Answers): void {
  if (O.kit && O.kit !== "failed") O.kit.ui.destroy();
  O.kit = undefined;
}
