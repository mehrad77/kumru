// Installing Kumru on the device (a home-screen app: full screen, offline, and on an iPhone the only way reminders arrive).
// Chrome and Edge offer it with `beforeinstallprompt`, which index.html's first script keeps (`window.__kInstall`) so the app's
// own Install button can show it; Safari on an iPhone or iPad has no such event, so the app shows the steps instead.
import { signal } from "@preact/signals-core";
import { local } from "../core/local.ts";

interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }
declare global { interface Window { __kInstall?: InstallEvent | null } }

/** Bumped when the browser offers or completes an install, so a component reading it redraws. */
export const installTick = signal(0);
addEventListener("kumru:install", () => { installTick.value++; });

const standalone = (): boolean => matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
const ios = (): boolean => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** How this device installs Kumru: already did, the browser's own prompt, the iPhone's steps, or not at all. */
export type InstallWay = "installed" | "prompt" | "ios" | "none";
export function installWay(): InstallWay {
  void installTick.value;
  if (standalone() || local.get("installed", "") === "1") return "installed";
  if (window.__kInstall) return "prompt";
  return ios() ? "ios" : "none";
}

/** Show the browser's install prompt; true when the learner installed. */
export async function promptInstall(): Promise<boolean> {
  const e = window.__kInstall;
  if (!e) return false;
  await e.prompt();
  const { outcome } = await e.userChoice;
  window.__kInstall = null;
  if (outcome === "accepted") local.set("installed", "1");
  installTick.value++;
  return outcome === "accepted";
}

const LATER_DAYS = 14;
/** Whether the Stories tab may offer it now: not dismissed in the last two weeks. */
export const installOfferDue = (): boolean => Date.now() - Number(local.get("install:later", "0")) > LATER_DAYS * 864e5;
export const installLater = (): void => { local.set("install:later", String(Date.now())); installTick.value++; };
