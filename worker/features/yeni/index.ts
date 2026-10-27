/* The yeni feature (docs/SPECS_API.md section 11a, docs/AUTH.md): Notebook's connection and notebook sync, and the
   book progress a learner shares with a class. Session routes serve the connect page and the Account card; the bearer routes
   (`cors: "yeni"`, `errors: "flat"`) are called cross-origin by the reader. Tables: yeni_tokens, yeni_codes, book (and the
   notebook document, `docs` kind "yeni"). */
import type { ServerFeature } from "../../core/feature.ts";
import { all, first } from "../../core/db.ts";
import { saveBook } from "./book.ts";
import { codes, dropToken, exchange, getYeniDoc, list, notebook, origins, putYeniDoc, revoke } from "./routes.ts";
import * as rules from "./rules.ts";

const reader = { cors: "yeni", errors: "flat" } as const;

export const feature: ServerFeature = {
  id: "yeni",
  routes: [
    ["GET", "/api/yeni/origins", origins],
    ["POST", "/api/yeni/codes", codes],
    ["POST", "/api/yeni/token", exchange, reader],
    ["GET", "/api/yeni/tokens", list],
    ["GET", "/api/yeni/notebook", notebook],
    ["DELETE", "/api/yeni/tokens/:id", revoke],
    ["GET", "/api/yeni/doc", getYeniDoc, reader],
    ["PUT", "/api/yeni/doc", putYeniDoc, reader],
    ["DELETE", "/api/yeni/token", dropToken, reader],
  ],
  rules,
  docs: {
    // the class-shared book summary rides along with a progress save
    onPut: async ({ ctx, userId, kind, extras, now }) => {
      if (kind === "progress" && extras.book !== undefined) await saveBook(ctx, userId, extras.book, now);
    },
  },
  sweep: {
    order: 20,
    statements: (env, now) => [
      env.DB.prepare("DELETE FROM yeni_codes WHERE expires < ?").bind(now),
      // book summaries nobody is shared with any more (a deleted class, or the learner stopped sharing)
      env.DB.prepare("DELETE FROM book WHERE user_id NOT IN (SELECT user_id FROM class_members WHERE share_book = 1)"),
    ],
  },
  account: {
    export: async ({ user, env }) => {
      const book = await first<{ body: string; updated: number }>(env.DB, "SELECT body, updated FROM book WHERE user_id = ?", user.id);
      const tokens = await all<{ id: string; label: string | null; created_at: number; last_used_at: number }>(env.DB,
        "SELECT id, label, created_at, last_used_at FROM yeni_tokens WHERE user_id = ? ORDER BY created_at DESC", user.id);
      return { book: book ? { updated: book.updated, body: JSON.parse(book.body) } : null, yeniTokens: tokens };
    },
    // a deleted account's reader connections end at once
    remove: ({ user, env }) => [
      env.DB.prepare("DELETE FROM yeni_tokens WHERE user_id = ?").bind(user.id),
      env.DB.prepare("DELETE FROM yeni_codes WHERE user_id = ?").bind(user.id),
    ],
  },
};
