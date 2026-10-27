// The story reader (docs/stories/STORIES_STAGE.md §6–§8, STORIES_DESIGN.md §1): the stage on top, the log under it, and the
// footer with Devam or the learner's card; then the quiz, the follow-up dialogue, and the record. DOM-built around Sahne's stage
// from the lazy `player` bundle (app/lib/player.ts); the footer's logic is sahne-story's storyPlayer.
//
// - The stage fills the top of the screen, edge to edge, with only a small back button over it (no title bar).
// - Log mode (an upright phone) leaves the lines to the log under the stage; theatre mode (sideways, a tablet, or the toggle)
//   puts them on stage as bubbles (`stage.setBubbles`).
// - Translations follow the help language (app/core/lang.ts): Persian, English, both, or none (Turkish only); a tapped word
//   always has its meaning.
// - Every line of the newcomer is the learner's to say: a card with Söyle (and the microphone where the week turns `aloud` on and
//   the microphone really works here: voice.ts).
// - A speaker button (top right) turns the stage's sound on or off: the lines in the device's Turkish voice, the place's
//   recordings and Kerim's coo. Off until the learner turns it on (STORIES_STAGE.md §3), then remembered (`kumru:story:sound`). A choice is the same card with 2–3 options, shown shuffled and stored by their authored index.
// - Kerim's grammar spot is a card in the log with the lesson's link (the stage does not act spots out yet).
// - Without WebGL2 (or when the GPU takes the context away) the story reads in the log with the place's name over a still.
import { el } from "../../core/dom.ts";
import { faTxt } from "../../core/i18n.ts";
import { helpLangs, meaningLang } from "../../core/lang.ts";
import { S } from "../../core/store.ts";
import { loadLib } from "../../host/lib.ts";
import { pup, kerimTalk, talkMs } from "../../ui/kerim/kerim.ts";
import { speak } from "../../ui/speech.ts";
import { toast } from "../../ui/toast.ts";
import { openLesson } from "../grammar/index.ts";
import { personalize, personalizeStr, studentName } from "../onboarding/index.ts";
import { loadGlossModel, type GlossIndex } from "../practice/index.ts";
import { addXp, bumpDay, saveProgress, todayKey } from "../progress/index.ts";
import { showGloss } from "../words/index.ts";
import { finishRecord, okPicks, quizStars, shuffled, type StRecord } from "./model/record.ts";
import { pref, setPref, storyView } from "./prefs.ts";
import { characters, loadStories, nextStory, openStories, places, record, stories, type QuizItem, type Story } from "./state.ts";
import { noteListen, voiceOk } from "./voice.ts";

type Player = typeof import("../../lib/player.ts");
let G: Awaited<ReturnType<typeof loadGlossModel>>;
type Lang = "tr" | "en" | "fa";
type Text3 = { tr?: string; en?: string; fa?: string };

