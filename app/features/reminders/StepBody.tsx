// The body of onboarding's "Daily reminder" step (the heading, Kerim and the footer buttons are the flow's): one paragraph and
// the hour. The "Turn on" button is the flow's, and reads the hour through `turnOn` (index.ts). The words are the flow's, in the
// learner's language.
import "./reminders.css";
import { HOURS, hourLabel } from "./model/hours.ts";
import { reminders } from "./api.ts";
import { stepHour } from "./state.ts";

export function StepBody({ text, none, hour }: { text: string; none: string; hour: string }) {
  if (!reminders.supported()) return <p>{none}</p>;
  return (
    <>
      <p>{text}</p>
      <div class="onb-remind">
        <select class="sel" aria-label={hour} value={String(stepHour.value)} onChange={(e) => { stepHour.value = +(e.currentTarget as HTMLSelectElement).value; }}>
          {HOURS.map((h) => <option value={String(h)}>{hourLabel(h)}</option>)}
        </select>
      </div>
    </>
  );
}
