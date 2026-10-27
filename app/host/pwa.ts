/* The installable, offline app (docs/SPECS.md section 10.1). /sw.js precaches the page, its data files and
   icons. A new version installs in the background; the page is told with a `kumru:update` event and
   shows "Reload", which calls applyUpdate(). Off in dev unless ?sw. */
import { isDev } from "./dev.ts";

let waiting: ServiceWorker | null = null;
let updating = false;

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  if (isDev() && !new URLSearchParams(location.search).has("sw")) return;
  addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      const offer = (w: ServiceWorker) => { waiting = w; dispatchEvent(new Event("kumru:update")); };
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        if (w) w.addEventListener("statechange", () => {
          if (w.state === "installed" && navigator.serviceWorker.controller) offer(w);
        });
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") reg.update().catch(() => {});
      });
    }).catch(() => { /* no service worker: the page still works online */ });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (updating) location.reload();
    });
  });
}

/** Activate the waiting version and reload into it. */
export function applyUpdate(): void {
  updating = true;
  if (waiting) waiting.postMessage({ type: "skip" });
  else location.reload();
}
