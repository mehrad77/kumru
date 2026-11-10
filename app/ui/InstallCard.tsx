// "Kumru on your home screen": the Stories tab's offer (after the first finished story, at most every two weeks) and the
// Profile's row. One tap on the browser's prompt where there is one (Chrome, Edge, Android), the two steps on an iPhone.
import { installLater, installWay, promptInstall } from "./install.ts";

const WHY = "Open it like an app, full screen and offline. On an iPhone, daily reminders need it too.";
const IOS_STEPS = "In Safari, tap Share (the square with an arrow), then “Add to Home Screen”.";

/** The Install button, or the iPhone's steps. Nothing once installed, or where the browser cannot install. */
export function InstallAction() {
  const way = installWay();
  if (way === "prompt") return <button class="btn primary sm" type="button" onClick={() => { void promptInstall(); }}>Install</button>;
  if (way === "ios") return <p class="hint install-ios">{IOS_STEPS}</p>;
  return way === "installed" ? <span class="hint">Installed on this device.</span> : null;
}

/** The Stories tab's card. */
export function InstallOffer() {
  const way = installWay();
  if (way !== "prompt" && way !== "ios") return null;
  return (
    <div class="card install-card" role="region" aria-label="Install Kumru">
      <img src="/icon-192.png" alt="" width={44} height={44} />
      <div>
        <b>Kumru on your home screen</b>
        <p class="hint">{WHY}</p>
        <div class="install-acts"><InstallAction /><button class="linkish" type="button" onClick={installLater}>Not now</button></div>
      </div>
    </div>
  );
}

export const INSTALL_WHY = WHY;
