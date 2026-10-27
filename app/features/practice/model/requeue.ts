// The retry rule of a path step: a step answered wrong comes back three steps later (or last), at most twice, and the retry
// counts for neither stars nor XP. Pure: the session is passed in.

/** The parts of a session and a step the rule reads. */
export interface RetrySession { node?: unknown; queue: RetryStep[]; total: number }
export interface RetryStep { c?: unknown; sent?: unknown; retry?: number; [field: string]: unknown }

/** How many times a step may come back. */
export const MAX_RETRIES = 2;
/** How many steps pass before it does, so it is not the same screen again at once. */
export const RETRY_GAP = 3;

/** Queue `st` again in `s` if the rule allows: only inside a path node, only when a word or sentence was asked, at most twice. */
export function requeue(s: RetrySession | null | undefined, st: RetryStep | null | undefined): void {
  if (!s || !s.node || !st || !(st.c || st.sent) || (st.retry || 0) >= MAX_RETRIES) return;
  s.queue.splice(Math.min(s.queue.length, RETRY_GAP), 0, { ...st, retry: (st.retry || 0) + 1 });
  s.total++;
}
