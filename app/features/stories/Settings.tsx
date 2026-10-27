// The Profile's Stories card (the `profileCards` slot): how the reader shows a story. Device settings (prefs.ts). The translations
// follow the help language (Profile → Language); the microphone row shows only where it works (voice.ts).
import { useState } from "preact/hooks";
import { Seg } from "../../ui/Seg.tsx";
import { SetCard, SetRow, Switch } from "../../ui/settings.tsx";
import { pref, setPref, setStoryView, storyView, type StoryView } from "./prefs.ts";
import { voiceOk } from "./voice.ts";

export function StorySettings() {
  const [, redraw] = useState(0);
  const set = (f: () => void) => { f(); redraw((n) => n + 1); };
  return (
    <SetCard title="Stories">
      <SetRow title="Bubbles on stage" sub="Speech bubbles over the scene. Auto: when the phone is sideways or the screen is wide.">
        <Seg cur={storyView()} opts={[["auto", "Auto"], ["theatre", "On"], ["log", "Off"]]} onPick={(v) => set(() => setStoryView(v as StoryView))} />
      </SetRow>
      {voiceOk() ? (
        <SetRow title="Say your lines aloud" sub="A microphone on your lines, in the weeks that practise speaking.">
          <Switch on={pref("aloud", true)} label="Say your lines aloud" onChange={(v) => set(() => setPref("aloud", v))} />
        </SetRow>
      ) : null}
    </SetCard>
  );
}