const btn = (cls: string, text: string, onclick: () => void, extra: Record<string, unknown> = {}) => el("button", { class: cls, type: "button", text, onclick, ...extra });
/** A line's translations, as the help language asks: English and Persian, either one, or none. */
function tl(en?: string, fa?: string): (HTMLElement | null)[] {
  const H = helpLangs();
  return [H.en && en ? el("small", { class: "tl", text: en }) : null, H.fa && fa ? el("small", { class: "fa", lang: "fa", dir: "rtl", text: faTxt(fa) }) : null];
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
  const body = el("div", { class: "st-body" }, el("p", { class: "hint", role: "status", text: "Setting the stage…" }));
  page.replaceChildren(back, sound, body);

  void (async () => {
    await loadStories();
    const raw = stories.value.find((s) => s.id === id);
    if (!raw) { body.replaceChildren(el("p", { class: "hint", text: "That story isn't here." })); return; }
    if (!openStories().some((s) => s.id === id)) { body.replaceChildren(el("p", { class: "hint", text: "This story isn't out yet." })); return; }
    let P: Player;
    try { P = await loadLib("player"); } catch { body.replaceChildren(el("p", { class: "hint", text: "The stage could not load. Check your connection and try again." })); return; }
    if (gone) return;
    G = await loadGlossModel();
    stopTimer = run(P, personalize(raw, undefined) as Story);
  })();

  function run(P: Player, story: Story): number {
    const name = studentName();
    page.setAttribute("aria-label", story.title);
    const mech = story.arc?.mechanics ?? [];

    // ---- tap-to-translate: the story's glossary first, then the app's word cards ----
    const idx: GlossIndex = G.buildGlossIndex([...S.cards.values()]);
    const lookup = (word: string) => {
      const w = word.toLocaleLowerCase("tr").replace(/[’]/g, "'");
      const own = story.gl?.[w];
      if (own) return { lines: [{ text: own[1] }, { text: own[0], lang: "fa", dir: "rtl" as const }] };
      const hit = G.glossSegments(word, idx, null).find((s) => s.hit)?.hit;
      if (!hit) return null;
      const c = hit.card as { id?: string; tr?: string; en?: string; fa?: string } | undefined;
      return { head: c?.tr && c.tr.toLocaleLowerCase("tr") !== w ? c.tr : undefined, lines: [{ text: hit.en || c?.en || "" }, ...(c?.fa ? [{ text: c.fa, lang: "fa", dir: "rtl" as const }] : [])], note: hit.note || undefined, known: !!(c?.id && S.box?.[c.id]) };
    };
    const gloss = {
      lookup: (word: string) => lookup(word),
      open: (word: string, g: { head?: string; lines: { text: string; lang?: string }[]; note?: string }, anchor: HTMLElement) => {
        // the meaning in the help language (English when it is "none"); the other one only when that one is missing
        const en = g.lines.find((l) => l.lang !== "fa")?.text, fa = g.lines.find((l) => l.lang === "fa")?.text, ml = meaningLang();
        showGloss(anchor, word, { en: ml !== "fa" || !fa ? en : undefined, fa: ml !== "en" || !en ? fa : undefined, note: g.head ? `form of «${g.head}»` : g.note });
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
    const adapted = P.adaptStory(story as never, { places: storyPlaces, characters: chars, learner: S.char ? P.learnerAvatar(S.char) : null, personalise: (t: string, lang?: Lang) => personalizeStr(t, lang ?? "tr"), flags });
    let lost = false;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const placeName = (pid: string) => { const p = places.value[pid] as { name?: Text3 } | undefined; return p?.name?.tr ?? pid; };
    const showStill = (on: boolean) => { lost = on; still.hidden = !on; still.textContent = on ? placeName(story.place) : ""; };
    void (async () => {
      const kit = await P.kitFor(Object.values(adapted.load.places ?? {}) as never[]);
      if (gone) return;
      const manifest = await fetch("/data/manifest.json").then((r) => r.json()).catch(() => ({}));
      const stage = P.stageFor(stageBox, kit, { theatre: theatre(), gloss, motion: reduce ? "still" : undefined, sounds: manifest.sounds, onContext: showStill });
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
    function start(stage: ReturnType<Player["stageFor"]>) {
      const player = P.storyPlayer(stage as never, adapted, {
        onCue: (info) => addLog(info),
        onChange: () => draw(),
        loadOptions: { narratorEl: narrator, onNarratorTalk: (talking: boolean, text: string) => kerimTalk(narrator, talking ? talkMs(text) : 0), narratorSound: "coo" },
      });
      cur = { stage, player };
      draw();
    }

    // ---- the log ----
    const who = (id?: string) => (id === "nima" ? name : (story as { names?: Record<string, string> }).names?.[id ?? ""] ?? (characters.value[id ?? ""] as { name?: string } | undefined)?.name ?? id ?? "");
    function addLog(i: { kind: string; who?: string; tr?: string; en?: string; fa?: string; step: number }) {
      if (i.kind === "spot") {
        const st = story.steps[i.step] as { spot?: { lesson?: string } }, lesson = st?.spot?.lesson;
        log.append(el("div", { class: "st-spot" }, pup("think", 40, { pose: "head", enter: false }),
          el("div", null, i.tr ? glossed(i.tr) : null, ...tl(i.en, i.fa),
            lesson ? btn("linkish", "Open the lesson", () => openLesson(lesson)) : null)));
      } else if (i.tr) {
        const line = el("p", { class: "st-line" + (i.who === "nima" ? " me" : "") }, el("b", { text: i.kind === "beat" ? "" : who(i.who) }), " ",
          i.tr.trim() === "…" ? el("span", { text: "…" }) : glossed(i.tr), ...tl(i.en, i.fa));
        log.append(line);
      }
      line2view();
    }
    // the newest line is always in view: at the bottom of the log's own box in theatre, just above the footer in log mode
    function line2view() {
      const last = log.lastElementChild as HTMLElement | null;
      if (!last) return;
      const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
      if (theatre() && !lost) log.scrollTo({ top: log.scrollHeight, behavior });
      else last.scrollIntoView({ block: "end", behavior });
    }
    // the footer (Devam, the reply card) sits over the page's bottom: lines keep clear of it, and a taller card scrolls them up
    const footRO = new ResizeObserver(() => { page.style.setProperty("--st-foot", foot.offsetHeight + "px"); line2view(); });
    footRO.observe(foot);
    cleanups.push(() => footRO.disconnect());

    // ---- the footer ----
    function card(label: string, opts: Text3[], order: number[], onPick: (authored: number) => void, silent = false) {
      const c = el("div", { class: "card st-card" }, el("small", { text: label }));
      for (const k of order) {
        const o = opts[k];
        const b = el("button", { class: "st-opt", type: "button", onclick: () => onPick(k) }, el("span", { lang: "tr", text: silent ? "…" : o.tr ?? "" }),
          ...(silent ? [] : tl(o.en, o.fa)));
        c.append(b);
      }
      return c;
    }
    function aloudBtn(expected: string[], said: () => void) {
      if (!mech.includes("aloud") || !pref("aloud", true) || !voiceOk(P.canListen())) return null;
      const status = el("small", { class: "st-heard", "aria-live": "polite" });
      let ctl: AbortController | null = null;
      const mic = btn("btn sm", "🎤 Say it", async () => {
        if (ctl) { ctl.abort(); return; }
        ctl = new AbortController(); mic.setAttribute("aria-pressed", "true"); status.textContent = "Listening…";
        const r = await P.listenFor(expected, P.tr, { signal: ctl.signal, onInterim: (t: string) => { status.textContent = t; }, match: { names: [name] } });
        ctl = null; mic.setAttribute("aria-pressed", "false");
        noteListen(r);
        if (!r.matched && !voiceOk(P.canListen())) { wrap.remove(); return; }
        if (r.matched) { status.textContent = "✓"; said(); } else status.textContent = r.heard ? `I heard “${r.heard}”. Try again, or tap Söyle.` : "I didn't hear you. Try again, or tap Söyle.";
      }, { "aria-pressed": "false" });
      const wrap = el("div", { class: "st-aloud" }, mic, status);
      return wrap;
    }
    function draw() {
      if (!cur) return;
      const f = cur.player.footer();
      // busy and devam both offer Devam: keep the button (and its focus) when a cue ends, rather than swapping it mid-tap
      if (f.kind === "busy" || f.kind === "devam") {
        if (foot.childElementCount === 1 && foot.firstElementChild?.matches("button.st-devam")) return;
        foot.replaceChildren(btn("btn primary block st-devam", "Devam", () => cur!.player.devam())); return;
      }
      foot.replaceChildren();
      if (f.kind === "end") { quiz(); return; }
      const t = f.turn;
      if (t.kind === "say") {
        const o = t.options[0];
        const say = btn("btn primary", t.silent ? "…" : "Söyle", () => cur!.player.say());
        foot.append(el("div", { class: "card st-card" }, el("small", { text: name }),
          t.silent ? el("p", { text: "…" }) : el("p", { class: "st-mine" }, glossed(o.tr ?? "")),
          ...(t.silent ? [] : tl(o.en, o.fa)),
          el("div", { class: "st-say" }, say, t.silent ? null : aloudBtn([o.tr ?? ""], () => cur!.player.say()))));
      } else if (t.kind === "choice") {
        const order = shuffled(t.options.length, `${story.id}:${t.id}:${record(story.id).reads ?? 0}`);
        const c = card(`${name}: choose`, t.options, order, (k) => cur!.player.choose(k));
        const al = aloudBtn(t.options.map((o) => o.tr ?? ""), () => undefined);
        if (al) c.append(al);
        foot.append(c);
      } else {
        // an act: no Season 1 story has one yet; it plays on stage, with the interaction layer's own list for keyboards
        foot.append(el("div", { class: "card st-card" }, el("small", { text: t.prompt?.en ?? "Your turn on stage" }), el("p", { lang: "tr", text: t.prompt?.tr ?? "" }),
          btn("btn primary", "Sahnede", () => { void cur!.player.act(); })));
      }
    }

    // ---- the quiz, the follow-up, the record ----
    let firstTry = 0;
    function quiz() {
      const items = (story.quiz ?? []) as QuizItem[];
      if (!items.length) { followUp(); return; }
      let n = 0;
      const ask = () => {
        const q = items[n], order = shuffled(q.options.length, `${story.id}:quiz${n}:${record(story.id).reads ?? 0}`);
        let tries = 0;
        const box = el("div", { class: "card st-quiz" }, el("small", { text: `Question ${n + 1} of ${items.length}` }), el("p", { lang: "tr", class: "st-q", text: q.q }),
          ...tl(q.en, q.fa));
        const why = el("p", { class: "hint st-why", "aria-live": "polite" });
        for (const k of order) {
          box.append(btn("st-opt", q.options[k], () => {
            tries++;
            if (k !== q.a) { why.textContent = "Not quite. Try again."; return; }
            if (tries === 1) firstTry++;
            why.textContent = q.why ? "✓ " + q.why : "✓";
            box.querySelectorAll("button.st-opt").forEach((b) => ((b as HTMLButtonElement).disabled = true));
            box.append(btn("btn primary block", n + 1 < items.length ? "Next question" : "Finish", () => { n++; if (n < items.length) ask(); else followUp(); }));
          }, { lang: "tr" }));
        }
        box.append(why);
        foot.replaceChildren(box);
      };
      ask();
    }

    function followUp() {
      const steps = (story.followUp ?? []) as { who?: string; tr?: string; en?: string; fa?: string; if?: string; unless?: string; choice?: { id: string; options: Text3[] } }[];
      const fuPicks: Record<string, number> = {};
      const passes = (s: { if?: string; unless?: string }) => (!s.if || flags.has(s.if)) && (!s.unless || !flags.has(s.unless));
      let k = 0;
      if (steps.length) log.append(el("hr", { class: "st-fu" }));
      const next = () => {
        while (k < steps.length && !passes(steps[k])) k++;
        if (k >= steps.length) { finish(fuPicks, steps.length > 0); return; }
        const s = steps[k];
        if (s.choice) {
          const c = s.choice, order = shuffled(c.options.length, `${story.id}:${c.id}`);
          foot.replaceChildren(card(`${name}: choose`, c.options, order, (i) => { fuPicks[c.id] = i; addLog({ kind: "say", who: "nima", ...c.options[i], step: -1 }); k++; next(); }));
        } else if (s.who === "nima") {
          foot.replaceChildren(el("div", { class: "card st-card" }, el("small", { text: name }), el("p", null, glossed(s.tr ?? "")),
            btn("btn primary", "Söyle", () => { addLog({ kind: "say", ...s, step: -1 }); speak(s.tr ?? ""); k++; next(); })));
        } else {
          addLog({ kind: "line", ...s, step: -1 });
          foot.replaceChildren(btn("btn primary block", "Devam", () => { k++; next(); }));
        }
      };
      next();
    }

    function finish(fuPicks: Record<string, number>, hadFollowUp: boolean) {
      const ch = { ...(cur?.player.picks ?? {}), ...fuPicks } as Record<string, number | string>;
      const stars = quizStars(firstTry);
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
        btn("btn block", "Read it again", () => { firstTry = 0; log.replaceChildren(); cur?.player.restart(); }),
        btn("linkish", "Back to the stories", close)));
    }

    // the footer follows the performance where animation frames are paused (a hidden tab)
    return window.setInterval(() => cur?.player.tick(), 250);
  }

  return () => { gone = true; clearInterval(stopTimer); for (const f of cleanups.splice(0)) { try { f(); } catch { /* already gone */ } } };
}
