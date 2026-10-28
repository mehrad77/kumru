// Opening the onboarding (DOM only: this module is in the entry chunk; the flow's Preact component loads when it is first drawn):
// the full-screen dialog on the page, its place on the overlay stack, and when a learner should be offered it.
import { el } from "../../core/dom.ts";
import { ovlClose, ovlOpen } from "../../core/overlay.ts";
import { BOOT, rerender } from "../../core/router.ts";
import { renderUser } from "../../core/shell/appbar.ts";
import { S } from "../../core/store.ts";
import { mountIsland } from "../../ui/mount.ts";
import { flushLater } from "../../ui/later.ts";
import { saveProgress } from "../progress/index.ts";
import { ONB_V, type Mode } from "./model/flow.ts";

/** Opens the flow. Modes: full (new learner), update (existing learner, once), edit (name, character, about), place (retake the placement). */
export function openOnboarding(mode: Mode = "full"): void {
  if (document.querySelector(".onb-back")) return;
  const back = el("div", { class: "onb-back", role: "dialog", "aria-modal": "true", "aria-label": "Welcome" });
  document.body.append(back);
  document.body.classList.add("sheet-open");
  let unmount: (() => void) | null = null, closed = false, loadFailed = false;
  const teardown = () => {
    closed = true;
    unmount?.();
    back.remove();
    document.body.classList.remove("sheet-open");
    if (!loadFailed && (S.onb || 0) < ONB_V) { S.onb = ONB_V; saveProgress(); }
    setTimeout(flushLater, 200);
  };
  // first-time learners can't skip: Escape and the back button don't close it
  if (mode !== "full") ovlOpen(teardown);
  const finish = (after?: () => void) => {
    ovlClose(teardown);
    renderUser();
    rerender();
    if (after) setTimeout(after, 150);
  };
  // a flow that cannot load (offline, a browser that cannot parse the chunk) says so instead of leaving an empty screen; closing it
  // here does not mark the onboarding seen, so it is offered again on the next visit
  const failed = (e: unknown) => {
    console.warn("onboarding", e);
    if (closed) return;
    loadFailed = true;
    back.replaceChildren(el("div", { class: "onb-scroll" }, el("div", { class: "onb" },
      el("h1", { text: "Couldn't load this" }),
      el("p", { text: "Check your connection and try again." }))),
    el("div", { class: "onb-foot" },
      el("button", { class: "btn primary", type: "button", text: "Try again", onclick: () => location.reload() }),
      el("button", { class: "linkish", type: "button", text: "Go to the app", onclick: () => finish() })));
  };
  void import("./Onboarding.tsx").then(async (m) => {
    const un = await mountIsland(back, m.Onboarding, { mode, finish });
    if (closed) un(); else unmount = un;
  }).catch(failed);
}

/** Offers the onboarding when the learner has not seen this version of it: the full flow to a new learner, the short update to one who has practised. */
export function maybeOnboard(): void {
  // not on the reader's /connect/yeni page, which only asks and goes back to the reader: the onboarding waits for the next visit
  if (document.querySelector(".onb-back") || BOOT.connect) return;
  if (S.me && !S.progLoaded) return;
  if ((S.onb || 0) >= ONB_V) return;
  const used = Object.keys(S.stats).length || Object.keys(S.drill).length || Object.keys(S.learned).length || Object.keys(S.days).length || Object.keys(S.st).length;
  openOnboarding(used ? "update" : "full");
}
