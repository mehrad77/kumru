// Kerim the kumru as a character: `pup` draws her, `setMood` and `kerimTalk` act her, `bubble` and `pupLine` let her speak.
// Her art is in the Sahne kit (sahne-kit/kerim/art, sahne/packages/sahne-kit/src/kerim/art.ts); the CSS that poses and animates it is sahne-kit/kerim.css (imported by app/main.ts).
import { el } from "../../core/dom.ts";
import { KERIM_ART, KERIM_HEAD, K_LAND, K_MOODS, K_ONCE } from "sahne-kit/kerim/art";

export { K_LAND, K_MOODS, K_ONCE };
export * from "sahne-kit/kerim/art";

type Pose = "perched" | "flying" | "hero" | "head";
export interface PupOptions { pose?: Pose; enter?: boolean; talk?: number | true; label?: string }
type KerimEl = HTMLElement & { _l?: ReturnType<typeof setTimeout>; _t?: ReturnType<typeof setTimeout>; _k?: ReturnType<typeof setTimeout> };

const ONCE = K_ONCE as Record<string, number>;

/** How long she talks over a line: its length in ms, between 0.9 and 4.2 s. */
export const talkMs = (t?: string): number => Math.max(900, Math.min(4200, 500 + String(t || "").length * 55));

/**
 * Kerim. Moods: idle happy cheer sad think sleepy, plus greet (a wink and a wing wave); each has its own eyes. cheer and greet
 * play once and settle to happy. opts: pose perched|flying|hero|head, enter (fly in and land; on by default from 80px and for
 * hero), talk (ms, or true), label. Returns span.kerim.<mood>.pose-<pose>.
 */
export function pup(mood: string, size?: number, o: PupOptions = {}): HTMLElement {
  mood = K_MOODS.includes(mood) ? mood : "idle";
  const pose = o.pose || "perched";
  const enter = o.enter ?? (pose !== "head" && (pose === "hero" || (size ?? 0) >= 80));
  const s = el("span", { class: "kerim pose-" + pose, style: size ? `width:${size}px;height:${size}px` : null, role: "img", "aria-label": o.label || "Kerim, your guide" }) as KerimEl;
  s.innerHTML = pose === "head" ? KERIM_HEAD : KERIM_ART;
  s.dataset.base = ONCE[mood] ? "happy" : mood;
  if (enter) {
    s.classList.add("enter-land", s.dataset.base);
    s._l = setTimeout(() => { s.classList.remove("enter-land"); if (ONCE[mood]) setMood(s, mood); }, K_LAND);
  } else setMood(s, mood);
  if (o.talk) setTimeout(() => kerimTalk(s, o.talk === true ? talkMs() : o.talk), enter ? K_LAND : 0);
  return s;
}

/** Swap only the mood classes (pose, enter and talk stay); a one-shot mood restarts when repeated. With `ms`, return to the base mood after it. */
export function setMood(p: HTMLElement | null | undefined, mood: string, ms?: number): void {
  if (!p) return;
  const k = p as KerimEl;
  const base = k.dataset.base || K_MOODS.find((m) => k.classList.contains(m)) || "idle";
  k.dataset.base = base;
  clearTimeout(k._t);
  k.classList.remove(...K_MOODS);
  void k.offsetWidth;
  k.classList.add(mood);
  const back = ms || ONCE[mood];
  if (back) k._t = setTimeout(() => { k.classList.remove(mood); k.classList.add(ms ? base : "happy"); }, back);
}

export function kerimTalk(p: HTMLElement | null | undefined, ms?: number): void {
  if (!p) return;
  const k = p as KerimEl;
  k.classList.add("talk");
  clearTimeout(k._k);
  k._k = setTimeout(() => k.classList.remove("talk"), ms || 1600);
}

/** A speech bubble: Turkish, with the Persian under it. */
export const bubble = (tr: string, fa?: string | null, cls?: string): HTMLElement =>
  el("div", { class: "bubble" + (cls ? " " + cls : "") }, el("div", { class: "b-tr", lang: "tr", text: tr }), fa ? el("div", { class: "b-fa", lang: "fa", dir: "rtl", text: fa }) : null);

export const pupLine = (mood: string, tr: string, fa?: string | null): HTMLElement =>
  el("div", { class: "pupline" }, pup(mood, 44, { talk: talkMs(tr) }), bubble(tr, fa, "sm"));

/** What she says after a right answer (cheer) and a wrong one (oops): [Turkish, Persian]. */
export const PUP: Record<"cheer" | "oops", [string, string][]> = {
  cheer: [["Harika!", "عالی!"], ["Süper!", "فوق‌العاده!"], ["Aferin sana!", "آفرین به تو!"], ["Mükemmel!", "بی‌نقص!"], ["Çok iyi gidiyorsun!", "خیلی خوب پیش می‌روی!"], ["Durmak yok!", "توقف نداریم!"]],
  oops: [["Sorun değil!", "اشکالی نداره!"], ["Hatalar öğretir.", "اشتباه‌ها یاد می‌دهند."], ["Bir dahakine!", "دفعهٔ بعد!"], ["Pes etmek yok!", "ناامید نشو!"]],
};

export const rndOf = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
