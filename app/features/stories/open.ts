// /stories/<id>: the reader as a full-screen page over the tab (core/overlay.ts gives it the back button and Escape). The page is
// DOM-built (reader.ts) around Sahne's stage, which the lazy `player` bundle brings; this file only opens and closes it. A story
// whose earlier stories are not finished does not open: a toast names the one to read first (an editor may open it anyway).
import { el } from "../../core/dom.ts";
import { ovlClose, ovlOpen, syncOvlLock } from "../../core/overlay.ts";
import { rerender, syncUrl } from "../../core/router.ts";
import { S } from "../../core/store.ts";
import { actionToast, toast } from "../../ui/toast.ts";
import { closeSheet } from "../../ui/sheet.ts";
import { closeGloss } from "../words/index.ts";
import { personalizeStr } from "../onboarding/index.ts";
import { loaded, nextStory, openStories, readable, storyId } from "./state.ts";

let page: HTMLElement | null = null, stop: (() => void) | null = null;

function teardown(): void {
  stop?.();
  stop = null;
  page?.remove();
  page = null;
  storyId.value = null;
  rerender();
  syncUrl();
}

/** Say why `id` does not open: it is not out, or an earlier story comes first. */
function refuse(id: string): void {
  const first = nextStory();
  if (!openStories().some((s) => s.id === id) || !first) { toast("That story isn't out yet."); return; }
  const msg = `Read “${personalizeStr(first.title, "tr")}” first.`;
  if (S.canEdit) actionToast(msg, "Open anyway", () => openStory(id, true));
  else actionToast(msg, "Read it", () => openStory(first.id));
}

export function openStory(id: string, force = false): void {
  if (!force && loaded.value && !readable(id)) return refuse(id);
  closeGloss();
  closeSheet();
  if (page) teardown();
  storyId.value = id;
  const host = page = el("div", { class: "lesson-page st-page", role: "dialog", "aria-modal": "true", "aria-label": "Story" });
  document.body.appendChild(host);
  ovlOpen(teardown);
  syncOvlLock();
  syncUrl();
  void import("./reader.ts").then((m) => { if (page === host) stop = m.mountReader(host, id, closeStory); });
}

export function closeStory(): void {
  if (page) ovlClose(teardown);
}
