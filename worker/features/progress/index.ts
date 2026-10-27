/* The progress feature (docs/SPECS_API.md section 5): the learner's private progress document with revisions, and the hard-words
   summary that rides along. The Worker never merges: a stale baseRev gets 409 with the current document and the client merges
   (app/features/progress). Tables: docs (also holds the tutor and reader documents), weak. */
import { HttpError } from "../../core/http.ts";
import { charProblem } from "../../../shared/char.ts";
import type { ServerFeature } from "../../core/feature.ts";
import { all, first } from "../../core/db.ts";
import { getDoc, putDoc, saveWeak } from "./routes.ts";

export const feature: ServerFeature = {
  id: "progress",
  routes: [
    ["GET", "/api/doc/:kind", getDoc],
    ["PUT", "/api/doc/:kind", putDoc],
  ],
  docs: {
    kinds: {
      progress: {
        limit: 256 * 1024,
        // allowed top-level keys (docs/SPECS_SCHEMA.md section 3.1)
        keys: new Set(["v", "conf", "confAt", "box", "gram", "stats", "drill", "days", "ex", "log", "nick", "st", "prefs", "onb",
          "xp", "xpDays", "nd", "tree", "cheerSeen", "pos", "char", "profile", "placed", "at"]),
        validate: (body) => {
          if (!(Number(body.v) >= 4)) throw new HttpError("invalid", "progress.v must be 4 or more.", { field: "body" });
          const bad = charProblem(body.char);
          if (bad) throw new HttpError("invalid", bad, { field: "char" });
        },
      },
    },
    onPut: async ({ ctx, userId, kind, extras, now }) => {
      if (kind === "progress" && extras.weak !== undefined) await saveWeak(ctx, userId, extras.weak, now);
    },
  },
  account: {
    export: async ({ user, env }) => {
      const docs = await all<{ kind: string; body: string; rev: number; updated: number }>(env.DB, "SELECT kind, body, rev, updated FROM docs WHERE user_id = ?", user.id);
      const weak = await first<{ body: string; updated: number }>(env.DB, "SELECT body, updated FROM weak WHERE user_id = ?", user.id);
      return {
        docs: Object.fromEntries(docs.map((d) => [d.kind, { rev: d.rev, updated: d.updated, body: JSON.parse(d.body) }])),
        weak: weak ? { updated: weak.updated, body: JSON.parse(weak.body) } : null,
      };
    },
  },
};
