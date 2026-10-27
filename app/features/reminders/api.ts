/* Streak reminders (docs/SPECS.md section 10.6): the browser's Web Push subscription, stored with the learner's
   time zone and chosen hour. On iPhone this works only after the app is added to the home screen. */
import type { PushSub } from "../../../shared/api.ts";
import { api } from "../../host/transport.ts";

const b64ToBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));

export const pushSupported = (): boolean => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export interface PushStatus { on: boolean; hour: number | null; id: string | null }

export const reminders = {
  supported: pushSupported,
  async status(): Promise<PushStatus> {
    if (!pushSupported()) return { on: false, hour: null, id: null };
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && (await reg.pushManager.getSubscription());
    if (!sub) return { on: false, hour: null, id: null };
    const mine = (await api("GET", "/api/push")).json.subs.find((s: { endpoint: string }) => s.endpoint === sub.endpoint);
    return mine ? { on: true, hour: mine.hour, id: mine.id } : { on: false, hour: null, id: null };
  },
  /** Ask permission, subscribe and save with the chosen local hour. */
  async enable(hour: number): Promise<void> {
    if (!pushSupported()) throw { code: "invalid", message: "This browser can't show reminders. On iPhone, add Kumru to the Home Screen first." };
    const key = (await api("GET", "/api/push/key")).json.key;
    if (!key) throw { code: "not_implemented", message: "Reminders aren't set up on the server yet." };
    if ((await Notification.requestPermission()) !== "granted") throw { code: "forbidden", message: "Notifications are blocked for this site." };
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) }));
    const j = sub.toJSON();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const body = { endpoint: sub.endpoint, keys: j.keys, tz, hour } as PushSub;
    await api("POST", "/api/push", body);
  },
  async disable(): Promise<void> {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && (await reg.pushManager.getSubscription());
    if (!sub) return;
    const st = await reminders.status();
    if (st.id) await api("DELETE", "/api/push/" + st.id);
    await sub.unsubscribe();
  },
};
