// Tabs, deep links and the address bar. A tab is a Preact component (or a lazy one). Deep links are parsed once (`parseRoute`, core/route.ts); the feature
// that owns the screen registers an opener for its key, and a URL provider for what the address bar shows while its
// overlay is open (core/feature.ts).
import { effect } from "@preact/signals-core";
import type { ComponentType } from "preact";
import { TABS, TAB_ALIAS, TAB_PATH, parseRoute, type Route, type TabId } from "./route.ts";
import { $ } from "./dom.ts";
import { toast } from "../ui/toast.ts";
import { S, redrawTick } from "./store.ts";

/** A Preact component, or one loaded on first use (its own chunk). */
export type TabSource =
  | { kind: "preact"; component: ComponentType }
  | { kind: "lazy"; load: () => Promise<ComponentType> };

const tabs = new Map<string, TabSource>();

/** What opens a deep link (`lesson`, `story`, `card`, `unit`, `onb`, `kerim`), registered by the feature that owns the screen. */
export interface RouteOpener {
  open: (value: string) => void;
  /** Ready when the data the screen needs has loaded; read inside an effect, so it may read signals. */
  needs?: () => boolean;
  /** A link to something that no longer exists lands on `gone[1]` with the message `gone[0]` instead of a blank page. */
  exists?: (value: string) => boolean;
  gone?: [message: string, tab: string];
}
/** What the address bar shows while a feature has something open. */
export interface UrlProvider { priority: number; current: () => string | null }

const openers = new Map<string, RouteOpener>();
const urlProviders: UrlProvider[] = [];
const leaveHooks: ((tab: string) => void)[] = [];

export const addOpener = (key: string, o: RouteOpener): void => { openers.set(key, o); };
export const addUrlProvider = (p: UrlProvider): void => { urlProviders.push(p); urlProviders.sort((x, y) => y.priority - x.priority); };
/** The URL of what is on screen now: the highest-priority provider that has an answer, else the tab's own path. */
export function urlFor(): string {
  for (const p of urlProviders) { const u = p.current(); if (u) return u; }
  return TAB_PATH[S.tab as TabId] || "/stories";
}
export const addLeaveHook = (fn: (tab: string) => void): void => { leaveHooks.push(fn); };

const tabWhen = new Map<string, () => boolean>();
/** Whether this account may open the tab (a tab without a `when` is always open). */
const tabOn = (id: string): boolean => tabWhen.get(id)?.() ?? true;

export function registerTab(id: string, source: TabSource, when?: () => boolean): void {
  tabs.set(id, source);
  if (!when) return;
  tabWhen.set(id, when);
  // the tab bar's button follows the rule as the signals it reads change (who is signed in, whether they may edit)
  effect(() => { const b = document.querySelector<HTMLElement>(`#tabs [data-tab="${id}"]`); if (b) b.hidden = !when(); });
}

/** Preact is loaded the first time a Preact tab is drawn, so a learner who never opens one never downloads it. */
function draw(component: ComponentType, id: string): void {
  // `@preact/signals` hooks Preact so a component redraws when a signal it read changes; it must be loaded before the first draw
  Promise.all([import("preact"), import("@preact/signals")]).then(([{ h, render }]) => render(h(component, null), $("#p-" + id)), (e) => console.warn("preact failed to load", e));
}

function renderTab(id: string): void {
  const src = tabs.get(id);
  if (!src) return;
  if (src.kind === "preact") draw(src.component, id);
  else {
    src.load().then((component) => {
      tabs.set(id, { kind: "preact", component });
      if (S.tab === id) renderTab(id);
    }, (e) => console.warn("tab " + id + " failed to load", e));
  }
}

