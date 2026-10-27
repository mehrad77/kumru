// What the onboarding feature calls for its "Daily reminder" step: whether this browser can show reminders, the body of the step
// (a lazily loaded component; the heading, Kerim and the footer buttons are the flow's) and the "Turn on" action. No Preact here:
// this module is in the entry chunk.
import { toast } from "../../ui/toast.ts";
import { reminders } from "./api.ts";
import { hourLabel } from "./model/hours.ts";
import { stepHour } from "./state.ts";

/** The step starts at 8 pm; says whether this browser can show reminders, and turns them on at the hour the learner picked. */
export function remindStep(): { supported: boolean; turnOn: () => Promise<void> } {
  stepHour.value = 20;
  const turnOn = async () => {
    try { await reminders.enable(stepHour.value); toast("Reminder set for " + hourLabel(stepHour.value)); }
    catch (e) { toast((e as { message?: string } | null)?.message || "Couldn't turn on reminders. You can try again in Profile."); }
  };
  return { supported: reminders.supported(), turnOn };
}
