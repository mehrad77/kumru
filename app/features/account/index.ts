// The account feature (docs/SPECS.md section 8): the sign-in gate, the Account card on Profile and its sheets (sign up, sign in,
// recover, add a phone, devices, password, export, delete). Its server half is worker/features/account, its contract
// shared/account.ts. README.md lists what it owns.
import type { ComponentType } from "preact";
import type { WebFeature } from "../../core/feature.ts";
import { account, claimPairingFromLink } from "./api.ts";
import { BOOT } from "../../core/router.ts";
import { toast } from "../../ui/toast.ts";
import { openGate } from "./entry.ts";
import { takeWelcome } from "./welcome.ts";

export { accErr } from "./model/errors.ts";
/** A form sheet (labelled fields, a submit button) for another feature's own forms. */
export { accForm } from "./entry.ts";
export { onPasswordChanged } from "./state.ts";
/** Sign out of this phone (Notebook consent sheet's "use another account"). */
export const logout = (): Promise<unknown> => account.logout();
export { takeWelcome } from "./welcome.ts";
/** The sign-in gate, with a note above its buttons (the reader's /connect/yeni). */
export { openGate } from "./entry.ts";

export const feature: WebFeature = {
  id: "account",
  // no session: only the sign-in gate (on /connect/yeni the yeni feature opens it, with a note on who is asking); a signed-in page greets a new account
  boot: { gated: (ctx) => { if (ctx.gated) { if (BOOT.connect !== "yeni") openGate(null); } else { const w = takeWelcome(); if (w) toast(w, 4500); } } },
  slots: { profileCards: [{ order: 10, load: () => import("./AccountCard.tsx").then((m) => m.AccountCard as ComponentType) }] },
};

// a /pair/<code> link from another phone's QR: claimed before the page boots, then the page reloads signed in
claimPairingFromLink();
