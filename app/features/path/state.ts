// The Path's own state: the skill tree's sections (the `path` collection, loaded by the boot) and which unit or section is opened.
import { signal, type Signal } from "@preact/signals-core";
import { addSignalFields, signals } from "../../core/store.ts";
import type { Section } from "./model/tree.ts";

/** A section of the tree as the `path` collection has it. */
export type TreeSection = Section;

addSignalFields({ tree: [] as TreeSection[] });
/** `S.tree` as a signal: the collection's documents, in order. */
export const tree = (signals as unknown as { tree: Signal<TreeSection[]> }).tree;

/** The units (by index) and tree sections (`sec:<id>`) the learner opened; the current one is always open. */
export const openUnits = signal<ReadonlySet<string | number>>(new Set());
export const isOpen = (key: string | number): boolean => openUnits.value.has(key);
export function toggleUnit(key: string | number): void {
  const next = new Set(openUnits.value);
  if (!next.delete(key)) next.add(key);
  openUnits.value = next;
}
export function openUnit(key: string | number): void {
  if (!openUnits.value.has(key)) openUnits.value = new Set(openUnits.value).add(key);
}
export function closeUnits(): void {
  if (openUnits.value.size) openUnits.value = new Set();
}
