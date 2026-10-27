// The Profile notes list's two settings: which kind it shows (remembered) and how many it has opened.
import { signal } from "@preact/signals-core";
import { local } from "../../core/local.ts";

export type NoteKind = "note" | "sentence";
export const noteKind = signal<NoteKind>(local.get("noteKind", "note") === "sentence" ? "sentence" : "note");
export const noteLimit = signal(10);

export function setNoteKind(k: NoteKind): void {
  noteKind.value = k;
  local.set("noteKind", k);
  noteLimit.value = 10;
}
