// AI access. The host offers `host.ai` where it has a model; on Kumru's Worker it is null, so the state is "off" and every caller
// takes its offline path (the tutor's checks are hidden, onboarding keeps what the learner typed).
import { signal } from "@preact/signals-core";
import { abortable } from "./model/abortable.ts";

/** unknown (not asked yet), ready, denied (the host said no), off (this host has none). */
export type AiState = "unknown" | "ready" | "denied" | "off";

interface AiHost { json(prompt: string, opts: { modelTier: string; signal?: AbortSignal }): Promise<unknown> }

/** The state as a signal, so the Profile card and the "Try it" box follow it. */
export const aiStatus = signal<AiState>("unknown");
let fn: AiHost | null = null;

/** Looks for the host's AI. Called once at boot. */
export function initAI(): void {
  const host = window.kumru?.host as unknown as { ai?: AiHost | null } | undefined;
  fn = host?.ai || null;
  aiStatus.value = fn ? "ready" : "off";
}

export const aiState = (): AiState => aiStatus.value;
export const aiReady = (): boolean => aiStatus.value === "ready";

/** Error codes that mean the host will not let this page use the AI. */
export const AI_GONE = ["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"];

/** What the learner is told about an AI failure ("" for a cancel). A refusal by the host also marks the AI as denied. */
export function aiErrText(e: unknown): string {
  const c = (e as { code?: string } | null)?.code ?? "";
  if (AI_GONE.includes(c)) { aiStatus.value = "denied"; return "AI checks are switched off."; }
  const m: Record<string, string> = {
    rate_limited: "The tutor needs a short break. Try again in a little while.", session_expired: "Please sign in again, then retry.",
    invalid_json: "The tutor didn't catch that. Try again.", empty_completion: "The tutor didn't catch that. Try again.", refused: "Let's keep it to Turkish practice. Try another sentence.",
    prompt_too_large: "That's too long. Try a shorter sentence.", cancelled: "",
  };
  return m[c] ?? "Connection hiccup. Try again.";
}

/** One quick call, JSON back; Stop (`signal`) answers at once. Throws `{code}` errors. */
export function askJson(prompt: string, signal?: AbortSignal): Promise<unknown> {
  if (!fn) return Promise.reject({ code: "capability_disabled" });
  return abortable(fn.json(prompt, { modelTier: "quick", signal }), signal);
}
