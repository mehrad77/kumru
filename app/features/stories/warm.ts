// The learner's next story, made ready while they look at the Stories tab, so it opens at once: when the page is idle, the
// stage's bundle (the largest download) and the story's recorded lines (its voice manifest and clips; the service worker keeps
// /voices/ once fetched). Only the next story, once a visit, and not on a metered or slow connection.
import { loadLib } from "../../host/lib.ts";

const warmed = new Set<string>();
const idle = (f: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(f, { timeout: 4000 }) : setTimeout(f, 1500));
const frugal = () => {
  const c = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !!c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType ?? ""));
};

export function warmStory(id: string): void {
  if (warmed.has(id) || !navigator.onLine || frugal()) return;
  warmed.add(id);
  idle(() => {
    void loadLib("player").catch(() => {});
    void (async () => {
      const m = (await fetch("/data/manifest.json").then((r) => r.json())) as { voices?: string };
      if (!m.voices) return;
      const base = `${m.voices}${id}/`, v = (await fetch(`${base}manifest.json`).then((r) => (r.ok ? r.json() : null))) as { lines?: Record<string, Record<string, { f: string }>> } | null;
      const files = new Set(Object.values(v?.lines ?? {}).flatMap((per) => Object.values(per).map((c) => c.f)));
      for (const f of files) await fetch(base + f).catch(() => {});
    })().catch(() => {});
  });
}
