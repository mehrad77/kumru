/* The class-shared book progress (docs/SPECS_SCHEMA.md sections 2.10b and 3.7), written beside a progress save. */
import { first, run } from "../../core/db.ts";
import type { Ctx } from "../../core/router.ts";

const BOOK_MAX = 4096;

/** The book-progress summary that rides along (docs/SPECS_SCHEMA.md sections 2.10b and 3.7): an object of at most 4 KB, stored at most once a
 *  minute and only while the learner shares book progress with a class (`class_members.share_book = 1`), so unsharing never leaves a
 *  stale copy behind. A bad, oversized, early or unwanted one is dropped, not an error. The Worker checks size and shape, never the content. */
export async function saveBook(ctx: Ctx, userId: string, book: unknown, now: number): Promise<void> {
  if (!book || typeof book !== "object" || Array.isArray(book)) return;
  const text = JSON.stringify(book);
  if (new TextEncoder().encode(text).length > BOOK_MAX) return;
  const prev = await first<{ updated: number }>(ctx.env.DB, "SELECT updated FROM book WHERE user_id = ?", userId);
  if (prev && now - prev.updated < 60_000) return;
  if (!(await first(ctx.env.DB, "SELECT 1 FROM class_members WHERE user_id = ? AND share_book = 1 LIMIT 1", userId))) return;
  await run(ctx.env.DB, "INSERT INTO book (user_id, body, updated) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET body = excluded.body, updated = excluded.updated", userId, text, now);
}
