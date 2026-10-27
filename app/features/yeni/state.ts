// What Notebook feature remembers while the page is open: the number of reader connections (for the Account card)
// and the signal the consent sheet waits on.
import { signal } from "@preact/signals-core";
import { S } from "../../core/store.ts";
import { onPasswordChanged } from "../account/index.ts";
import { yeni } from "./api.ts";
import { bookLinked } from "./book.ts";

/** Resolved by boot once the session's name is known; the 12 s timer only keeps a failed boot from hanging the consent sheet. */
let meDone = (): void => {};
export const meReady = new Promise<void>((r) => { meDone = r; setTimeout(r, 12000); });
export const markMeReady = (): void => meDone();

/** How many readers are connected to this account; null until asked. */
export const connections = signal<number | null>(null);
let tried = false;

/** A new password disconnects every reader (docs/AUTH.md). Called once the account feature is up. */
export function watchPassword(): void { onPasswordChanged(() => { connections.value = 0; }); }

/** The connection count for the Account card: asked once per page load, not on every render. */
export async function loadConnections(): Promise<void> {
  if (!S.me || tried) return;
  tried = true;
  try { connections.value = (await yeni.list()).length; } catch { return; }
  bookLinked(connections.value > 0);
}

/** The connections sheet found out the real count. */
export function setConnections(n: number): void {
  connections.value = n;
  tried = true;
  bookLinked(n > 0);
}
