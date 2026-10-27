/* The owner's dashboard data (docs/SPECS.md section 10.4): thin wrappers over /api/admin/*. */
import { api } from "./transport.ts";

export const owner = {
  stats: () => api("GET", "/api/admin/stats").then((r) => r.json),
  weak: () => api("GET", "/api/admin/weak?limit=50").then((r) => r.json),
  backups: () => api("GET", "/api/admin/backups").then((r) => r.json.backups),
  backupNow: () => api("POST", "/api/admin/backup").then((r) => r.json),
  /** `q` is a username prefix; empty lists the most recently active. */
  users: (q = "") => api("GET", "/api/admin/users?limit=100&q=" + encodeURIComponent(q)).then((r) => r.json.users),
  undelete: (id: string) => api("POST", `/api/admin/users/${id}/undelete`).then((r) => r.json),
};
