// Opens the tutor lab: a full-screen page for editors, filled by TutorLab.tsx. Not on the overlay stack (no Back or Escape);
// the lab's own close button removes it.
import { el } from "../../core/dom.ts";
import { syncOvlLock } from "../../core/overlay.ts";
import { S } from "../../core/store.ts";
import type { Fixture } from "./model/lab.ts";

export async function openTutorLab(): Promise<void> {
  if (!S.canEdit) return;
  let fx: Fixture[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = await (S.db as any).doc("tutorlab/fixtures").get();
    if (s.exists) fx = (s.data() || {}).items || [];
  } catch { /* no fixtures */ }
  const [{ mountIsland }, { TutorLab }] = await Promise.all([import("../../ui/mount.ts"), import("./TutorLab.tsx")]);
  const pg = el("div", { class: "lesson-page lab-page", role: "dialog", "aria-modal": "true", "aria-label": "Tutor lab" });
  document.body.append(pg);
  document.body.classList.add("lesson-open");
  let unmount: (() => void) | null = null;
  const close = () => { unmount?.(); pg.remove(); syncOvlLock(); };
  unmount = await mountIsland(pg, TutorLab, { fx, close });
}
