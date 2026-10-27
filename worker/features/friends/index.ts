/* The friends feature (docs/SPECS_API.md section 6 and 3): the public profile, follows, the weekly board, search, and the
   /f/<code> and /@<name> invite pages. Tables: profiles, follows. */
import type { ServerFeature } from "../../core/feature.ts";
import { all, first } from "../../core/db.ts";
import { friendInvite, profileInvite } from "./invite.ts";
import { putProfile } from "./profiles.ts";
import { friends, search, users } from "./routes.ts";
import * as rules from "./rules.ts";

// what the classes feature reads (member profiles and names, the week of a board)
export { profilesAndNames, weekParam } from "./routes.ts";

export const feature: ServerFeature = {
  id: "friends",
  routes: [
    ["PUT", "/api/profile", putProfile],
    ["GET", "/api/friends", friends],
    ["GET", "/api/profiles/search", search],
    ["GET", "/api/users", users],
  ],
  pages: [
    ["GET", "/f/:code", friendInvite],
    ["GET", "/@/:username", profileInvite],   // /@name is matched as /@/name: the router matches whole segments
  ],
  rules,
  account: {
    export: async ({ user, env }) => {
      const profile = await first<{ body: string; code: string; updated: number }>(env.DB, "SELECT body, code, updated FROM profiles WHERE user_id = ?", user.id);
      const following = await all<{ id: string }>(env.DB, "SELECT followee AS id FROM follows WHERE follower = ? ORDER BY at DESC LIMIT 500", user.id);
      const followers = await all<{ id: string }>(env.DB, "SELECT follower AS id FROM follows WHERE followee = ? ORDER BY at DESC LIMIT 500", user.id);
      return {
        profile: profile ? { code: profile.code, updated: profile.updated, body: JSON.parse(profile.body) } : null,
        follows: { following: following.map((r) => r.id), followers: followers.map((r) => r.id) },
      };
    },
  },
};
