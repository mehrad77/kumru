// A full-screen page over the tab (like a lesson or a class): a bar with Back and a small heading, and a Preact body drawn in once
// its chunk has loaded. It shares the history stack of the other full-screen pages (core/overlay.ts), so the phone's back gesture
// and Escape close it. Usable from the entry chunk: the frame is DOM, only the body needs Preact.
import type { ComponentType } from "preact";
import { ICON, el } from "../core/dom.ts";
import { ovlClose, ovlOpen, syncOvlLock } from "../core/overlay.ts";
import { mountInto } from "./open.ts";

/** Open a page titled `title` (the bar's heading and the dialog's name) and draw `load()` into it; returns its close. */
export function openPage<P extends object>(title: string, load: () => Promise<ComponentType<P>>, props: P, cls = ""): () => void {
  let page: HTMLElement | null = null;
  const teardown = () => { page?.remove(); page = null; syncOvlLock(); };
  const close = () => { if (page) ovlClose(teardown); };
  const back = el("button", { class: "lp-back", type: "button", "aria-label": "Back", onclick: close });
  back.innerHTML = ICON.back;
  const wrap = el("div", { class: "lp-wrap" });
  page = el("div", { class: "lesson-page " + cls, role: "dialog", "aria-modal": "true", "aria-label": title },
    el("div", { class: "lp-bar" }, back, el("div", { class: "lp-crumb" }, el("b", { text: title })), el("span")), wrap);
  document.body.appendChild(page);
  ovlOpen(teardown);
  syncOvlLock();
  void mountInto(wrap, load, props);
  return close;
}
