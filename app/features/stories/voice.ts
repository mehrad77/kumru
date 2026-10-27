// Whether the stories offer the microphone: only where speech recognition really works on this device. The browser must have it
// (a secure page, online), the microphone must not be blocked, and it must not have failed here for good before: a browser that
// says it cannot recognise Turkish, or whose recognition service cannot be reached, is remembered (`kumru:story:nomic`) and the
// microphone stays hidden until a later try hears something. Browsers known to have the API without a working service never show it.
import { local } from "../../core/local.ts";
import { hasMic } from "../../ui/speech.ts";

let blocked = false;
let asked = false;

/** Ask once whether the microphone is blocked, and follow the answer if the learner changes it. */
function watchPermission(): void {
  if (asked) return;
  asked = true;
  try {
    void navigator.permissions?.query({ name: "microphone" as PermissionName }).then((p) => {
      blocked = p.state === "denied";
      p.addEventListener("change", () => { blocked = p.state === "denied"; });
    }, () => undefined);
  } catch { /* no Permissions API: the browser asks when the microphone starts */ }
}

/**
 * Browsers that have the speech API but no service behind it (it fails at once with "network"). Among Chromium browsers only
 * Google Chrome and Edge bring one: Brave, Opera, Electron apps and plain Chromium name other brands (`userAgentData`). Safari
 * (no `userAgentData`) recognises speech itself.
 */
function hollow(): boolean {
  const brands = (navigator as { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands;
  return "brave" in navigator || (!!brands?.length && !brands.some((b) => b.brand === "Google Chrome" || b.brand === "Microsoft Edge"));
}

/** True when the stories may show the microphone (`canListen`: the stage bundle's own check, when it is loaded). */
export function voiceOk(canListen = true): boolean {
  watchPermission();
  return canListen && hasMic() && !hollow() && isSecureContext && navigator.onLine && !blocked && local.get("story:nomic", "") !== "1";
}

/** After a try: remember a failure that will not go away by trying again, and forget it once the microphone hears something. */
export function noteListen(r: { heard?: string; error?: string }): void {
  if (r.heard) local.set("story:nomic", "");
  else if (r.error === "unsupported" || r.error === "network") local.set("story:nomic", "1");
  if (r.error === "denied") blocked = true;
}
