// The body of onboarding's "Daily reminder" step (the heading, Kerim and the footer buttons are the flow's): one paragraph and
// the hour. The "Turn on" button is the flow's, and reads the hour through `turnOn` (index.ts).
import "./reminders.css";
import { HOURS, hourLabel } from "./model/hours.ts";
import { reminders } from "./api.ts";
import { stepHour } from "./state.ts";

export function StepBody() {
  if (!reminders.supported()) {
    return <p>This browser can't show reminders. On iPhone, add Kumru to the Home Screen first (Share → Add to Home Screen), then turn them on in Profile.</p>;
  }
  return (
    <>
      <p>Kerim can remind you once a day, only on days you haven't practised yet. Choose the time:</p>
      <div class="onb-remind">
        <select class="sel" aria-label="Reminder hour" value={String(stepHour.value)} onChange={(e) => { stepHour.value = +(e.currentTarget as HTMLSelectElement).value; }}>
          {HOURS.map((h) => <option value={String(h)}>{hourLabel(h)}</option>)}
        </select>
      </div>
    </>
  );
}
