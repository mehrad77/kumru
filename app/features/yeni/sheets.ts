// Opening Notebook sheets (DOM only: this module is in the entry chunk, each sheet's Preact component loads when it
// is first drawn). The consent flow is /connect/yeni (docs/AUTH.md); the connections list is the Account card's row.
import { el } from "../../core/dom.ts";
import { mountInto, type SheetBack } from "../../ui/open.ts";
import { labSheet } from "../../ui/sheet.ts";
import type { ConnectLink } from "./ConnectSheet.tsx";

let opened = false;

function open(title: string, aria: string, host: HTMLElement): SheetBack {
  return labSheet(title, aria, host).parentNode as SheetBack;
}

/** The consent sheet for /connect/yeni: it opens at once with a placeholder and fills in when the session is known. Once per page load. */
export function openConnect(): void {
  if (opened) return;
  opened = true;
  openConsent(null);
}

/** The consent sheet; `link` is an already-checked link (back from the "use another account" question). */
export function openConsent(link: ConnectLink | null): void {
  const host = el("div", { style: "display:contents" });
  const back = open("Notebook", "Connect Notebook", host);
  back._onDismiss = () => {};   // until the link is checked, the X, Escape and the backdrop do nothing
  void mountInto(host, () => import("./ConnectSheet.tsx").then((m) => m.ConnectSheet), { back, link, reopen: openConsent });
}

/** The Account card's list of connected readers, each with a Disconnect. */
export function openConnections(): void {
  const host = el("div", { style: "display:contents" });
  open("Notebook", "Notebook", host);
  void mountInto(host, () => import("./Connections.tsx").then((m) => m.Connections), { reopen: openConnections });
}
