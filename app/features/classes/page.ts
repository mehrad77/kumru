// A class is a full page (like a lesson), not a sheet: sheets (members, forms) still open above it. DOM only: the page's frame is
// built here, in the entry chunk, and the body draws into it once Preact and its chunk have loaded. The page shares the history
// stack of the other full-screen pages (core/overlay.ts) and shows /c/<code> in the address bar while it is open.
import type { ComponentType } from "preact";
import { ICON, el } from "../../core/dom.ts";
import { ovlClose, ovlOpen, syncOvlLock } from "../../core/overlay.ts";
import { syncUrl } from "../../core/router.ts";
import { mountInto } from "../../ui/open.ts";

let pageEl: HTMLElement | null = null;

/** The code of the class on screen, for the address bar. */
export const pageCode = (): string | null => pageEl?.dataset.code || null;

const teardown = (): void => {
  if (pageEl) { pageEl.remove(); pageEl = null; }
  syncOvlLock();
  syncUrl();
};
export const closePage = (): void => { if (pageEl) ovlClose(teardown); };

/** Show the page (replacing the one on screen, if any) and draw `load()` into it. */
export function showPage<P extends object>(code: string, title: string, load: () => Promise<ComponentType<P>>, props: P): void {
  const first = !pageEl;
  if (pageEl) pageEl.remove();
  const back = el("button", { class: "lp-back", type: "button", "aria-label": "Back", onclick: closePage });
  back.innerHTML = ICON.back;
  const wrap = el("div", { class: "lp-wrap" });
  pageEl = el("div", { class: "lesson-page cl-page", role: "dialog", "aria-modal": "true", "aria-label": title },
    el("div", { class: "lp-bar" }, back, el("div", { class: "lp-crumb" }, el("span", { text: "Class" })), el("span")), wrap);
  pageEl.dataset.code = code;
  document.body.appendChild(pageEl);
  if (first) ovlOpen(teardown);
  syncOvlLock();
  syncUrl();
  void mountInto(wrap, load, props);
}
