// The Account card on Profile: who is signed in, their link, adding a phone, devices, the password, the export and deleting the
// account. Another feature adds rows through the `accountRows` slot (Notebook's connections).
import "./account.css";
import { signals } from "../../core/store.ts";
import { SetCard, SetRow } from "../../ui/settings.tsx";
import { Slot } from "../../ui/Slot.tsx";
import { shareLink } from "../../ui/share.ts";
import { toast } from "../../ui/toast.ts";
import { account } from "./api.ts";
import { BusyButton } from "./forms.tsx";
import { accErr } from "./model/errors.ts";
import { openDelete, openDevices, openLogout, openPairStart, openPassword } from "./sheets.tsx";

export function AccountCard() {
  if (!signals.me.value) return null;
  const name = signals.profileName.value;
  const link = name ? location.origin + "/@" + name : "";
  return (
    <SetCard title="Account">
      <SetRow title={"Signed in as " + (name || "you")} sub="Your progress syncs to every phone you sign in on.">
        <button class="btn sm" type="button" onClick={openLogout}>Sign out</button>
      </SetRow>
      {name ? (
        <SetRow title="Your link" sub={link.replace(/^https?:\/\//, "")}>
          <button class="btn sm" type="button" onClick={() => shareLink(link, "Follow me on Kumru")}>Share</button>
        </SetRow>
      ) : null}
      <SetRow title="Add a phone" sub="Show a QR code to scan with your other phone. No password needed.">
        <button class="btn sm primary" type="button" onClick={openPairStart}>Add a phone</button>
      </SetRow>
      <SetRow title="Signed-in devices" sub="See where you're signed in and sign one out.">
        <button class="btn sm" type="button" onClick={openDevices}>Devices</button>
      </SetRow>
      <Slot name="accountRows" />
      <SetRow title="Password" sub="Change it here. Other devices are signed out and Notebook is disconnected.">
        <button class="btn sm" type="button" onClick={openPassword}>Change</button>
      </SetRow>
      <SetRow title="Your data" sub="Download everything stored for your account.">
        <BusyButton class="btn sm" label="Download my data" busyLabel="Preparing…" run={() => account.exportData().catch((x) => toast(accErr(x)))} />
      </SetRow>
      <SetRow title="Delete my account" sub="Erased after 7 days.">
        <button class="btn sm acc-danger" type="button" onClick={openDelete}>Delete</button>
      </SetRow>
    </SetCard>
  );
}
