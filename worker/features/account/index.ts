/* The account feature (docs/SPECS_API.md sections 4 and 8): sign up, sign in, recover, pair a phone, sessions, export, delete.
   Tables: users, sessions, pairings. */
import type { ServerFeature } from "../../core/feature.ts";
import { changePassword, deleteSession, login, logout, me, pairClaim, pairStart, recover, signup } from "./auth.ts";
import { deleteAccount, exportData } from "./export.ts";
import * as rules from "./rules.ts";

export const feature: ServerFeature = {
  id: "account",
  routes: [
    ["POST", "/api/signup", signup],
    ["POST", "/api/login", login],
    ["POST", "/api/logout", logout],
    ["POST", "/api/recover", recover],
    ["POST", "/api/password", changePassword],
    ["GET", "/api/me", me],
    ["DELETE", "/api/sessions/:id", deleteSession],
    ["POST", "/api/pair/start", pairStart],
    ["POST", "/api/pair/claim", pairClaim],
    ["GET", "/api/export", exportData],
    ["POST", "/api/delete", deleteAccount],
  ],
  rules,
  // the hard delete of accounts soft-deleted more than 7 days ago runs last: foreign keys cascade the rest of their rows
  sweep: {
    order: 90,
    statements: (env, now) => [
      env.DB.prepare("DELETE FROM sessions WHERE expires < ?").bind(now),
      env.DB.prepare("DELETE FROM pairings WHERE expires < ?").bind(now),
      env.DB.prepare("DELETE FROM users WHERE deleted IS NOT NULL AND deleted < ?").bind(now - 7 * 86_400_000),
    ],
  },
  account: {
    export: async ({ user }) => ({ user: { id: user.id, username: user.username, created: user.created, tz: user.tz, role: user.role, plan: user.plan } }),
    remove: ({ user, env }) => [
      env.DB.prepare("UPDATE users SET deleted = ? WHERE id = ?").bind(Date.now(), user.id),
      env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id),
    ],
  },
};
