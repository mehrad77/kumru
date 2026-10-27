// The character builder: Sahne's builder (sahne/packages/sahne/DESIGN.md §10) in the lazy `builder` bundle (app/lib/builder.ts),
// learner mode with the kit's starter set and "More" on every field. The learner's document is normalized as untrusted before
// it is saved (no cast parts, palette colours, at most 2 KB). If the bundle cannot load (offline on a first visit), the step
// says so and the learner goes on: the silhouette stands in until they make a character from their profile.
import { useEffect, useRef, useState } from "preact/hooks";
import { renderUser } from "../../../core/shell/appbar.ts";
import { S } from "../../../core/store.ts";
import { loadLib } from "../../../host/lib.ts";
import { charKind } from "../../../lib/char.ts";
import { confirmAsk } from "../../../ui/sheet.ts";
import { saveProgress } from "../../progress/index.ts";
import { Next, Skip, StepView, useFlow } from "../Flow.tsx";

type BuilderLib = typeof import("../../../lib/builder.ts");
const TOO_SLOW = 8000;

export function AvatarStep() {
  const { O, go } = useFlow();
  const host = useRef<HTMLDivElement>(null), lib = useRef<BuilderLib | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  useEffect(() => {
    let ui: { destroy(): void } | null = null, gone = false;
    const slow = setTimeout(() => { if (!lib.current) setState("failed"); }, TOO_SLOW);
    loadLib("builder").then(async (m: BuilderLib) => {
      if (gone || !host.current) return;
      lib.current = m;
      const theme = document.documentElement.dataset.theme;   // set by the profile's theme switch (profile/theme.ts)
      const built = await m.mount(host.current, {
        doc: charKind(O.char) === "avatar" ? O.char : null,
        theme: theme === "light" || theme === "dark" ? theme : "auto",
        onChange: (d) => { O.char = d; },
        confirm: (action) => confirmAsk(action === "reset"
          ? { title: "Start over?", body: "Your character goes back to the start. You can undo this.", label: "Start over" }
          : { title: "Throw away your changes?", body: "Your character stays as it was.", label: "Throw away" }),
      });
      ui = built;
      if (gone) built.destroy(); else { O.char = built.doc; setState("ready"); }
    }, () => { if (!gone) setState("failed"); }).finally(() => clearTimeout(slow));
    return () => { gone = true; clearTimeout(slow); ui?.destroy(); };
  }, []);
  const done = () => {
    const doc = lib.current?.storable(O.char) ?? null;
    if (doc) { S.char = doc; saveProgress(); renderUser(); }
    go();
  };
  return (
    <StepView cls="onb-av" dots foot={state === "ready" ? <><Next text="Looks like me!" onClick={done} /><Skip /></> : state === "failed" ? <Next text="Go on" onClick={go} /> : <Skip />}>
      <h1 lang="tr">Sen nasılsın?</h1>
      <p>Build your character. You'll see yourself in every story.</p>
      {state === "failed" ? <p class="hint" role="status">The character maker could not load. Go on, and make your character later from your profile.</p> : null}
      {state === "loading" ? <p class="hint" role="status">Loading the character maker…</p> : null}
      <div class="av-builder" ref={host} />
    </StepView>
  );
}
