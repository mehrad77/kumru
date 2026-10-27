// Starting and ending a practice session. This file is small and eager; the runner (engine.ts, Runner.tsx, the questions) loads when
// the first session starts.
import { $ } from "../../core/dom.ts";
import { setTab } from "../../core/router.ts";
import { S } from "../../core/store.ts";
import { inLab } from "../progress/index.ts";
import type { Driver, Session } from "./types.ts";

type Engine = typeof import("./engine.ts");
let engine: Engine | null = null, loading: Promise<Engine> | null = null, driver: Driver | null = null, token = 0;

const load = (): Promise<Engine> => (loading ||= import("./engine.ts").then((m) => (engine = m)));

/** The loaded runner; the imperative API (footCheck, feedback, …) is only there once a session has started. */
export function runner(): Engine {
  if (!engine) throw new Error("no practice session is running");
  return engine;
}
export const runnerLoaded = (): boolean => !!engine;

/** Register what chooses the steps of a session (the session kinds do, see Driver). */
export function setDriver(d: Driver): void { driver = d; }

/** Show the session screen for `session` (the object the caller built; it becomes `S.session`) and draw its first step. */
export function startSession(session: Session): void {
  S.session = session;
  const t = ++token;
  document.body.classList.add("in-session");
  $("#session").hidden = false;
  window.scrollTo(0, 0);
  void load().then((m) => m.mount(session, driver as Driver, () => t === token && S.session === session));
}

/** Leave the running session. `silent` stays where it is; otherwise the learner goes back to the Path (the Lab after a Lab session). */
export function endSession(silent?: boolean): void {
  const s = S.session as Session | null;
  token++;
  s?.onEnd?.();
  const lab = inLab();
  S.session = null;
  document.body.classList.remove("in-session");
  const host = $("#session");
  host.hidden = true;
  engine?.unmount();
  host.replaceChildren();
  if (!silent) setTab(lab ? "lab" : "path");
}
