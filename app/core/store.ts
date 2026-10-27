// The page's state. `S` is the one state object every screen shares. Fields backed by signals work like this: `S.tab = "path"` and `S.tab` work as
// before, and a Preact component (or `effect`) that reads `signals.tab.value` re-renders when it changes. The other
// fields are plain properties.
//
// A signal notices assignment, not mutation: `S.prefs = {...}` is seen, `S.prefs.lang = "en"` is not. Code that mutates
// calls `rerender()` after such changes, which bumps `redrawTick`; a component that depends on plain-property state reads
// `redrawTick.value` too.
import { signal, type Signal } from "@preact/signals-core";
import { local } from "./local.ts";

export const PREF_DEFAULTS = { lang: "none", corr: "end", tryIt: true, goal: 20 };
export type Prefs = typeof PREF_DEFAULTS & Record<string, unknown>;

/** The fields on signals, with their start values. */
function signalFields() {
  const mlang: string = local.get("mlang", "none");
  return {
    // who is signed in and what they may do (set at boot from the host)
    me: null as string | null,
    db: null as unknown,
    user: null as unknown,
    writable: true,
    canEdit: false,
    profileName: "",
    avatar: "",
    localOnly: false,
    // preferences and what is showing
    prefs: { ...PREF_DEFAULTS, lang: mlang } as Prefs,
    tab: "path",
    wantLab: false,
    wantPeople: false,
    deck: "word",
    ptopic: "",
    plevel: "",
    punit: "",
    dtype: "",
    mlang,
    calMode: local.get("cal", "jal") as string,
    // what has loaded (a deep link opens when the data it needs is in: core/router.ts routeOpen)
    loaded: false,
    gLoaded: false,
    tLoaded: false,
    sLoaded: false,
    progLoaded: false,
  };
}
export type SignalFields = ReturnType<typeof signalFields>;
export type Signals = { [K in keyof SignalFields]: Signal<SignalFields[K]> };

/** The plain (non-signal) fields. Untyped. */
function stateFields(): Record<string, unknown> {
  return {
    cards: new Map(), profiles: new Map(), chars: {}, editingName: false, grammar: [], gq: "", glvl: "",
    session: null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppState = SignalFields & { [field: string]: any };

function defineSignals(S: AppState, signals: Record<string, Signal<unknown>>, initial: Record<string, unknown>): void {
  for (const key of Object.keys(initial)) {
    const sig = signal<unknown>(initial[key]);
    signals[key] = sig;
    Object.defineProperty(S, key, { get: () => sig.value, set: (v) => { sig.value = v; }, enumerable: true, configurable: true });
  }
}

/** A fresh state: `S` with accessors over `signals` for the moved fields. (The app has one; tests make their own.) */
export function createState(): { S: AppState; signals: Signals } {
  const S = stateFields() as AppState;
  const signals: Record<string, Signal<unknown>> = {};
  defineSignals(S, signals, signalFields());
  return { S, signals: signals as unknown as Signals };
}

export const { S, signals } = createState();

/** A feature moves its own fields onto signals: `S.<field>` keeps working, and `signals.<field>` is there for components. */
export function addSignalFields(initial: Record<string, unknown>): void {
  defineSignals(S, signals as unknown as Record<string, Signal<unknown>>, initial);
}

/** Bumped by `rerender()`: components that read plain-property state depend on it. */
export const redrawTick = signal(0);
