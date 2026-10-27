// Slots: how one feature appears inside another's screen without importing it (app/README.md). The screen that owns a slot
// renders its fills in `order`; a feature contributes through `WebFeature.slots`. A new extension point is one key here.
import type { ComponentType } from "preact";

/** A contribution to a slot: loaded the first time the slot's screen draws. */
export interface SlotFill {
  order: number;
  load: () => Promise<ComponentType>;
}

export interface SlotMap {
  /** Cards on the Profile tab (account, classes, reminders, the reader link, …). */
  profileCards: SlotFill;
  /** Rows on the Account card, after the devices (Notebook's connections). */
  accountRows: SlotFill;
  /** Banners above the Path (the book offer, …). */
  pathBanners: SlotFill;
  /** Extra blocks under a lesson (drills, "see it in a story", …). */
  lessonExtras: SlotFill;
  /** Steps of the onboarding flow (classes, reminders, …). */
  onboardingSteps: SlotFill;
  /** Cards on the Friends tab, between the leaderboard and the list of people you follow (classes, …). */
  friendsCards: SlotFill;
  /** Stats on a friend's row and sheet. */
  friendStats: SlotFill;
  /** The user chip in the app bar. */
  userChip: SlotFill;
}

export type SlotName = keyof SlotMap;
export type SlotFills = { [K in SlotName]?: SlotMap[K][] };

const fills = new Map<SlotName, SlotFill[]>();

export function addSlotFills(contributed: SlotFills): void {
  for (const name of Object.keys(contributed) as SlotName[]) {
    const list = fills.get(name) ?? [];
    list.push(...(contributed[name] ?? []));
    fills.set(name, list);
  }
}

/** A slot's fills, in order. */
export function slot<K extends SlotName>(name: K): SlotMap[K][] {
  return [...(fills.get(name) ?? [])].sort((a, b) => a.order - b.order) as SlotMap[K][];
}
