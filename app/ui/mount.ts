// `mountIsland` puts a Preact component into an element built with `el()`. Such elements get redrawn by `replaceChildren`,
// which would leak the mounted tree and its signal effects, so an island unmounts itself when its host leaves the document.
// Preact loads on first use; this module imports it only as a type, so the entry chunk stays free of it.
import type { ComponentType } from "preact";

const hosts = new Set<Element>();
let render: ((vnode: unknown, parent: Element) => void) | null = null;
let observer: MutationObserver | null = null;

function sweep(): void {
  for (const h of hosts) {
    if (h.isConnected) continue;
    hosts.delete(h);
    render?.(null, h);
  }
  if (!hosts.size) { observer?.disconnect(); observer = null; }
}

/** Render `component` into `host` (Preact loads on first use). Returns a function that unmounts it. */
export async function mountIsland<P extends object>(host: Element, component: ComponentType<P>, props?: P): Promise<() => void> {
  // `@preact/signals` hooks Preact so a component redraws when a signal it read changes
  const [preact] = await Promise.all([import("preact"), import("@preact/signals")]);
  render = preact.render as typeof render;
  preact.render(preact.h(component as ComponentType<object>, (props ?? null) as object | null), host);
  hosts.add(host);
  if (!observer) { observer = new MutationObserver(sweep); observer.observe(document.body, { childList: true, subtree: true }); }
  return () => { hosts.delete(host); preact.render(null, host); };
}
