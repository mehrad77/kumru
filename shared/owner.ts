/* The owner's dashboard (docs/SPECS_API.md section 10). */
import type { Plan, Role } from "./core.ts";

export interface AdminStats { users: { total: number; deleted: number; signups7d: number; signups30d: number };
  active: { d7: number; d30: number }; docs: { rows: number; bytes: number }; profiles: { rows: number };
  classes: { rows: number; members: number }; push: { rows: number }; limits: { rows: number; hits24h: number };
  backup: { date: string; bytes: number; rows: number; finished: number } | null; version: string; time: number }
/** One row of GET /api/admin/users (worker/features/owner/routes.ts); the profile columns are null for a learner who has not saved one. */
export interface AdminUser { id: string; username: string; role: Role; plan: Plan; tz: string | null; created: number; deleted: number | null;
  lastSave: number | null; code: string | null; xp: number | null; xpWeek: number | null; week: string | null; lastDay: string | null;
  nick: string | null; char: unknown | null; streak: number | null; lv: string | null; unit: number | null;
  progressBytes: number | null; saves: number | null; devices: number; classes: number; followers: number; following: number; reminders: number }
export interface AdminBackup { date: string; bytes: number; rows: number; finished: number }
export interface AdminWeak { cards: { id: string; learners: number; tries: number; wrong: number }[];
  lessons: { id: string; learners: number; tries: number; misses: number }[] }
