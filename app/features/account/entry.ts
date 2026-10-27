// What the other features and the boot call in the account feature (index.ts): the sign-in gate and the form sheet. DOM only: this
// module is in the entry chunk, and each Preact screen loads when it is first drawn.
import { el } from "../../core/dom.ts";
import { setGated } from "../../core/router.ts";
import { getToken } from "../../host/transport.ts";
import type { Field, FormOptions } from "./forms.tsx";
import { mountInto, openIsland } from "../../ui/open.ts";
import { flags } from "./state.ts";

/** Show the sign-in gate and nothing else (boot, without a session). `context` is a note above the buttons (the reader's
 * /connect/yeni). The app behind it can't be reached by keyboard or screen reader; the toast stays reachable. */
export function openGate(context: Node | null): void {
  setGated(true);
  document.body.classList.add("gated");
  for (const c of Array.from(document.body.children) as HTMLElement[]) if (c.tagName !== "SCRIPT" && c.id !== "toast") c.inert = true;
  const back = el("div", { class: "gate-back" });
  document.body.append(back);
  void mountInto(back, () => import("./Gate.tsx").then((m) => m.Gate), { context });
  // a session saved while a sheet was dismissed: carry on signed in. Never while the recovery code is on screen.
  setInterval(() => { if (getToken() && !flags.recoveryOpen && !document.querySelector(".sheet-back")) location.reload(); }, 1000);
}

/** A form sheet (forms.tsx AccForm) for another feature's own forms (joining a class). */
export function accForm(title: string, fields: Field[], submit: string, action: (v: Record<string, string>) => Promise<unknown>, o: FormOptions = {}): void {
  openIsland(title, title, () => import("./forms.tsx").then((m) => m.AccForm), { fields, submit, action, ...o });
}
