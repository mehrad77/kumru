// The tap-to-translate popup (DOM only: the entry chunk; GlossPop.tsx draws inside it when Preact has loaded). The screens
// call `showGloss` from a tapped word (a `.gw` button or anything marked `data-gl`); a tap anywhere else, or a scroll, closes it.
import { el } from "../../core/dom.ts";
import { speak } from "../../ui/speech.ts";
import { mountInto } from "../../ui/open.ts";

/** What a tapped word means: its Persian and English, a note ("form of «kitap»") and the card it came from, if any. */
export interface GlossInfo { fa?: string; en?: string; note?: string; card?: { id: string; [field: string]: unknown } }
type Pop = HTMLElement & { _a?: Element };

export function closeGloss(): void {
  const p = document.querySelector<Pop>(".gpop");
  if (!p) return;
  p._a?.classList.remove("on");
  p.remove();
}

/** Show the popup for `anchor` (the tapped word), and say the word aloud unless `quiet`. */
export function showGloss(anchor: HTMLElement, word: string, info: GlossInfo, quiet?: boolean): void {
  closeGloss();
  const pop = el("div", { class: "gpop", role: "dialog", "aria-label": word, style: "visibility:hidden" }) as Pop;
  document.body.append(pop);
  anchor.classList.add("on");
  pop._a = anchor;
  void mountInto(pop, () => import("./GlossPop.tsx").then((m) => m.GlossPop), { pop, anchor, word, info });
  if (!quiet) speak(word);
}

document.addEventListener("click", (e) => {
  const t = e.target as Element;
  if (!t.closest(".gpop") && !t.closest(".gw") && !t.closest("[data-gl]")) closeGloss();
});
window.addEventListener("scroll", closeGloss, { passive: true });
