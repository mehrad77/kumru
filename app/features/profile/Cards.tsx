// The Profile's own cards, each a fill of the `profileCards` slot (index.ts): Study, Language, Voice & audio, AI tutor,
// Appearance, Privacy and (for editors) Editor tools. They write preferences with `setPref`, which the progress document syncs.
import { helpLang } from "../../core/lang.ts";
import { local } from "../../core/local.ts";
import { rerender } from "../../core/router.ts";
import { S, redrawTick, signals } from "../../core/store.ts";
import { Seg } from "../../ui/Seg.tsx";
import { SetCard, SetRow, Switch } from "../../ui/settings.tsx";
import { hasMic, loadVoices, pickVoice, speak, trVoices } from "../../ui/speech.ts";
import { openOnboarding } from "../onboarding/index.ts";
import { rev } from "../progress/index.ts";
import { setPref } from "./prefs.ts";
import { chooseTheme, readAloud, setReadAloud, theme, voiceTick } from "./state.ts";
import { aiState, openTutorLab } from "../tutor/index.ts";

export function StudyCard() {
  const P = S.prefs;
  void rev.value;
  const placed = S.placed as { lv: string; u: number; at: number } | null;
  return (
    <SetCard title="Study">
      <SetRow title="Placement" sub={placed ? "Placed at " + placed.lv + " · Unit " + placed.u + " on " + new Date(placed.at).toLocaleDateString() + "." : "A short check that suggests where to start."}>
        <button class="btn sm" type="button" onClick={() => openOnboarding("place")}>{placed ? "Retake" : "Take it"}</button>
      </SetRow>
      <SetRow title="Daily goal" sub="XP per day, for your streak and the goal ring.">
        <Seg cur={P.goal || 20} opts={[[10, "10"], [20, "20"], [30, "30"], [50, "50"]]} onPick={(v) => setPref("goal", v)} />
      </SetRow>
    </SetCard>
  );
}

export function LanguageCard() {
  return (
    <SetCard title="Language">
      <SetRow title="Help language" sub="The translations beside the Turkish: in stories, practice, tips and AI explanations.">
        <Seg cur={helpLang()} opts={[["fa", "فارسی"], ["en", "English"], ["both", "Both"], ["none", "None"]]} onPick={(v) => setPref("lang", v)} />
      </SetRow>
      <p class="hint">None keeps stories Turkish only: tap any word for its meaning. Practice still shows meanings, in English.</p>
    </SetCard>
  );
}

export function VoiceCard() {
  void voiceTick.value;
  void redrawTick.value;
  // the browser loads its voices late; the page calls rerender() when the list changes
  const voices = trVoices(), none = !voices.length, cur = pickVoice();
  const curId = cur ? cur.voiceURI || cur.name : "";
  const mic = hasMic();
  const pick = (e: Event) => {
    local.set("voice", (e.currentTarget as HTMLSelectElement).value);
    loadVoices();
    speak("Merhaba");
    voiceTick.value++;
  };
  return (
    <SetCard title="Voice & audio">
      <SetRow title="Turkish voice" sub="Used for words, examples and stories.">
        <select class="sel" id="voice" aria-label="Turkish voice" hidden={none} onChange={pick}>
          {voices.map((v) => {
            const id = v.voiceURI || v.name;
            return <option value={id} selected={id === curId}>{"Voice: " + v.name.replace(/\s*\(.*\)\s*$/, "") + (v.localService ? "" : " (online)")}</option>;
          })}
        </select>
        <button class="btn sm" type="button" id="voice-test" hidden={none} onClick={() => speak("Merhaba, nasılsın? Türkçe öğreniyorum.")}>Test voice</button>
      </SetRow>
      <p class="hint" id="voice-hint" hidden={!none}>
        {window.speechSynthesis
          ? "No Turkish voice on this device, so listening is off. Add one in your system's speech or text-to-speech settings, then reload."
          : "This browser can't speak text, so listening is off."}
      </p>
      <SetRow title="Read story lines aloud" sub="Speak each line as it appears.">
        <Switch on={readAloud.value} label="Read story lines aloud" onChange={setReadAloud} />
      </SetRow>
      <SetRow title="Voice input" sub={mic ? "Available: tap the mic in typing questions." : "Not available in this browser. Chrome or Edge support it."}>
        <span class={"pchip " + (mic ? "ok" : "new")}>{mic ? "On" : "Off"}</span>
      </SetRow>
    </SetCard>
  );
}

const AI_STATE: Record<string, [string, string]> = { ready: ["ok", "Ready"], denied: ["bad", "Not allowed in this view"], off: ["new", "Not available here"], unknown: ["new", "Checking…"] };

export function AiCard() {
  void redrawTick.value;
  const P = S.prefs, st = AI_STATE[aiState()] || AI_STATE.unknown;
  return (
    <section class="card set-card set-ai">
      <h2>AI tutor <span class="pill ai-pill">AI</span></h2>
      <p class="hint">The AI tutor is off for now. Sentence checks, conversations and the writing sample come back in a later version; everything else works without it.</p>
      <SetRow title="Status"><span class={"pchip " + st[0]}>{st[1]}</span></SetRow>
      <SetRow title="“Try it” on lesson pages" sub="Write a sentence and get it checked.">
        <Switch on={P.tryIt !== false} label="Try it on lesson pages" onChange={(v) => setPref("tryIt", v)} />
      </SetRow>
      <SetRow title="Corrections in conversations" sub="When to show fixes while you chat with the characters.">
        <Seg cur={P.corr} opts={[["end", "After the conversation"], ["each", "After each message"]]} onPick={(v) => setPref("corr", v)} />
      </SetRow>
    </section>
  );
}

export function AppearanceCard() {
  return (
    <SetCard title="Appearance">
      <SetRow title="Theme" sub="On this device.">
        <Seg cur={theme.value} opts={[["system", "System"], ["light", "Light"], ["dark", "Dark"]]} onPick={chooseTheme} />
      </SetRow>
    </SetCard>
  );
}

export function PrivacyCard() {
  void redrawTick.value;
  return (
    <SetCard title="Privacy">
      <p class="hint">Your progress is stored on Kumru's server (Cloudflare), and the person who runs Kumru can read it. Anyone signed in can find you by your name or friend code and see your name, XP and streak. Your character is shown only to friends (you follow each other) and classmates, unless you turn on the switch below. Nothing else is shared unless you choose to. You can download your data or delete your account under Account.</p>
      <SetRow title="Show my character to everyone" sub="Off: people who are not your friends or classmates see a plain paper figure.">
        <Switch on={S.prefs.charPublic === true} label="Show my character to everyone" onChange={(v) => { setPref("charPublic", v); rerender(); }} />
      </SetRow>
    </SetCard>
  );
}

export function EditorCard() {
  void redrawTick.value;
  if (!signals.canEdit.value) return null;
  return (
    <SetCard title="Editor tools">
      <SetRow title="Tutor lab" sub="Run the test sentences through the checker and review the answers.">
        <button class="btn sm primary" type="button" disabled={aiState() !== "ready"} onClick={() => void openTutorLab()}>Open</button>
      </SetRow>
    </SetCard>
  );
}
