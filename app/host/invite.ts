/* Invite links: /f/<friend code>, /c/<class code> and /@<username> (docs/SPECS_API.md section 6). They are read before the page
   boots, so the host does it; the Friends and Classes features act on what it keeps once the learner is signed in. */
import { lsSet } from "./storage.ts";

/** Before the page boots: remember the code from an invite path and show the page at /friends instead. */
export function captureInvite(): void {
  const m = /^\/(f|c)\/([0-9A-Za-z]{6})\/?$/.exec(location.pathname);
  const u = /^\/@([0-9A-Za-z_.]{3,24})\/?$/.exec(location.pathname);
  if (!m && !u) return;
  if (m) lsSet(m[1] === "f" ? "pending-follow" : "pending-class", m[2].toUpperCase());
  else if (u) lsSet("pending-profile", u[1].toLowerCase());
  history.replaceState(null, "", "/friends" + location.search);
}
