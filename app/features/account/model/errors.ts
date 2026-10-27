// What a failed account request says to a learner: friendly text for offline, a timeout, a rate limit and a server fault;
// the server's own message (it names the problem and is written to be read) for everything else.

/** The parts of an `ApiFailure` (host/transport.ts) the text depends on; anything else thrown reads as a generic failure. */
export interface FailureLike {
  code?: string;
  status?: number;
  retryAfter?: number;
  message?: string;
  field?: string;
}

export function accErr(e: unknown): string {
  const x = (e && typeof e === "object" ? e : {}) as FailureLike;
  const c = x.code, st = x.status;
  if (c === "offline") return "No connection, or Kumru took too long to answer. Check your internet and try again.";
  if (c === "rate_limited") {
    const s = x.retryAfter;
    return "Too many tries. " + (s ? "Try again in " + (s > 90 ? Math.ceil(s / 60) + " minutes" : s + " seconds") + "." : "Wait a little and try again.");
  }
  if (c === "internal" || c === "quota_exceeded" || (st && st >= 500)) return "Kumru had a problem on its side. Wait a moment and try again.";
  if (c === "upgrade_required") return "A new version of Kumru is ready. Reload the page.";
  if (x.message && !/^HTTP \d+$/.test(x.message)) return x.message;
  return st ? "Something went wrong (HTTP " + st + "). Try again." : "Something went wrong. Try again.";
}
