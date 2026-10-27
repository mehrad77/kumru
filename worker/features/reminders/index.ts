/* The reminders feature (docs/SPECS_API.md section 9 and 12.2): Web Push subscriptions and the hourly streak reminder.
   Table: push_subs. */
import type { ServerFeature } from "../../core/feature.ts";
import { first } from "../../core/db.ts";
import { sendReminders } from "./cron.ts";
import { mySubs, pushKey, subscribe, unsubscribe } from "./routes.ts";

export const feature: ServerFeature = {
  id: "reminders",
  routes: [
    ["GET", "/api/push/key", pushKey],
    ["GET", "/api/push", mySubs],
    ["POST", "/api/push", subscribe],
    ["DELETE", "/api/push/:id", unsubscribe],
  ],
  cron: [{ when: () => true, run: (env, time) => sendReminders(env, time) }],
  account: {
    export: async ({ user, env }) => ({ push: (await first<{ n: number }>(env.DB, "SELECT COUNT(*) AS n FROM push_subs WHERE user_id = ?", user.id))?.n ?? 0 }),
  },
};
