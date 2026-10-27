// What the Classes feature remembers while the page is open: the classes I teach and have joined. This feature is the only writer.
import { signal } from "@preact/signals-core";
import type { Class } from "../../../shared/api.ts";
import { S } from "../../core/store.ts";
import { classesApi } from "./api.ts";

/** My classes; null until the list has been asked for. Replaced, never changed in place. */
export const classList = signal<Class[] | null>(null);
let loading = false;

/** Ask for the list again (after joining, creating, editing, leaving). A failure keeps what was there, or an empty list. */
export async function loadClasses(): Promise<void> {
  if (!S.me) return;
  loading = true;
  try { classList.value = await classesApi.list(); }
  catch { classList.value = classList.value || []; }
  loading = false;
}

/** Ask for the list once, when nothing has (the Friends card and the book summary need it). */
export function ensureClasses(): void {
  if (classList.value === null && !loading) void loadClasses();
}

/** The classes whose owner sees my book summary (Notebook feature rides it with the progress save). */
export function bookClasses(load?: boolean): string[] {
  if (load) ensureClasses();
  return (classList.value || []).filter((c) => c.shareBook && c.owner !== S.me).map((c) => c.id);
}

/** Replace one class in the list with its updated copy. */
export function putClass(c: Class): void {
  classList.value = (classList.value || []).map((x) => (x.id === c.id ? c : x));
}
