// The steps of a words lesson. Pure; the session that plays them is the practice runner.
import { chunkWords } from "../../../lib/chunk.ts";

export interface Step {
  k: "learn" | "choice" | "match" | "type" | "listen" | "build";
  [field: string]: unknown;
}
export interface LessonWord { id: string; tr: string; [field: string]: unknown }

/**
 * A words lesson: teach a word, check the one before it, then a match round and a write-it step per word. Every word is
 * asked three times (check, match, write); a miss comes back through the session's requeue. `rev` are earlier words to warm
 * up with, `sents` the reading sentences that use these words (asked as build steps), `voice` whether a Turkish voice exists
 * (every third write-it step becomes a listen step).
 */
export function wordLessonSteps<W extends LessonWord>(ws: W[], label: string, voice: boolean, rev: W[] = [], sents: unknown[] = []): Step[] {
  const n = ws.length, q: Step[] = [];
  const chk = (c: W, dir: string, upto: number): Step => ({ k: "choice", c, dir, pool: ws, dpool: ws.slice(0, upto), label });
  rev.forEach((c) => q.push({ k: "choice", c, dir: "m", pool: rev, dpool: rev, label: "Review" }));   // warm-up on earlier words
  ws.forEach((c, i) => {
    q.push({ k: "learn", c, n: i + 1, of: n, pool: ws });
    if (i > 0) q.push(chk(ws[i - 1], "m", i + 1));   // wrong options: only words taught so far
  });
  if (n) q.push(chk(ws[n - 1], "m", n));
  if (n > 1) chunkWords(ws, 5).forEach((cards) => q.push({ k: "match", cards, pool: ws, label }));   // rounds of at most 5 pairs
  const turn = n > 2 ? 2 : 0;
  ws.map((_, i) => ws[(i + turn) % n]).forEach((c, i) => q.push({ k: voice && i % 3 === 2 ? "listen" : "type", c, pool: ws, label }));
  // then sentences that use the words, and a last match round that mixes this lesson's words with earlier ones
  sents.forEach((sent) => q.push({ k: "build", sent, spool: sents, pool: ws, label }));
  {
    const mix = [...ws.slice(-3), ...rev.slice(0, 2)];
    if (mix.length >= 3 && (rev.length || n > 5)) q.push({ k: "match", cards: mix, pool: ws, label: "Review" });
  }
  return q;
}
