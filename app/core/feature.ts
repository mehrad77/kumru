// The feature contract (app/README.md). A feature's index.ts exports a `feature`; features/index.ts lists them and main.ts
// registers them. core knows no feature: everything a feature adds reaches core through this one door.
import type { ComponentType } from "preact";
import { onPhase, type BootCtx, type BootPhase } from "./boot.ts";
import { addLeaveHook, addOpener, addUrlProvider, registerTab, type RouteOpener, type UrlProvider } from "./router.ts";
import { addSlotFills, type SlotFills } from "./slots.ts";

export interface TabSpec {
  id: string;
  /** Button label and icon name in the tab bar (the bar itself is still index.html's during the migration). */
  label: string;
  icon: string;
  order: number;
  /** Whether this account may open the tab; read inside an effect, so it may read signals. A tab that fails it is hidden and a link to it lands on the Path. */
  when?: () => boolean;
  /** Loaded the first time the tab is shown, so the screen is its own chunk. */
  load: () => Promise<ComponentType>;
}

export interface WebFeature {
  id: string;
  tabs?: TabSpec[];
  /** Deep links: the router parses the URL (`parseRoute`), the feature opens what its key asks for. */
  open?: Record<string, RouteOpener>;
  /** What the address bar shows while this feature has something open; the highest priority that answers wins. */
  url?: UrlProvider[];
  slots?: SlotFills;
  /** What this feature does at each boot step (core/boot.ts); a handler may return a promise, which the next step waits for. */
  boot?: Partial<Record<BootPhase, (ctx: BootCtx) => void | Promise<void>>>;
  /** Called when the learner switches tab, with the tab they leave for. */
  onLeave?: (tab: string) => void;
}

const registered = new Map<string, WebFeature>();

export function registerFeature(f: WebFeature): void {
  if (registered.has(f.id)) throw new Error("feature registered twice: " + f.id);
  registered.set(f.id, f);
  for (const t of f.tabs ?? []) registerTab(t.id, { kind: "lazy", load: t.load }, t.when);
  for (const [key, fn] of Object.entries(f.open ?? {})) addOpener(key, fn);
  for (const p of f.url ?? []) addUrlProvider(p);
  if (f.slots) addSlotFills(f.slots);
  for (const [phase, fn] of Object.entries(f.boot ?? {}) as [BootPhase, (ctx: BootCtx) => void | Promise<void>][]) onPhase(phase, fn);
  if (f.onLeave) addLeaveHook(f.onLeave);
}

export const features = (): WebFeature[] => [...registered.values()];
