/* The hourly streak reminders (docs/SPECS_API.md section 12.2): subscriptions whose chosen hour is now in
   their time zone, for learners who have not studied today in that zone. One push each; a push service
   answer of 404 or 410 deletes the subscription. */
import { all, run } from "../../core/db.ts";
import type { Env } from "../../core/env.ts";
import { sendPush } from "./webpush.ts";

const MAX_SENDS = 40;   // free plan: 50 subrequests per invocation
/** Where a tapped reminder opens. Absolute, so the service workers still installed on the retired YaKerim domain
    (they open `data.url` as given, app/host/sw.ts) bring their learners to the new site. */
export const SITE = "https://turk.shab.boo";

/** The push message of one reminder. */
export const reminderPayload = (streak: number) => ({
  title: "Kerim is waiting", body: streak ? `${streak} day streak — one lesson keeps it.` : "One short lesson keeps Kerim happy.", url: SITE + "/",
});

/** {hour, day} of `time` in the IANA zone `tz` (day as YYYY-MM-DD). */
export function localParts(time: number, tz: string): { hour: number; day: string } {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit" })
      .formatToParts(new Date(time)).map((x) => [x.type, x.value]));
    return { hour: Number(p.hour), day: `${p.year}-${p.month}-${p.day}` };
  } catch {
    return { hour: -1, day: "" };
  }
}

interface Sub { id: string; endpoint: string; keys: string; tz: string; hour: number; last_day: string | null; body: string | null }

export async function sendReminders(env: Env, time = Date.now()): Promise<{ sent: number; removed: number }> {
  if (!env.VAPID_PRIVATE || !env.VAPID_PUBLIC) return { sent: 0, removed: 0 };
  // the hour in a zone is the UTC hour plus a whole or half-hour offset: look at the subscriptions of every hour that can match
  const subs = await all<Sub>(env.DB,
    `SELECT s.id, s.endpoint, s.keys, s.tz, s.hour, p.last_day, p.body FROM push_subs s LEFT JOIN profiles p ON p.user_id = s.user_id`);
  let sent = 0, removed = 0;
  for (const s of subs) {
    if (sent >= MAX_SENDS) break;
    const { hour, day } = localParts(time, s.tz);
    if (hour !== s.hour || (s.last_day && s.last_day >= day)) continue;
    const streak = s.body ? Number(JSON.parse(s.body).streak) || 0 : 0;
    const status = await sendPush(env, { endpoint: s.endpoint, keys: JSON.parse(s.keys) }, reminderPayload(streak)).catch(() => 0);
    sent++;
    if (status === 404 || status === 410) { await run(env.DB, "DELETE FROM push_subs WHERE id = ?", s.id); removed++; }
  }
  return { sent, removed };
}
