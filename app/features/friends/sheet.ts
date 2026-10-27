// A learner's profile sheet (tap a name anywhere). DOM only: the sheet's frame and backdrop are built here, in the entry chunk,
// and the body (FriendSheet.tsx) draws into it once Preact and its chunk have loaded.
import type { ComponentType } from "preact";
import { el } from "../../core/dom.ts";
import { S } from "../../core/store.ts";
import { mountInto } from "../../ui/open.ts";
import { closeSheet } from "../../ui/sheet.ts";
import { names, profiles } from "./state.ts";

/** What another feature adds under the stats of a profile sheet (the class owner's view of a member): a lazily loaded component. */
export interface SheetExtra { load: () => Promise<ComponentType<never>>; props: object }

export function openFriendSheet(uid: string, extra?: SheetExtra | null): void {
  if (!uid || uid === S.me || !profiles.value.get(uid)) return;
  closeSheet();
  const back = el("div", { class: "sheet-back", onclick: (e: Event) => { if (e.target === back) closeSheet(); } });
  document.body.appendChild(back);
  document.body.classList.add("sheet-open");
  void mountInto(back, () => import("./FriendSheet.tsx").then((m) => m.FriendSheet as ComponentType<{ uid: string; extra: SheetExtra | null }>), { uid, extra: extra ?? null });
  // an open profile shows its owner's link, /@username; closing the sheet restores the tab's URL (closeSheet)
  const un = names.value.get(uid);
  if (un && /^[a-z0-9_.]{3,24}$/.test(un)) { try { history.replaceState(null, "", "/@" + un + location.search); } catch { /* history is not available */ } }
}
