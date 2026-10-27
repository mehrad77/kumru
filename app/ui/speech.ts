// Speech, both optional: the Turkish voice (listening) and voice input (the mic in typing questions). Neither is required,
// so every caller checks `hasVoice()` / `hasMic()` and falls back.
import { ICON, el } from "../core/dom.ts";
import { local } from "../core/local.ts";
import { toast } from "./toast.ts";

let trVoice: SpeechSynthesisVoice | null = null;
const voiceList = (): SpeechSynthesisVoice[] => { try { return window.speechSynthesis ? speechSynthesis.getVoices() || [] : []; } catch { return []; } };
const isTrVoice = (v: SpeechSynthesisVoice) => /^tr([-_]|$)/i.test(v.lang || "") || /t[üu]rk/i.test(v.name || "");
export const trVoices = (): SpeechSynthesisVoice[] => voiceList().filter(isTrVoice).sort((a, b) => (b.localService ? 1 : 0) - (a.localService ? 1 : 0));

/** The saved voice if it is still there, else the best Turkish one. */
export function pickVoice(): SpeechSynthesisVoice | null {
  const saved = local.get("voice", "");
  const tr = trVoices();
  if (saved) { const v = tr.find((x) => x.voiceURI === saved || x.name === saved); if (v) return v; }
  return tr.find((x) => /^tr[-_]tr$/i.test(x.lang)) || tr[0] || null;
}

/** Whether this device has a Turkish voice (listening questions need one). */
export const hasVoice = (): boolean => !!trVoice;

/** Pick the voice again (after the learner chose one). */
export const loadVoices = (): void => { trVoice = pickVoice(); };

/** Called when the browser's voice list changes (voices load late); the page redraws what shows a voice. */
export function onVoicesChanged(cb: () => void): void {
  if (!window.speechSynthesis) return;
  trVoice = pickVoice();
  try { speechSynthesis.addEventListener("voiceschanged", () => { trVoice = pickVoice(); cb(); }); } catch { /* no events */ }
}

export function speak(t: string, rate?: number, onEnd?: (() => void) | null): void {
  let cb = onEnd || null;
  const done = () => { if (cb) { const f = cb; cb = null; f(); } };
  if (!window.speechSynthesis || !t) { if (cb) setTimeout(done, 400); return; }
  const v = pickVoice();
  if (!v) { if (cb) setTimeout(done, 400); return; }
  try {
    const u = new SpeechSynthesisUtterance(String(t));
    u.lang = "tr-TR"; u.voice = v; u.rate = rate || 0.9;
    if (cb) { u.onend = done; u.onerror = done; setTimeout(done, 2500 + String(t).length * 120); }
    speechSynthesis.cancel();
    setTimeout(() => { try { speechSynthesis.speak(u); } catch { done(); } }, 30);
  } catch { done(); }
}

/** The Listen button next to a Turkish text, or null without a voice. */
export function speakBtn(t: string): HTMLElement | null {
  if (!trVoice) return null;
  const b = el("button", { class: "speak", type: "button", "aria-label": "Listen", onclick: (e: Event) => { e.stopPropagation(); speak(t); } });
  b.innerHTML = ICON.speaker;
  return b;
}

// the Web Speech recognition constructor, where the browser has one
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Recognition = (): (new () => any) | undefined => (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
export const hasMic = (): boolean => !!Recognition();

export interface MicOptions { onError?: (code: string) => void; quietNoSpeech?: boolean; onEnd?: (value: string, heard: boolean) => void }

/** A mic button that fills `inp` with what the learner says in Turkish; null where the browser cannot listen. */
export function micBtn(inp: HTMLInputElement, opts: MicOptions = {}): HTMLElement | null {
  const R = Recognition();
  if (!R) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rec: any = null, heard = false;
  const b = el("button", { class: "mic-btn", type: "button", "aria-label": "Answer by voice", title: "Say it in Turkish", onclick: () => {
    if (rec) { rec.stop(); return; }
    try { rec = new R(); rec.lang = "tr-TR"; rec.interimResults = true; rec.maxAlternatives = 1; }
    catch { toast("Voice input isn't available here."); return; }
    try { speechSynthesis.cancel(); } catch { /* no synthesis */ }
    b.classList.add("on");
    heard = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      heard = true;
      let t = "";
      for (const r of e.results) t += r[0].transcript;
      inp.value = t.replace(/[.!?¿¡,]+$/g, "").trim();
      inp.dispatchEvent(new Event("input", { bubbles: true }));
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      if (opts.onError) opts.onError(e.error);
      if (opts.quietNoSpeech && e.error === "no-speech") return;
      toast(e.error === "not-allowed" || e.error === "service-not-allowed" ? "The microphone is blocked here. Allow it for this page, or type instead."
        : e.error === "no-speech" ? "I didn't hear anything. Try again." : "Voice input stopped (" + e.error + ").");
    };
    rec.onend = () => { b.classList.remove("on"); rec = null; if (opts.onEnd) opts.onEnd(inp.value, heard); };
    try { rec.start(); } catch { b.classList.remove("on"); rec = null; }
  } });
  b.innerHTML = ICON.mic;
  return b;
}
