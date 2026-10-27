// Full-screen pages (a lesson, a class, onboarding, a talk) share one history stack, so the back button closes only the top
// one. A page calls `ovlOpen(teardown)` when it opens and `ovlClose(teardown)` to close it; the browser's back and Escape
// run the top teardown. The page-level classes the CSS keys on are kept in step by `syncOvlLock`.
import { syncUrl } from "./router.ts";

const OVL: (() => void)[] = [];
let skip = 0;

/** `lesson-open` on the body while any full-screen page is up. */
export function syncOvlLock(): void {
  document.body.classList.toggle("lesson-open", !!document.querySelector(".lesson-page"));
}

export function ovlOpen(teardown: () => void): void {
  OVL.push(teardown);
  try { history.pushState({ kov: OVL.length }, ""); } catch { /* history is not available */ }
}

export function ovlClose(teardown: () => void): void {
  const i = OVL.lastIndexOf(teardown);
  if (i < 0) { teardown(); syncOvlLock(); return; }
  OVL.splice(i, 1);
  teardown();
  syncOvlLock();
  skip++;
  try { history.back(); } catch { skip--; }
}

/** The Back button and Escape. Wired once at boot. */
export function initOverlay(): void {
  window.addEventListener("popstate", () => {
    if (skip > 0) { skip--; syncUrl(); return; }
    const t = OVL.pop();
    if (t) { t(); syncOvlLock(); }
    syncUrl();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && OVL.length && !document.querySelector(".sheet-back") && !document.querySelector(".gpop")) ovlClose(OVL[OVL.length - 1]);
  });
}
