// The learner's progress, as state. These fields are plain properties of the state object `S` backed by signals, so `S.xp = 5` and `signals.xp.value` are the same thing and a component that reads one re-renders when it
// is assigned. Progress is still mutated in place in many places (`S.stats[id].a++`), which a signal cannot see: `rev` is bumped
// on every save (and when a document is applied), and a component that depends on progress reads it too.
import { signal } from "@preact/signals-core";
import { addSignalFields } from "../../core/store.ts";

addSignalFields({
  conf: {}, confAt: {}, at: {}, boxOld: null, learned: {}, stats: {}, drill: {}, days: {}, ex: {}, log: [], st: {}, xp: 0, xpDays: {}, nd: {},
  tp: { v: 1, sk: {}, sec: {} }, cheerSeen: 0, pv: 0, pos: null, placed: null, onb: 0, nick: "", char: null, profile: null,
});

/** Bumped when progress changed in place. */
export const rev = signal(0);
export const touch = (): void => { rev.value++; };
