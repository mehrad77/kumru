/* The classes feature (docs/SPECS_API.md section 7 and 3): a teacher's class, a weekly board, members, what members share, and the
   /c/<code> invite page. Tables: classes, class_members. */
import type { ServerFeature } from "../../core/feature.ts";
import { all } from "../../core/db.ts";
import { classInvite } from "./invite.ts";
import { classBoard, classMembers, createClass, deleteClass, joinClass, leaveClass, listClasses, removeMember, setShare, updateClass } from "./routes.ts";
import * as rules from "./rules.ts";

export const feature: ServerFeature = {
  id: "classes",
  routes: [
    ["POST", "/api/classes", createClass],
    ["GET", "/api/classes", listClasses],
    ["POST", "/api/classes/join", joinClass],
    ["POST", "/api/classes/:id/leave", leaveClass],
    ["PATCH", "/api/classes/:id/me", setShare],
    ["PATCH", "/api/classes/:id", updateClass],
    ["DELETE", "/api/classes/:id", deleteClass],
    ["DELETE", "/api/classes/:id/members/:uid", removeMember],
    ["GET", "/api/classes/:id/board", classBoard],
    ["GET", "/api/classes/:id/members", classMembers],
  ],
  pages: [["GET", "/c/:code", classInvite]],
  rules,
  account: {
    export: async ({ user, env }) => {
      const classes = await all<{ id: string; name: string; code: string; owner: string; joined: number; share: number; share_book: number }>(env.DB,
        "SELECT c.id, c.name, c.code, c.owner, m.joined, m.share, m.share_book FROM class_members m JOIN classes c ON c.id = m.class_id WHERE m.user_id = ?", user.id);
      return { classes: classes.map((c) => ({ id: c.id, name: c.name, code: c.code, owner: c.owner === user.id, joined: c.joined, share: !!c.share, shareBook: !!c.share_book })) };
    },
  },
};
