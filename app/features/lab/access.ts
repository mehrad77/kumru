// Who sees the Lab: editors, and anyone who opened the page with ?lab (remembered; ?lab=0 hides it again). Opening it to everyone
// later means dropping the editor check here.
import { local } from "../../core/local.ts";
import { S } from "../../core/store.ts";

/** Remember the ?lab switch. Runs once, when the feature loads, before the router decides which tab to open. */
export function applyLabSwitch(search: string = location.search): void {
  const q = new URLSearchParams(search).get("lab");
  if (q !== null) local.set("lab", q === "0" ? "0" : "1");
}

/** Whether the Lab tab shows. Reads `S.canEdit` (a signal), so the tab bar follows it. */
export const labOn = (): boolean => local.get("lab", "") === "1" || (S.canEdit && local.get("lab", "") !== "0");
