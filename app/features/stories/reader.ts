// The story reader (docs/stories/STORIES_STAGE.md §6–§8, STORIES_DESIGN.md §1): the stage on top, the log under it, and the
// footer with Devam or the learner's card; then the quiz, the follow-up dialogue, and the record. DOM-built around Sahne's stage
// from the lazy `player` bundle (app/lib/player.ts); the footer's logic is sahne-story's storyPlayer.
//
// - The stage fills the top of the screen, edge to edge, with only a small back button over it (no title bar).
// - Log mode (an upright phone) leaves the lines to the log under the stage; theatre mode (sideways, a tablet, or the toggle)
//   puts them on stage as bubbles (`stage.setBubbles`).
// - Translations are in the help language (app/core/lang.ts): Persian, English or both; with "none", English. A button beside the
//   speaker shows or hides them for the whole dialogue (`kumru:story:tl`; off by default only with "none"); a tapped word always
//   has its meaning.
// - Every line of the newcomer is the learner's to say: a card with a round microphone and "Say it for me" (in every story, unless the
//   learner turned it off or it does not really work here: voice.ts), or with Söyle where there is no microphone.
// - A speaker button (top right) turns the stage's sound on or off: the lines in the device's Turkish voice, the place's
//   recordings and Kerim's coo. Off until the learner turns it on (STORIES_STAGE.md §3), then remembered (`kumru:story:sound`). A choice is the same card with 2–3 options, shown shuffled and stored by their authored index.
// - Kerim's grammar spot is a card in the log with the lesson's link (the stage does not act spots out yet).
// - Without WebGL2 (or when the GPU takes the context away) the story reads in the log with the place's name over a still.
import { el } from "../../core/dom.ts";
import { faTxt } from "../../core/i18n.ts";
import { helpLang, helpLangs, meaningLang, ruOr } from "../../core/lang.ts";
import { S } from "../../core/store.ts";
import { loadLib } from "../../host/lib.ts";
import { castPortrait, myPortrait } from "../../ui/avatar/portrait.ts";
import { pup, kerimTalk, talkMs } from "../../ui/kerim/kerim.ts";
import { speak } from "../../ui/speech.ts";
import { toast } from "../../ui/toast.ts";
import { openLesson } from "../grammar/index.ts";
import { personalize, personalizeName, personalizeStr, studentName } from "../onboarding/index.ts";
import { loadGlossModel, type GlossIndex } from "../practice/index.ts";
import { addXp, bumpDay, saveProgress, todayKey } from "../progress/index.ts";
import { showGloss } from "../words/index.ts";
import { finishRecord, okPicks, quizStars, shuffled, type StRecord } from "./model/record.ts";
import { pref, setPref, storyView } from "./prefs.ts";
import { characters, loadStories, nextStory, openStories, places, record, stories, textIn, type QuizItem, type Story } from "./state.ts";
import { noteListen, voiceOk } from "./voice.ts";

type Player = typeof import("../../lib/player.ts");
let G: Awaited<ReturnType<typeof loadGlossModel>>;
/** A text by language; a cue or card option also carries it whole as `text`, with every language of the series (Russian too). */
type Text3 = { tr?: string; en?: string; fa?: string; ru?: string; text?: Record<string, string | undefined> };

/** A card's microphone: the round button and the line under it that hints, listens and says what it heard. */
type Aloud = { mic: HTMLElement; status: HTMLElement; stop: () => void };
const btn = (cls: string, text: string, onclick: () => void, extra: Record<string, unknown> = {}) => el("button", { class: cls, type: "button", text, onclick, ...extra });
/** The translations a story can show: the help language's, or with "none" the meaning language (English). */
function tlLangs(): { fa: boolean; en: boolean; ru: boolean } {
  if (helpLang() !== "none") return helpLangs();
  const m = meaningLang();
  return { fa: m === "fa", en: m === "en", ru: m === "ru" };
}
/** Whether the translations show: the reader's toggle, on by default unless the help language is "none". */
const tlOn = () => pref("tl", helpLang() !== "none");
/**
 * A line's translations, always in the page, shown or hidden by the reader's toggle (`st-notl` on the page). `t` is the line in
 * every language of the series (a cue's `text`); Russian falls back to English where a line has none yet.
 */
