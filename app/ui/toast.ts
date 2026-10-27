// Toasts: one polite live region (#toast in index.html) above the gate and the sheets. The text goes in a frame after the region
// is shown, so screen readers announce it. A message is a string or a DOM node.
import { $, el } from "../core/dom.ts";

let seq = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

export function toast(msg: string | Node, ms?: number): void {
  const t = $("#toast");
  const n = ++seq;
  t.classList.remove("has-undo");
  t.replaceChildren();
  t.hidden = false;
  setTimeout(() => {
    if (n !== seq || t.hidden) return;
    if (typeof msg === "string") t.textContent = msg;
    else t.replaceChildren(msg);
  }, 30);
  clearTimeout(timer);
  timer = setTimeout(() => { t.hidden = true; }, ms || 3500);
}

/** Drop the toast early (a session does so on its next step). */
export function hideToast(): void {
  const t = $("#toast");
  seq++;
  clearTimeout(timer);
  t.hidden = true;
  t.classList.remove("has-undo");
  t.replaceChildren();
}

/** A toast with one action button (Undo, Reload, …). */
export function actionToast(msg: string | Node, label: string, fn: () => void, ms?: number): void {
  const t = $("#toast");
  seq++;
  t.replaceChildren(el("span", { class: "toast-msg" }, msg as Node | string), el("button", { class: "undo", type: "button", text: label, onclick: () => { hideToast(); fn(); } }));
  t.classList.add("has-undo");
  t.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(hideToast, ms || 5000);
}

export const undoToast = (msg: string | Node, onUndo: () => void): void => actionToast(msg, "Undo", onUndo, 5000);
