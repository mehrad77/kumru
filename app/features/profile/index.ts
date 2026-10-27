// The profile feature: the Profile tab (the learner's header, stats and calendar, and a grid of cards that is the `profileCards`
// slot), the settings cards it fills the slot with, and the theme. README.md lists what it owns and what the legacy page calls.
import type { ComponentType } from "preact";
import type { WebFeature } from "../../core/feature.ts";
import { S } from "../../core/store.ts";
import { streakDays } from "./model/stats.ts";
import { applyTheme } from "./theme.ts";

// the theme is set before the first paint
applyTheme();

const card = (name: string) => (): Promise<ComponentType> => import("./Cards.tsx").then((m) => (m as unknown as Record<string, ComponentType>)[name]);

export const feature: WebFeature = {
  id: "profile",
  tabs: [{ id: "profile", label: "Profile", icon: "user", order: 50, load: () => import("./ProfileTab.tsx").then((m) => m.ProfileTab) }],
  // while the Profile tab is on screen the address bar shows the learner's own /@username
  url: [{ priority: 10, current: () => (S.tab === "profile" && S.profileName ? "/@" + S.profileName : null) }],
  // After the Account (10), Classes (20) and Reminders (30) cards, "My notes" (5) and before Notebook banner (100)
  slots: {
    profileCards: [
      { order: 40, load: card("StudyCard") },
      { order: 50, load: card("LanguageCard") },
      { order: 60, load: card("VoiceCard") },
      { order: 70, load: card("AiCard") },
      { order: 80, load: card("AppearanceCard") },
      { order: 90, load: card("PrivacyCard") },
      { order: 95, load: card("EditorCard") },
    ],
  },
};

/** Days in a row up to today: the Path's top bar and Kerim's line count it. */
export const currentStreak = (): number => streakDays(S.days);
