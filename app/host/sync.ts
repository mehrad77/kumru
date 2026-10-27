/* One private document (progress or tutor) kept in step with the server (docs/SPECS.md section 9):
   - load(): GET, merged with any save still pending from an earlier visit;
   - set(body): PUT with baseRev; a 409 merges the server copy in (shared/progress.ts, shared/tutor.ts), tells the page
     through onSnapshot, and PUTs again, at most 3 times in a row; offline and 5xx back off and retry;
   - pull(): on focus and visibility, GET ?since=rev; a newer copy is merged and handed to the page.
   The body waiting to be saved lives in localStorage (`kumru:pending:<kind>`, `kumru:dirty`), so
   answers given offline reach the server on the next connection, even after a reload. */
import type { BookDoc, DocKind, WeakDoc } from "../../shared/api.ts";
import { api, retryable, type ApiFailure } from "./transport.ts";
import { lsDel, lsGet, lsSet } from "./storage.ts";

export type Merge = (a: any, b: any) => any;
export interface DocSnapshot { exists: boolean; id: string; data: () => any }

const MAX_CONFLICTS = 3;
const BACKOFF = [2000, 4000, 8000, 16000, 32000, 60000, 120000, 300000];

export class DocSync {
  rev: number;
  pending: any;
  inflight = false;
  again = false;
  /** The hard-words summary that rides along (progress only). */
  weak: WeakDoc | undefined = undefined;
  /** The reader-book summary that rides along while the learner shares it with a class (progress only). */
  book: BookDoc | undefined = undefined;
  conflicts = 0;
  failures = 0;
  timer: ReturnType<typeof setTimeout> | undefined = undefined;
  listeners = new Set<(s: DocSnapshot) => void>();
  last: any = null;

  constructor(readonly kind: DocKind, readonly merge: Merge) {
    this.rev = Number(lsGet("rev:" + kind)) || 0;
    this.pending = readJson(lsGet("pending:" + kind));
  }

  async load(): Promise<DocSnapshot> {
    const r = await api("GET", "/api/doc/" + this.kind);
    let body = r.json.body;
    this.setRev(r.json.rev);
    if (this.pending) {
      body = body ? this.merge(body, this.pending) : this.pending;
      this.setPending(body);
      this.schedule(0);
    }
    this.last = body;
    return snapshot(this.kind, body);
  }

  set(body: any, weak?: WeakDoc, book?: BookDoc): Promise<void> {
    this.weak = weak;
    this.book = book;
    this.setPending(body);
    this.conflicts = 0;
    if (this.inflight) this.again = true;
    else this.schedule(0);
    return Promise.resolve();
  }

  async pull(): Promise<void> {
    if (this.inflight) return;
    let r;
    try { r = await api("GET", `/api/doc/${this.kind}?since=${this.rev}`); } catch { return; }
    if (r.status === 304 || !r.json || r.json.rev === this.rev) return;
    let body = r.json.body;
    this.setRev(r.json.rev);
    if (this.pending) {
      body = this.merge(this.pending, body);
      this.setPending(body);
      this.schedule(0);
    }
    this.emit(body);
  }

  onSnapshot(fn: (s: DocSnapshot) => void): () => boolean {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  schedule(ms: number): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), ms);
  }

  async flush(): Promise<void> {
    if (this.inflight || !this.pending) return;
    this.inflight = true;
    const body = this.pending;
    try {
      const r = await api("PUT", "/api/doc/" + this.kind, { baseRev: this.rev, body, ...(this.weak ? { weak: this.weak } : {}), ...(this.book ? { book: this.book } : {}) });
      this.setRev(r.json.rev);
      this.failures = 0;
      this.conflicts = 0;
      if (this.pending === body) this.setPending(null);
      this.last = body;
    } catch (e) {
      const err = e as ApiFailure;
      if (err.code === "conflict") {
        this.setRev(err.rev || 0);
        const merged = this.merge(this.pending, err.body);
        this.setPending(merged);
        this.emit(merged);
        if (++this.conflicts < MAX_CONFLICTS) this.schedule(0);
      } else if (err.code === "rate_limited") {
        this.schedule((err.retryAfter || 1) * 1000);
      } else if (retryable(err)) {
        this.schedule(BACKOFF[Math.min(this.failures++, BACKOFF.length - 1)]);
      } else if (err.code === "invalid" && err.field === "char" && this.pending === body && body?.char) {
        // a character the Worker refuses (shared/char.ts) must not stall every later save: drop it, once
        console.warn("char refused, dropped:", err.message);
        const fixed = { ...body, at: { ...(body.at || {}), char: Date.now() } };
        delete fixed.char;
        this.setPending(fixed);
        this.emit(fixed);
        this.schedule(0);
      } else if (err.code === "invalid") {
        console.warn(`${this.kind} save refused:`, err.field, err.message);
      }
      // unauthorized: transport has signed the device out; the pending body stays for the next sign-in
    } finally {
      this.inflight = false;
    }
    if (this.again) {
      this.again = false;
      if (this.pending) this.schedule(0);
    }
  }

  emit(body: any): void {
    this.last = body;
    const s = snapshot(this.kind, body);
    for (const fn of this.listeners) { try { fn(s); } catch (e) { console.warn("doc listener", e); } }
  }

  setRev(rev: number): void {
    this.rev = rev;
    lsSet("rev:" + this.kind, String(rev));
  }

  setPending(body: any): void {
    this.pending = body;
    if (body) lsSet("pending:" + this.kind, JSON.stringify(body));
    else lsDel("pending:" + this.kind);
    if (body || lsGet("pending:progress") || lsGet("pending:tutor")) lsSet("dirty", "1");
    else lsDel("dirty");
  }
}

function snapshot(kind: string, body: any): DocSnapshot {
  return { exists: body != null, id: kind, data: () => (body == null ? undefined : JSON.parse(JSON.stringify(body))) };
}

function readJson(s: string | null): any {
  try { return s ? JSON.parse(s) : null; } catch { return null; }
}