function tl(t?: { en?: string; fa?: string; ru?: string }): (HTMLElement | null)[] {
  const H = tlLangs(), ru = H.ru && t ? ruOr(t) : undefined;
  return [
    H.en && t?.en ? el("small", { class: "tl", text: t.en }) : null,
    ru ? el("small", { class: "tl", lang: t?.ru ? "ru" : "en", text: ru }) : null,
    H.fa && t?.fa ? el("small", { class: "fa", lang: "fa", dir: "rtl", text: faTxt(t.fa) }) : null,
  ];
}

const SOUND_ON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const SOUND_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M16 9l5 6M21 9l-5 6"/></svg>';
/** Whether the browser has a Turkish voice for the lines (the stage's `browserVoice` picks the same way). */
const trVoiceHere = () => { try { return !!window.speechSynthesis && speechSynthesis.getVoices().some((v) => /^tr([-_]|$)/i.test(v.lang || "")); } catch { return false; } };
/** A silent utterance inside a tap, so that iOS lets the stage speak later. */
function unlockSpeech(): void {
  try { if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(""); u.volume = 0; speechSynthesis.speak(u); } } catch { /* no speech */ }
}

/** Mount the reader for story `id` into `page`; returns its teardown. */
export function mountReader(page: HTMLElement, id: string, close: () => void): () => void {
  let gone = false, stopTimer = 0;
  const cleanups: (() => void)[] = [];
  const back = btn("st-back", "←", close, { "aria-label": "Back to the stories" });
  // the sound button works before the stage exists: the choice is saved, and the stage takes it when it mounts
  let soundStage: { setSound(on: boolean): void } | null = null, noVoiceSaid = false;
  const sound = el("button", { class: "st-back st-sound", type: "button" });
  const drawSound = () => {
    const on = pref("sound", false);
    sound.innerHTML = on ? SOUND_ON : SOUND_OFF;
    sound.setAttribute("aria-label", on ? "Sound on: tap to mute" : "Sound off: tap to turn it on");
    sound.setAttribute("aria-pressed", String(on));
  };
  sound.onclick = () => {
    const on = !pref("sound", false);
    setPref("sound", on);
    if (on) unlockSpeech();
    soundStage?.setSound(on);
    drawSound();
    if (on && !noVoiceSaid && !trVoiceHere()) { noVoiceSaid = true; toast("This device has no Turkish voice, so the lines stay silent. Add one in its speech settings."); }
  };
  drawSound();
  // the translations of every line at once: on or off for the whole dialogue, whatever the help language
  const trans = el("button", { class: "st-back st-tlbtn", type: "button" });
  const drawTl = () => {
    const on = tlOn(), H = tlLangs();
    trans.textContent = H.en && H.fa ? "EN·FA" : H.fa ? "FA" : H.ru ? "RU" : "EN";
    trans.setAttribute("aria-label", on ? "Translations shown: tap to hide them" : "Translations hidden: tap to show them");
    trans.setAttribute("aria-pressed", String(on));
    page.classList.toggle("st-notl", !on);
  };
  trans.onclick = () => { setPref("tl", !tlOn()); drawTl(); };
  drawTl();
  const body = el("div", { class: "st-body" }, el("p", { class: "hint", role: "status", text: "Setting the stage…" }));
  page.replaceChildren(back, trans, sound, body);

  void (async () => {
    await loadStories();
    const raw = stories.value.find((s) => s.id === id);
    if (!raw) { body.replaceChildren(el("p", { class: "hint", text: "That story isn't here." })); return; }
    if (!openStories().some((s) => s.id === id)) { body.replaceChildren(el("p", { class: "hint", text: "This story isn't out yet." })); return; }
    // the stage's bundle and the gloss model load side by side
    const gloss = loadGlossModel();
    let P: Player;
    try { P = await loadLib("player"); } catch { body.replaceChildren(el("p", { class: "hint", text: "The stage could not load. Check your connection and try again." })); return; }
    if (gone) return;
    G = await gloss;
    stopTimer = run(P, personalize(raw, undefined) as Story);
  })();

  function run(P: Player, story: Story): number {
    const name = studentName();
    page.setAttribute("aria-label", textIn(story.title, "tr"));
    const mech = story.arc?.mechanics ?? [];

    // ---- tap-to-translate: the story's glossary first, then the app's word cards ----
    const idx: GlossIndex = G.buildGlossIndex([...S.cards.values()]);
    const lookup = (word: string) => {
      const w = word.toLocaleLowerCase("tr").replace(/[’]/g, "'");
      const own = story.gl?.[w];
      if (own) return { lines: [{ text: own.en ?? "" }, ...(own.ru ? [{ text: own.ru, lang: "ru" }] : []), ...(own.fa ? [{ text: own.fa, lang: "fa", dir: "rtl" as const }] : [])] };
      const hit = G.glossSegments(word, idx, null).find((s) => s.hit)?.hit;
      if (!hit) return null;
      const c = hit.card as { id?: string; tr?: string; en?: string; fa?: string } | undefined;
      return { head: c?.tr && c.tr.toLocaleLowerCase("tr") !== w ? c.tr : undefined, lines: [{ text: hit.en || c?.en || "" }, ...(c?.fa ? [{ text: c.fa, lang: "fa", dir: "rtl" as const }] : [])], note: hit.note || undefined, known: !!(c?.id && S.box?.[c.id]) };
    };
    const gloss = {
      lookup: (word: string) => lookup(word),
      open: (word: string, g: { head?: string; lines: { text: string; lang?: string }[]; note?: string }, anchor: HTMLElement) => {
        // the meaning in the help language (English when it is "none"); the other one only when that one is missing
        // (Russian where the story's glossary has it, else English)
        const pick = (lang?: string) => g.lines.find((l) => l.lang === lang)?.text, ml = meaningLang();
        const en = ml === "ru" ? pick("ru") || pick(undefined) : pick(undefined), fa = pick("fa");
        showGloss(anchor, word, { en: ml !== "fa" || !fa ? en : undefined, fa: (ml !== "en" && ml !== "ru") || !en ? fa : undefined, note: g.head ? `form of «${g.head}»` : g.note });
      },
      speak: (word: string) => speak(word),
    };
    const glossed = (text: string) => { const s = el("span", { lang: "tr", class: "st-tr" }); P.glossInto(s, text, gloss, { text, lang: "tr" }); return s; };

    // ---- layout ----
    const narrator = pup("idle", 56, { pose: "head", enter: false, label: "Kerim" });
    // the stage sizes her window to the stage: she fills it rather than keeping pup's fixed size
    narrator.style.width = narrator.style.height = "100%";
    const stageBox = el("div", { class: "st-stage", role: "region", "aria-label": "The stage" });
    const still = el("div", { class: "st-still", hidden: true });
    const log = el("div", { class: "st-log", "aria-live": "polite" });
    const foot = el("div", { class: "st-foot" });
    const theatreQ = matchMedia("(orientation: landscape) and (min-height: 420px), (min-width: 900px)");
    // the reader's settings are the Profile's Stories card (Settings.tsx)
    const theatre = () => storyView() === "theatre" || (storyView() === "auto" && theatreQ.matches);
    body.replaceChildren(el("div", { class: "st-stagewrap" }, stageBox, still), log, foot);

    // ---- the stage ----
    const storyPlaces = Object.fromEntries(Object.entries(places.value).filter(([pid]) => JSON.stringify(story).includes(`"${pid}"`)).map(([pid, p]) => [pid, personalize(p, undefined)])) as Record<string, never>;
    const chars = Object.fromEntries(Object.entries(characters.value).map(([cid, c]) => [cid, personalize(c, undefined)])) as Record<string, never>;
    const picksByStory = Object.fromEntries(Object.entries(S.st as Record<string, StRecord>).map(([k, v]) => [k, v?.ch]));
    const flags = P.flagsOf(stories.value as never[], picksByStory);
    const adapted = P.adaptStory(story as never, { places: storyPlaces, characters: chars, learner: S.char ? P.learnerAvatar(S.char) : null, personalise: (t: string, lang?: string) => personalizeStr(t, lang ?? "tr"), flags });
    let lost = false;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const placeName = (pid: string) => { const p = places.value[pid] as { name?: Record<string, string> } | undefined; return p?.name?.tr ?? pid; };
    const showStill = (on: boolean) => { lost = on; still.hidden = !on; still.textContent = on ? placeName(story.place) : ""; };
    void (async () => {
      // the set families and the voices (the data manifest, then the story's clips) load side by side
      const manifestP = fetch("/data/manifest.json").then((r) => r.json()).catch(() => ({}));
      const voiceP = manifestP.then((m: { voices?: string }) => P.storyVoice(story.id, m.voices, (t) => personalizeName(t, "tr")));
      const kit = await P.kitFor(Object.values(adapted.load.places ?? {}) as never[]);
      if (gone) return;
      const manifest = await manifestP, voice = await voiceP;
      const stage = P.stageFor(stageBox, kit, { theatre: theatre(), gloss, motion: reduce ? "still" : undefined, sounds: manifest.sounds, onContext: showStill, voice });
      if (!stage.webgl) showStill(true);
      soundStage = stage;
      if (pref("sound", false)) {
        stage.setSound(true);
        // iOS speaks only after a first utterance inside a tap: the first tap anywhere in the story (Devam) gives it one
        page.addEventListener("pointerdown", unlockSpeech, { once: true, capture: true });
      }
      cleanups.push(() => stage.destroy());
      const ix = P.interact(stage, { explore: mech.includes("explore") });
      const pt = P.propText(stage);
      cleanups.push(() => pt.destroy());
      void ix;
      start(stage);
    })();

    function applyView() { cur?.stage.setBubbles(theatre()); page.classList.toggle("st-theatre", theatre()); line2view(); }
    page.classList.toggle("st-theatre", theatre());
    // turning the phone switches between log and theatre in Auto
    theatreQ.addEventListener("change", applyView);
    cleanups.push(() => theatreQ.removeEventListener("change", applyView));

    let cur: { stage: ReturnType<Player["stageFor"]>; player: ReturnType<Player["storyPlayer"]> } | null = null;
    // Devam only where there is a line to read: after the opening, a scene change, a stage beat or a sound, and after the
    // learner's own line (one they said or picked: they have just read it), the next cue plays by itself after a short hold.
    // `lastCue` is the cue played last (null: the opening scene, shown at load).
    let lastCue: { kind: string; tr?: string } | null = null, onwardFor = -1, onwardTimer = 0;
    const wordless = (c: { kind: string; tr?: string } | null) => !c || c.kind === "scene" || c.kind === "beat" || c.kind === "react" || c.kind === "say" || !c.tr?.trim();
    cleanups.push(() => clearTimeout(onwardTimer));
    function start(stage: ReturnType<Player["stageFor"]>) {
      const player = P.storyPlayer(stage as never, adapted, {
        onCue: (info) => { lastCue = info; addLog(info); },
        onChange: () => draw(),
        loadOptions: { narratorEl: narrator, onNarratorTalk: (talking: boolean, text: string) => kerimTalk(narrator, talking ? talkMs(text) : 0), narratorSound: "coo" },
      });
      cur = { stage, player };
      draw();
    }

    // ---- the log ----
    const who = (id?: string) => (id === "nima" ? name : (story as { names?: Record<string, string> }).names?.[id ?? ""] ?? (textIn((characters.value[id ?? ""] as { name?: Record<string, string> } | undefined)?.name, "tr") || id || ""));
    function addLog(i: Text3 & { kind: string; who?: string; step: number }) {
      if (i.kind === "spot") {
        const st = story.steps[i.step] as { spot?: { lesson?: string } }, lesson = st?.spot?.lesson;
        log.append(el("div", { class: "st-spot" }, pup("think", 40, { pose: "head", enter: false }),
          el("div", null, i.tr ? glossed(i.tr) : null, ...tl(i.text ?? i),
            lesson ? btn("linkish", "Open the lesson", () => openLesson(lesson)) : null)));
      } else if (i.tr) {
        // a chat line: the speaker's head in a small circle (named for screen readers), and the line in a bubble out of it;
        // the learner's own lines from the other side. A beat (a sound word) has no speaker: a plain line in the middle.
        const text = i.tr.trim() === "…" ? el("span", { text: "…" }) : glossed(i.tr);
        const beat = i.kind === "beat" || !i.who, me = i.who === "nima", name = beat ? "" : who(i.who);
        const av = beat ? null : me ? myPortrait(32, "st-av")
          : i.who === "kerim" ? pup("idle", 32, { pose: "head", enter: false, label: name })
          : castPortrait(i.who!, (characters.value[i.who!] as { avatar?: unknown } | undefined)?.avatar, 32, "st-av", name);
        if (av) { av.title = name; av.classList.add("st-av"); }
        const line = el("div", { class: "st-line" + (me ? " me" : "") + (beat ? " beat" : "") }, av, el("div", { class: "st-bub" }, text, ...tl(i.text ?? i)));
        log.append(line);
      }
      line2view();
    }
    // the newest line is always in view: at the bottom of the log's own box in theatre, just above the footer in log mode
    // It measures rather than asks scrollIntoView (which, under the sticky stage and footer, can leave the page where it was):
    // once the line is laid out, and again after its 0.2 s growth into the newest line's size.
    let l2vFrame = 0, l2vTimer = 0;
    function line2view() {
      if (!log.lastElementChild) return;
      cancelAnimationFrame(l2vFrame); l2vFrame = requestAnimationFrame(placeLast);
      clearTimeout(l2vTimer); l2vTimer = window.setTimeout(placeLast, 260);
    }
    function placeLast() {
      const last = log.lastElementChild as HTMLElement | null;
      if (!last || gone) return;
      const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
      logRO.observe(last);
      const inBox = theatre() && !lost;
      if (inBox) log.scrollTo({ top: log.scrollHeight, behavior });
      // the line (in theatre, the log's own box) ends just above the footer
      const gap = (inBox ? log : last).getBoundingClientRect().bottom - foot.getBoundingClientRect().top + 8;
      if (gap > 0) page.scrollBy({ top: gap, behavior });
    }
    cleanups.push(() => { cancelAnimationFrame(l2vFrame); clearTimeout(l2vTimer); });
    // a line grows after it lands (the newest line's larger type, a portrait drawn in): keep it in view then too
    const logRO = new ResizeObserver(() => line2view());
    logRO.observe(log);
    cleanups.push(() => logRO.disconnect());
    // the footer (Devam, the reply card) sits over the page's bottom: lines keep clear of it, and a taller card scrolls them up
    const footRO = new ResizeObserver(() => { page.style.setProperty("--st-foot", foot.offsetHeight + "px"); line2view(); });
    footRO.observe(foot);
    cleanups.push(() => footRO.disconnect());

    // ---- the footer ----
    /** The head of the learner's card: their own face and "your turn" (the Turkish, and the gloss under it). */
    const turnHead = (en: string) => el("div", { class: "st-turn-h" }, myPortrait(26, "st-av"), el("b", { lang: "tr", text: "Senin sıran" }), el("small", { text: en }));
    /**
     * The reply card: the learner's line as a bubble of theirs, about to be said. With a microphone, saying it aloud is the main
     * action (the round mic beside the bubble) and "Say it for me" is the quiet way on; without one, Söyle sends it.
     */
    function replyCard(line: HTMLElement, t: { en?: string; fa?: string; ru?: string } | undefined, onSay: () => void, aloud: Aloud | null = null) {
      const send = aloud ? aloud.mic : el("button", { class: "btn primary st-send", type: "button", onclick: onSay }, el("span", { text: "Söyle" }),
        el("span", { class: "st-send-i", "aria-hidden": "true", text: "➤" }));
      return el("div", { class: "card st-card st-reply" }, turnHead(aloud ? "say your line aloud" : "your line"),
        el("div", { class: "st-reply-b" }, el("div", { class: "st-bub st-mine" }, line, ...tl(t)), send),
        aloud ? el("div", { class: "st-aloud" }, aloud.status, btn("linkish st-skip", "Say it for me", () => { aloud.stop(); onSay(); })) : null);
    }
    function card(label: string, opts: Text3[], order: number[], onPick: (authored: number) => void, silent = false) {
      const c = el("div", { class: "card st-card st-choose" }, turnHead(label));
      for (const k of order) {
        const o = opts[k];
        const b = el("button", { class: "st-opt", type: "button", onclick: () => onPick(k) }, el("span", { lang: "tr", text: silent ? "…" : o.tr ?? "" }),
          ...(silent ? [] : tl(o.text ?? o)));
        c.append(b);
      }
      return c;
    }
    /**
     * The microphone for a card: `said` gets which of the `expected` lines was heard (a choice picks that option). A round button
     * with its hint under it ("Tap 🎤 and say it"); it glows until the learner has used it once, so a newcomer sees they can talk.
     */
    function aloudFor(expected: string[], said: (best: number) => void, hint: string): Aloud | null {
      if (!pref("aloud", true) || !voiceOk(P.canListen())) return null;
      const status = el("small", { class: "st-heard", "aria-live": "polite", text: hint });
      let ctl: AbortController | null = null;
      const mic = el("button", { class: "btn primary st-mic" + (pref("micUsed", false) ? "" : " st-mic-new"), type: "button", "aria-label": "Say it aloud", title: "Say it aloud", "aria-pressed": "false" },
        el("span", { "aria-hidden": "true", text: "🎤" }));
      const again = expected.length > 1 ? "Tap 🎤 to try again, or tap your answer." : "Tap 🎤 to try again, or “Say it for me”.";
      mic.onclick = async () => {
        if (ctl) { ctl.abort(); return; }
        const mine = ctl = new AbortController(); mic.setAttribute("aria-pressed", "true"); status.textContent = "Listening… say it in Turkish";
        const r = await P.listenFor(expected, P.tr, { signal: mine.signal, onInterim: (t: string) => { if (!mine.signal.aborted) status.textContent = t; }, match: { names: [name] } });
        // a tap (an option, "Say it for me") or a new card ended this try: what it heard no longer picks anything
        if (mine.signal.aborted || !mic.isConnected) { if (ctl === mine) { ctl = null; mic.setAttribute("aria-pressed", "false"); status.textContent = hint; } return; }
        ctl = null; mic.setAttribute("aria-pressed", "false");
        noteListen(r);
        if (r.heard) { setPref("micUsed", true); mic.classList.remove("st-mic-new"); }
        if (!r.matched && !voiceOk(P.canListen())) { status.textContent = expected.length > 1 ? "The microphone isn't working here. Tap your answer." : "The microphone isn't working here."; mic.remove(); return; }
        if (r.matched) { status.textContent = "✓"; said(r.best); } else status.textContent = (r.heard ? `I heard “${r.heard}”. ` : "I didn't hear you. ") + again;
      };
      return { mic, status, stop: () => { ctl?.abort(); } };
    }
    function draw() {
      if (!cur) return;
      const f = cur.player.footer();
      // busy and devam both offer Devam: keep the button (and its focus) when a cue ends, rather than swapping it mid-tap
      if (f.kind === "devam" && wordless(lastCue) && onwardFor !== f.cue) {
        onwardFor = f.cue;
        const at = f.cue, p = cur.player;
        clearTimeout(onwardTimer);
        onwardTimer = window.setTimeout(() => { if (!gone && cur?.player === p && p.next === at && p.footer().kind === "devam") p.devam(); }, lastCue ? 350 : 1200);
      }
      if (f.kind === "busy" || f.kind === "devam") {
        if (foot.childElementCount === 1 && foot.firstElementChild?.matches("button.st-devam")) return;
        foot.replaceChildren(btn("btn primary block st-devam", "Devam", () => cur!.player.devam())); return;
      }
      foot.replaceChildren();
      if (f.kind === "end") { quiz(); return; }
      const t = f.turn;
      if (t.kind === "say") {
        const o = t.options[0];
        foot.append(t.silent
          ? replyCard(el("span", { text: "…" }), undefined, () => cur!.player.say())
          : replyCard(glossed(o.tr ?? ""), o.text ?? o, () => cur!.player.say(), aloudFor([o.tr ?? ""], () => cur!.player.say(), "Tap 🎤 and say it in Turkish")));
      } else if (t.kind === "choice") {
        const order = shuffled(t.options.length, `${story.id}:${t.id}:${record(story.id).reads ?? 0}`);
        const al = aloudFor(t.options.map((o) => o.tr ?? ""), (k) => cur!.player.choose(k), "Tap 🎤 and say one, or tap it");
        // a tap always picks, even mid-listening: it stops the microphone first, so a late result cannot pick again
        const c = card("choose what to say", t.options, order, (k) => { al?.stop(); cur!.player.choose(k); });
        if (al) c.append(el("div", { class: "st-aloud" }, al.mic, al.status));
        foot.append(c);
      } else {
        // an act: no Season 1 story has one yet; it plays on stage, with the interaction layer's own list for keyboards
        foot.append(el("div", { class: "card st-card" }, el("small", { text: t.prompt?.en ?? "Your turn on stage" }), el("p", { lang: "tr", text: t.prompt?.tr ?? "" }),
          btn("btn primary", "Sahnede", () => { void cur!.player.act(); })));
      }
    }

    // ---- the quiz (none, one, two or three questions), the record ----
    // A story's `followUp` dialogue is not played: the reading ends at the quiz.
    let firstTry = 0;
    const done = () => finish({}, false);
    function quiz() {
      const items = (story.quiz ?? []) as QuizItem[];
      if (!items.length) { done(); return; }
      let n = 0;
      const ask = () => {
        const q = items[n], order = shuffled(q.options.length, `${story.id}:quiz${n}:${record(story.id).reads ?? 0}`);
        let tries = 0;
        const box = el("div", { class: "card st-quiz" }, el("small", { text: `Question ${n + 1} of ${items.length}` }), el("p", { lang: "tr", class: "st-q", text: textIn(q.q, "tr") }),
          ...tl(q.q));
        const why = el("p", { class: "hint st-why", "aria-live": "polite" });
        // the learner's pick stays marked: a wrong one crossed out (and closed), the right one ticked once found
        for (const k of order) {
          const opt = btn("st-opt", q.options[k], () => {
            tries++;
            if (k !== q.a) { opt.classList.add("no"); (opt as HTMLButtonElement).disabled = true; opt.setAttribute("aria-label", `${q.options[k]}: not this one`); why.textContent = "Not quite. Try again."; return; }
            if (tries === 1) firstTry++;
            opt.classList.add("ok"); opt.setAttribute("aria-label", `${q.options[k]}: right`);
            why.textContent = q.why ? "✓ " + q.why : "✓";
            box.querySelectorAll("button.st-opt").forEach((b) => ((b as HTMLButtonElement).disabled = true));
            box.append(btn("btn primary block", n + 1 < items.length ? "Next question" : "Finish", () => { n++; if (n < items.length) ask(); else done(); }));
          }, { lang: "tr" });
          box.append(opt);
        }
        box.append(why);
        foot.replaceChildren(box);
      };
      ask();
    }

    function finish(fuPicks: Record<string, number>, hadFollowUp: boolean) {
      const ch = { ...(cur?.player.picks ?? {}), ...fuPicks } as Record<string, number | string>;
      const stars = quizStars(firstTry, (story.quiz ?? []).length);
      const { rec, first } = finishRecord(record(story.id), { stars, picks: okPicks(story.steps, ch), ch, fu: hadFollowUp, now: Date.now() });
      (S.st as Record<string, StRecord>)[story.id] = rec;
      if (first) addXp(10);
      bumpDay();
      S.log = (S.log || []).concat([{ d: todayKey(), min: 0, q: (story.quiz ?? []).length, acc: firstTry / Math.max(1, (story.quiz ?? []).length), w: 0, l: 0, st: 1 }]).slice(-30);
      saveProgress();
      if (first) toast("+10 XP");
      const nxt = nextStory();
      foot.replaceChildren(el("div", { class: "card st-end" },
        pup(stars === 3 ? "cheer" : "happy", 72, { enter: true }),
        el("p", { class: "st-stars-big", "aria-label": `${stars} of 3 stars`, text: "★".repeat(stars) + "☆".repeat(3 - stars) }),
        el("p", { lang: "tr", text: stars === 3 ? "Harika!" : "Aferin!" }),
        nxt ? btn("btn primary block", "Next story", () => { close(); setTimeout(() => import("./open.ts").then((m) => m.openStory(nxt.id)), 0); }) : null,
        btn("btn block", "Read it again", () => { firstTry = 0; lastCue = null; onwardFor = -1; log.replaceChildren(); cur?.player.restart(); }),
        btn("linkish", "Back to the stories", close)));
    }

    // the footer follows the performance where animation frames are paused (a hidden tab)
    return window.setInterval(() => cur?.player.tick(), 250);
  }

  return () => { gone = true; clearInterval(stopTimer); for (const f of cleanups.splice(0)) { try { f(); } catch { /* already gone */ } } };
}
