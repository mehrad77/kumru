// The reminders feature's state: what the browser and the server say about this phone's subscription, and the hour the
// onboarding step has chosen. This feature is their only writer.
import { signal } from "@preact/signals-core";
import { reminders, type PushStatus } from "./api.ts";

/** This phone's reminder (null until `loadStatus` has answered). */
export const status = signal<PushStatus | null>(null);
/** The hour the onboarding step has picked. */
export const stepHour = signal(20);

let loading = false;

/** Ask the browser and the server whether a reminder is on. A failure leaves the card on "Checking…" (it asks again when redrawn). */
export async function loadStatus(): Promise<void> {
  if (loading || !reminders.supported()) return;
  loading = true;
  try { status.value = await reminders.status(); } catch { status.value = null; } finally { loading = false; }
}
