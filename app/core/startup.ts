// The start of the page (called by main.ts once the features are registered): the sign-in gate or the signed-in page, walked through
// the boot phases of core/boot.ts. What each feature does at a phase is in its `boot` handlers (core/feature.ts).
import { runPhase } from "./boot.ts";
import { startContent } from "./content.ts";
import { BOOT, routeOpen, setTab, showAdminTab, syncUrl } from "./router.ts";
import { renderUser } from "./shell/appbar.ts";
import { S } from "./store.ts";
import { avatarIdle, onAvatarReady } from "../ui/avatar/portrait.ts";
import { pup } from "../ui/kerim/kerim.ts";
import { actionToast, toast } from "../ui/toast.ts";

/** The sign-in gate or the page. Never throws: a failing step is logged and the page carries on with what it has. */
export function startBoot(): void {
  const host = window.kumru!.host;
  const gated = !host.signedIn();
  // a message from the host (an expired pairing code, an unknown invite) can come before the gate or the page is drawn
  addEventListener("kumru:notice", (e) => toast((e as CustomEvent<string>).detail));
  void runPhase("gated", { gated });
  if (gated) return;
  document.querySelector(".logo-k")?.replaceChildren(pup("idle", 0, { pose: "head", enter: false, label: "Kumru" }));
  renderUser();
  // the page opens on Stories (the home tab) unless the link asks for another screen
  setTab(BOOT.tab || "stories");
  void bootSignedIn().catch((e) => console.warn("boot failed", e));
}

async function bootSignedIn(): Promise<void> {
  const host = window.kumru!.host;
  addEventListener("kumru:signedout", () => { toast("You were signed out on this device."); setTimeout(() => location.reload(), 1500); });
  addEventListener("kumru:update", () => actionToast("A new version of Kumru is ready.", "Reload", () => host.update(), 15000));
  const { db, user } = host;
  S.db = db;
  S.user = user;
  try {
    S.me = await user.id();
    const [canEdit, writable, me] = await Promise.all([user.canEdit(), user.can("data.write"), user.me()]);
    S.canEdit = canEdit;
    if (writable === false) S.writable = false;
    S.profileName = me.name || "";
    S.avatar = me.avatarUrl || "";
  } catch { /* offline with no saved identity: the page runs on this device's copy */ }
  renderUser();
  showAdminTab();
  const identity = runPhase("identity");
  startContent(db);
  syncUrl();
  await identity;
  await runPhase("progress");
  // the portraits' bundle (Sahne with the kit) at idle: the chip, Friends and classes then draw real characters
  onAvatarReady(renderUser);
  avatarIdle();
  routeOpen(BOOT);
  await runPhase("routed");
}
