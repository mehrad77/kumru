// The streak-reminders card on Profile: a nudge at the hour the learner picks, only on days they haven't studied yet.
import { useEffect, useState } from "preact/hooks";
import { signals } from "../../core/store.ts";
import { SetCard, SetRow } from "../../ui/settings.tsx";
import { toast } from "../../ui/toast.ts";
import { reminders } from "./api.ts";
import { DEFAULT_HOUR, HOURS, hourLabel } from "./model/hours.ts";
import { loadStatus, status } from "./state.ts";

export function RemindCard() {
  const st = status.value;
  const [hour, setHour] = useState(st?.hour ?? DEFAULT_HOUR);
  useEffect(() => { if (reminders.supported() && !status.peek()) void loadStatus(); }, []);
  useEffect(() => { setHour(st?.hour ?? DEFAULT_HOUR); }, [st?.hour]);
  if (!signals.me.value) return null;
  if (!reminders.supported()) {
    return (
      <SetCard title="Reminders">
        <p class="hint">This browser can't show reminders. On iPhone, add Kumru to the Home Screen first (Share → Add to Home Screen), then open it from there.</p>
      </SetCard>
    );
  }
  if (!st) return <SetCard title="Reminders"><p class="hint">Checking…</p></SetCard>;
  const apply = async () => {
    try { await reminders.enable(hour); status.value = await reminders.status(); toast("Reminder set for " + hourLabel(hour)); }
    catch (e) { toast((e as { message?: string } | null)?.message || "Couldn't set the reminder"); }
  };
  const off = async () => {
    try { await reminders.disable(); status.value = await reminders.status(); }
    catch (e) { toast((e as { message?: string } | null)?.message || "Failed"); }
  };
  return (
    <SetCard title="Reminders">
      <p class="hint">A nudge at the hour you choose, only on days you haven't studied yet.</p>
      <SetRow title="Remind me at" sub={st.on ? "On: every day you haven't practised." : "On iPhone this works only after Kumru is added to the Home Screen."}>
        <select class="sel" aria-label="Reminder hour" value={String(hour)} onChange={(e) => setHour(+(e.currentTarget as HTMLSelectElement).value)}>
          {HOURS.map((h) => <option value={String(h)}>{hourLabel(h)}</option>)}
        </select>
        <button class="btn sm primary" type="button" onClick={apply}>{st.on ? "Update" : "Turn on"}</button>
        {st.on ? <button class="btn sm" type="button" onClick={off}>Turn off</button> : null}
      </SetRow>
    </SetCard>
  );
}
