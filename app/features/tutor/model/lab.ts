// The tutor lab's scoring: how one answer compares with its fixture, and the run's summary. Pure.
import type { CheckResult } from "./prompts.ts";
import { sameSent } from "./diff.ts";

/** A test sentence: `ok` says it is already right; otherwise `fix` is the expected correction and `lesson` the lesson to link. */
export interface Fixture { text: string; ok: boolean; fix?: string; lesson: string }

export type Verdict = "pass" | "close" | "fail" | "err";

/** How the checker did on one fixture: right on a right sentence, the exact fix (pass) or any catch (close) on a wrong one. */
export function verdict(f: Fixture, r: CheckResult | null): Verdict {
  if (!r) return "err";
  if (f.ok) return r.ok ? "pass" : "fail";
  return !r.ok ? (sameSent(r.corrected, f.fix) ? "pass" : "close") : "fail";
}

export interface Summary { caught: number; errors: number; falseFlags: number; correct: number; exact: number; link: number; medianMs: number }

/** The run so far (only the answers that came back). */
export function summarize(res: { f: Fixture; r: CheckResult }[]): Summary & { median: string } {
  const err = res.filter((x) => !x.f.ok), okx = res.filter((x) => x.f.ok);
  const caught = err.filter((x) => !x.r.ok).length, falseFlags = okx.filter((x) => !x.r.ok).length;
  const exact = err.filter((x) => sameSent(x.r.corrected, x.f.fix)).length, link = err.filter((x) => x.r.notes.some((n) => n.lesson === x.f.lesson)).length;
  const ms = res.map((x) => x.r.ms).sort((a, b) => a - b), mid = ms[Math.floor(ms.length / 2)];
  return { caught, errors: err.length, falseFlags, correct: okx.length, exact, link, medianMs: mid || 0, median: ms.length ? (mid / 1000).toFixed(1) + " s" : "–" };
}
