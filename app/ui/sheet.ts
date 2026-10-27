// Sheets: modal dialogs over the page. One stack for all of them; `closeSheet` closes the topmost.
//
// `labSheet` is the contract: everything behind it (the app, or the sign-in gate) is inert while it is open, Tab stays inside,
// and closing it gives focus back to what opened it. The X, the backdrop and Escape go through `dismissSheet`, so a sheet can
// take those over by setting `sheet.parentNode._onDismiss` (the consent sheet cancels, the recovery code stays).
// `confirmSheet` is the destructive-action sheet (docs: app/README.md): a red button, and `type: <name>` for the worst ones.
import { ICON, el } from "../core/dom.ts";
import { syncUrl } from "../core/router.ts";
import { pup } from "./kerim/kerim.ts";

type Back = HTMLElement & { _restore?: () => void; _onDismiss?: () => void };
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const topSheet = (): Back | null => document.querySelector<Back>(".sheet-back");

export function closeSheet(): void {
  const b = topSheet();
  if (b) { b._restore?.(); b.remove(); }
  // onboarding and full pages keep the page behind them from scrolling too
  if (!document.querySelector(".onb-back")) document.body.classList.remove("sheet-open");
  syncUrl();
}

/** The learner closing a sheet (X, the backdrop, Escape): the sheet may take that over. */
export function dismissSheet(): void {
  const b = topSheet();
  if (b && b._onDismiss) b._onDismiss();
  else closeSheet();
}

export function labSheet(title: string, aria: string | null, ...kids: (Node | string | null)[]): HTMLElement {
  closeSheet();
  const prev = document.activeElement as HTMLElement | null;
  const back = el("div", { class: "sheet-back", onclick: (e: Event) => { if (e.target === back) dismissSheet(); } }) as Back;
  const x = el("button", { class: "s-close", type: "button", "aria-label": "Close", onclick: dismissSheet });
  x.innerHTML = ICON.close;
  const sheet = el("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": aria || title, tabindex: "-1" },
    el("div", { class: "sheet-h" }, el("h2", { class: "rv-h" }, pup("think", 40), title), x), ...kids);
  back.appendChild(sheet);
  const held: HTMLElement[] = [];
  for (const c of Array.from(document.body.children) as HTMLElement[]) {
    if (c.tagName === "SCRIPT" || c.id === "toast" || c.inert) continue;
    c.inert = true;
    held.push(c);
  }
  back._restore = () => {
    for (const c of held) c.inert = false;
    if (prev && prev.isConnected && prev !== document.body && !prev.closest("[inert]")) try { prev.focus(); } catch { /* not focusable */ }
  };
  back.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = [...sheet.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => !n.closest("[hidden]"));
    if (!f.length) return;
    const i = f.indexOf(document.activeElement as HTMLElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });
  document.body.appendChild(back);
  document.body.classList.add("sheet-open");
  sheet.focus({ preventScroll: true });
  return sheet;
}

export interface ConfirmOptions {
  title: string;
  body: string;
  /** The red button's label (default "Confirm"). */
  label?: string;
  /** The worst actions ask the learner to type this first. */
  type?: string;
  action: () => Promise<unknown> | unknown;
  then?: () => void;
  cancel?: () => void;
  /** How a failed action reads in the sheet. */
  errText?: (e: unknown) => string;
}

export function confirmSheet({ title, body, label, type, action, then, cancel, errText }: ConfirmOptions): void {
  const err = el("p", { class: "acc-err", role: "alert" });
  const inp = type ? el("input", { type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: type, dir: "auto" }) as HTMLInputElement : null;
  const go = el("button", { class: "btn bad block", type: "button", text: label || "Confirm", disabled: type ? true : null }) as HTMLButtonElement;
  if (inp && type) inp.addEventListener("input", () => { go.disabled = inp.value.trim().toLowerCase() !== type.trim().toLowerCase(); });
  go.onclick = async () => {
    go.disabled = true;
    err.textContent = "";
    try { await action(); closeSheet(); if (then) then(); }
    catch (e) { err.textContent = errText ? errText(e) : String((e as Error)?.message || e); go.disabled = false; }
  };
  const back = () => { closeSheet(); if (cancel) cancel(); };
  const sheet = labSheet(title, title, el("div", { class: "acc-form" }, el("p", { class: "hint cf-body", text: body }),
    inp ? el("label", null, "Type “" + type + "” to confirm", inp) : null, err, go,
    el("button", { class: "btn block", type: "button", text: "Cancel", onclick: back })));
  if (cancel) (sheet.parentNode as Back)._onDismiss = back;
  if (inp) setTimeout(() => inp.focus(), 50);
}

/** `confirmSheet` as a question: true when the learner confirms, false when they cancel or dismiss it. */
export function confirmAsk(o: { title: string; body: string; label?: string }): Promise<boolean> {
  return new Promise((done) => confirmSheet({ ...o, action: () => undefined, then: () => done(true), cancel: () => done(false) }));
}

/** Escape closes the top sheet. Wired once at boot. */
export function initSheets(): void {
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && topSheet()) dismissSheet(); });
}
