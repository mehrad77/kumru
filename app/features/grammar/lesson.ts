// The lesson page's state: which lesson is open, and opening and closing the full-screen page on the overlay stack
// (core/overlay.ts), so Back and Escape close it. The page itself is LessonPage.tsx, drawn into a host element that carries the
// classes the page CSS and the overlay lock key on (`lesson-page`, `lp-lesson`).
import { signal } from "@preact/signals-core";
import { el } from "../../core/dom.ts";
import { ovlClose, ovlOpen, syncOvlLock } from "../../core/overlay.ts";
import { rerender, syncUrl } from "../../core/router.ts";
import { S } from "../../core/store.ts";
import { mountInto } from "../../ui/open.ts";
import { closeSheet } from "../../ui/sheet.ts";
import { toast } from "../../ui/toast.ts";
import { saveProgress, touch } from "../progress/index.ts";
import { closeGloss } from "../words/index.ts";

/** The lesson on screen, or null. */
export const lessonId = signal<string | null>(null);
export const currentLessonId = (): string | null => lessonId.peek();

interface Lesson { id: string; order: number; title: string; ref?: string; [field: string]: any } // eslint-disable-line @typescript-eslint/no-explicit-any -- lesson JSON
export const lessons = (): Lesson[] => S.grammar as Lesson[];
export const lessonById = (id: string): Lesson | undefined => lessons().find((g) => g.id === id);

/** A lesson's title and number, for the links to a lesson. */
export const lessonTitle = (id: string): string => lessonById(id)?.title ?? id;
export const lessonOrder = (id: string): string | number => lessonById(id)?.order ?? "";

let page: HTMLElement | null = null;

function teardown(): void {
  if (page) page.remove();
  page = null;
  lessonId.value = null;
  if (S.tab === "path") rerender();
  syncUrl();
}

export function openLesson(id: string): void {
  if (!lessonById(id)) { toast("Lessons are still loading."); return; }
  closeGloss();
  closeSheet();
  lessonId.value = id;
  if (!page) {
    const host = page = el("div", { class: "lesson-page lp-lesson", role: "dialog", "aria-modal": "true" });
    document.body.appendChild(host);
    void mountInto(host, () => import("./LessonPage.tsx").then((m) => m.LessonPage), { host });
    ovlOpen(teardown);
  }
  syncOvlLock();
  syncUrl();
}

export function closeLesson(): void {
  if (page) ovlClose(teardown);
}

/** "Mark as learned" and back. */
export function toggleLearned(id: string): void {
  if (S.learned[id]) delete S.learned[id]; else S.learned[id] = 1;
  saveProgress();
  touch();
  if (S.tab === "path") rerender();
}
