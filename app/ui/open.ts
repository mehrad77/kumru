// Open a sheet whose body is a Preact component (shared by the features: account, yeni, words). The sheet itself (labSheet: focus trap, inert background, Escape) appears at
// once; the component draws into it as soon as Preact and its chunk have loaded. Usable from the entry chunk and from the components.
import type { ComponentType } from "preact";
import { el } from "../core/dom.ts";
import { labSheet } from "./sheet.ts";

/** The sheet's backdrop: `_onDismiss` takes over the X, the backdrop and Escape (ui/sheet.ts). */
export type SheetBack = HTMLElement & { _onDismiss?: () => void };

export function openIsland<P extends object>(title: string, aria: string, load: () => Promise<ComponentType<P>>, props: P): SheetBack {
  const host = el("div", { style: "display:contents" });
  const sheet = labSheet(title, aria, host);
  void mountInto(host, load, props);
  return sheet.parentNode as SheetBack;
}

/** Mount `load()`'s component into `host` (an element the caller has placed). A host that another component is about to place
 * (a node handed to a Preact parent) gets up to 5 seconds to reach the document; one that never does is dropped. */
export async function mountInto<P extends object>(host: Element, load: () => Promise<ComponentType<P>>, props: P): Promise<void> {
  const [{ mountIsland }, component] = await Promise.all([import("./mount.ts"), load()]);
  for (let i = 0; !host.isConnected && i < 100; i++) await new Promise((r) => setTimeout(r, 50));
  if (host.isConnected) await mountIsland(host, component, props);
}
