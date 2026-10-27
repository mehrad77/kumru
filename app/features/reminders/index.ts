// The reminders feature: streak reminders (Web Push), the Profile card and the daily-reminder step of onboarding. Server half:
// worker/features/reminders; contract: shared/reminders.ts; routes: docs/SPECS_API.md. README.md lists what it owns.
import type { ComponentType } from "preact";
import type { WebFeature } from "../../core/feature.ts";

export { remindStep } from "./step.ts";
/** The body of onboarding's "Daily reminder" step, for the onboarding feature to draw (this index carries no Preact). */
export const loadRemindBody = () => import("./StepBody.tsx").then((m) => m.StepBody as ComponentType);

export const feature: WebFeature = {
  id: "reminders",
  slots: { profileCards: [{ order: 30, load: () => import("./RemindCard.tsx").then((m) => m.RemindCard as ComponentType) }] },
};

