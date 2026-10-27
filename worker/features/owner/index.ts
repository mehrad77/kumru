/* The owner feature (docs/SPECS_API.md section 10 and 12.1): stats, hard-words report, learners, undelete, and the nightly backup to R2.
   A declared cross-table reader: the stats and the users list read every feature's tables, and the backup copies them all (it finds
   them in sqlite_master, so later migrations are covered). */
import type { ServerFeature } from "../../core/feature.ts";
import { backupStep } from "./backup.ts";
import { backupNow, backups, stats, undelete, users, weak } from "./routes.ts";

export const feature: ServerFeature = {
  id: "owner",
  routes: [
    ["GET", "/api/admin/stats", stats],
    ["GET", "/api/admin/weak", weak],
    ["GET", "/api/admin/users", users],
    ["POST", "/api/admin/users/:id/undelete", undelete],
    ["GET", "/api/admin/backups", backups],
    ["POST", "/api/admin/backup", backupNow],
  ],
  // each hourly tick from 03:00 UTC copies a bounded number of rows (the backup is resumable)
  cron: [{ when: (hour) => hour >= 3, run: (env, time) => backupStep(env, new Date(time).toISOString().slice(0, 10), time) }],
};