/** Show a tab (an old name is mapped, a tab this account may not open becomes Stories, the home tab), and draw it. */
export function setTab(requested: string): void {
  let t = TAB_ALIAS[requested] || requested;
  S.wantLab = t === "lab";
  S.wantPeople = t === "people";
  if (t === "people" && !S.canEdit) t = "stories";
  if (t === "lab" && !tabOn("lab")) t = "stories";
  if (!(TABS as readonly string[]).includes(t)) t = "stories";
  S.tab = t;
  for (const fn of leaveHooks) fn(t);
  document.querySelectorAll<HTMLElement>("#tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === t ? "true" : "false"));
  for (const k of TABS) $("#p-" + k).hidden = k !== t;
  renderTab(t);
  window.scrollTo(0, 0);
  syncUrl();
}

/** Redraw whatever tab is showing (not during a study session). */
export function rerender(): void {
  if (S.session) return;
  redrawTick.value++;
  renderTab(S.tab);
}

/** The Owner and Lab tabs show only to those who may open them; an editor who reloads on one lands back on it once their rights are known. */
export function showAdminTab(): void {
  const people = document.querySelector<HTMLElement>('#tabs [data-tab="people"]');
  if (people) people.hidden = !S.canEdit;
  if (S.wantLab && tabOn("lab") && S.tab !== "lab") setTab("lab");
  if (S.wantPeople && S.canEdit && S.tab !== "people") setTab("people");
}

/** What was asked for when the page loaded. */
export const BOOT: Route = parseRoute(location.pathname, location.hash);
const DEEP = ["lesson", "story", "card", "unit", "onb", "kerim"] as const;

// The URL stays as the deep link until its screen has opened (`hold`); the sign-in gate leaves it alone (`gated`), so signing in
// reloads onto the page that was asked for; the Yeni consent sheet holds it until answered.
let hold = !!(DEEP.some((k) => BOOT[k]) || BOOT.connect);
let gated = false;
export const holdUrl = (v: boolean): void => { hold = v; };
export const setGated = (v: boolean): void => { gated = v; };

/** Put the address bar in step with what is on screen. */
export function syncUrl(): void {
  if (hold || gated) return;
  try {
    const u = urlFor() + location.search;
    if (location.pathname + location.search + location.hash !== u) history.replaceState(null, "", u);
  } catch { /* history is not available */ }
}

/** Open the screen a deep link names, as soon as the data it needs has loaded (or say so after 10 seconds). */
export function routeOpen(R: Route = BOOT): void {
  if (R.connect) return; // the consent sheet opened at boot and keeps the URL until it is answered
  const key = DEEP.find((k) => R[k]);
  const o = key && openers.get(key);
  if (!key || !o) { hold = false; return syncUrl(); }
  const value = R[key] === true ? "" : String(R[key]);
  let finished = false;
  let dispose = () => {};
  const timer = setTimeout(() => finish(false), 10000);
  const finish = (ready: boolean) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    dispose();
    hold = false;
    if (ready) {
      if (o.exists && o.gone && !o.exists(value)) { toast(o.gone[0]); setTab(o.gone[1]); }
      else o.open(value);
    } else {
      toast("That page isn't available right now.");
      setTab(R.tab || "stories");
    }
    syncUrl();
  };
  dispose = effect(() => { if (!finished && (!o.needs || o.needs())) finish(true); });
  if (finished) dispose();
}

/** An old #link typed or followed while the page is open. */
function onHashChange(): void {
  if (!location.hash) return;
  const R = parseRoute("/", location.hash);
  if (R.card) openers.get("card")?.open(R.card);
  else if (R.onb) openers.get("onb")?.open("full");
  else if (R.kerim) openers.get("kerim")?.open("");
  else if (R.tab && R.tab !== S.tab) setTab(R.tab);
  try { history.replaceState(null, "", urlFor() + location.search); } catch { /* history is not available */ }
}

/** Wire the tab bar. Called once at boot, when the page's markup is there. */
export function initRouter(): void {
  $("#tabs").addEventListener("click", (e) => {
    const b = (e.target as Element).closest<HTMLElement>("button");
    if (b && b.dataset.tab) setTab(b.dataset.tab);
  });
  window.addEventListener("hashchange", onHashChange);
}

export type { TabId };
