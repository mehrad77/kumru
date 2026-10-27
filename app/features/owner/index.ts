// The Owner feature's public surface. Only the owner opens the tab, so the screen is its own chunk, loaded the first time
// the tab is shown. (The tab's id is still "people": a frozen route key.)
import type { WebFeature } from "../../core/feature.ts";
import { BOOT } from "../../core/router.ts";
import { S } from "../../core/store.ts";
import { toast } from "../../ui/toast.ts";

export const feature: WebFeature = {
  id: "owner",
  boot: { identity: () => { if (BOOT.tab === "people" && !S.canEdit) toast("The Owner page is for the owner."); } },
  tabs: [{ id: "people", label: "Owner", icon: "people", order: 60, load: () => import("./OwnerTab.tsx").then((m) => m.OwnerTab) }],
};
