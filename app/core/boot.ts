// The boot sequence. `startBoot` (called by main.ts once the features are registered) walks the page through its phases, and a
// feature subscribes to the one it needs through `WebFeature.boot`:
//   gated    the session is known: `ctx.gated` is true while the sign-in gate must show (no session). The account feature opens
//            the gate; without `gated` the signed-in page starts: progress saved on this device is applied, Notebook
//            consent sheet opens for /connect/yeni, the AI state is set. Nothing else runs when gated.
//   identity `S.me`, `S.canEdit` and the profile name are loaded (host.user). Handlers may return a promise; the next phase waits.
//   progress the server's progress is merged with this device's and applied (the progress feature), the tutor's document loads.
//            Handlers may return a promise; the first deep link opens when they have all settled.
//   routed   the first deep link has been asked to open: the onboarding is offered, Friends' invite links are handled.
// The content collections (cards, grammar, path) start loading right after `identity`, in core/content.ts. core/startup.ts walks the
// phases.

export const BOOT_PHASES = ["gated", "identity", "progress", "routed"] as const;
export type BootPhase = (typeof BOOT_PHASES)[number];

export interface BootCtx {
  phase: BootPhase;
  /** No session: only the sign-in gate shows and no later phase runs. */
  gated: boolean;
}

type Handler = (ctx: BootCtx) => void | Promise<void>;
const handlers = new Map<BootPhase, Handler[]>();
const running = new Map<BootPhase, Promise<void>>();
let gatedNow = false;

/** Register a handler. If the phase has already run, the handler runs now. */
export function onPhase(phase: BootPhase, fn: Handler): void {
  if (running.has(phase)) { void settle(phase, fn); return; }
  handlers.set(phase, [...(handlers.get(phase) ?? []), fn]);
}

async function settle(phase: BootPhase, fn: Handler): Promise<void> {
  try { await fn({ phase, gated: gatedNow }); } catch (e) { console.warn("boot phase " + phase + " failed", e); }
}

/** Run a phase's handlers once, in registration order (each starts synchronously). One handler failing does not stop the others.
 *  The promise settles when every handler has. */
export function runPhase(phase: BootPhase, opts: { gated?: boolean } = {}): Promise<void> {
  const prior = running.get(phase);
  if (prior) return prior;
  if (opts.gated !== undefined) gatedNow = opts.gated;
  const list = handlers.get(phase) ?? [];
  handlers.delete(phase);
  const p = Promise.all(list.map((fn) => settle(phase, fn))).then(() => undefined);
  running.set(phase, p);
  return p;
}

/** For tests. */
export function resetBoot(): void {
  handlers.clear();
  running.clear();
  gatedNow = false;
}
