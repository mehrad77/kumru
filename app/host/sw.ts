/* Kumru service worker (docs/SPECS.md section 10.1). A separate Vite entry, built to /sw.js (no hash): the build
   (scripts/vite/page.ts) replaces the BUILD placeholder below with this build's version and the files to precache.

   - install: precache the page, data/manifest.json, the hashed data files, the icons and the page's script chunks
     into `kumru-<version>`; the new version then waits until the page asks it to take over ("Reload"). The heavy lazy
     chunks (Sahne's builder and story player, the set families: BUILD.lazy), the recordings (/sounds/) and the characters' recorded lines (/voices/) are not
     precached: they go into `kumru-lazy` the first time they are fetched, and stay there across versions. Only real files are
     kept (swcache.ts): the page that the Worker answers for an older build's file is a 404 here, never a cached chunk.
   - activate: delete the other `kumru-<version>` caches, and the lazy chunks this build no longer has.
   - fetch: /api goes to the network; same-origin GETs are cache-first (a navigation gets the cached
     page, so /f/… and /c/… links open offline too); Google Fonts are cached on first use. */
import { clickTarget } from "./notify.ts";
import { isFile, missing } from "./swcache.ts";

const sw = self as unknown as ServiceWorkerGlobalScope;

const BUILD: { version: string; files: string[]; lazy: string[] } = JSON.parse("__BUILD__");
const CACHE = "kumru-" + BUILD.version;
const FONTS = "kumru-fonts";
const LAZY = "kumru-lazy";

sw.addEventListener("install", (event) => {
  // each file is checked, not `addAll`ed: a deploy during the install answers this build's files with the page (swcache.ts), and
  // an install that fails leaves the version before it in charge until the next try
  event.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(BUILD.files.map(async (f) => {
      const res = await fetch(f, { cache: "no-cache" });
      if (!isFile(f, res)) throw new Error("not this build's " + f);
      await c.put(f, res);
    }));
  })());
});

sw.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("kumru-") && k !== CACHE && k !== FONTS && k !== LAZY) await caches.delete(k);
    const keep = new Set(BUILD.lazy), lazy = await caches.open(LAZY);
    for (const r of await lazy.keys()) { const p = new URL(r.url).pathname; if (p.startsWith("/assets/") && !keep.has(p)) await lazy.delete(r); }
    await sw.clients.claim();
  })());
});

sw.addEventListener("message", (event) => {
  if (event.data && event.data.type === "skip") sw.skipWaiting();
});

sw.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === sw.location.origin) {
    if (url.pathname.startsWith("/api/")) return;
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = req.mode === "navigate" ? await cache.match("/") : await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      // hashed files the precache leaves out (lazy code, recordings, recorded lines, story thumbnails): cached the first time, so a story opened
      // once plays offline
      if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/sounds/") || url.pathname.startsWith("/thumbs/") || url.pathname.startsWith("/voices/")) {
        const lazy = await caches.open(LAZY);
        const old = await lazy.match(req, { ignoreSearch: true });
        // an older worker may have kept the page as this file: dropped, and asked for again
        if (old && isFile(url.pathname, old)) return old;
        if (old) await lazy.delete(req, { ignoreSearch: true });
        const res = await fetch(req);
        // the page standing in for a file this build does not have: a 404, never kept
        if (!isFile(url.pathname, res)) return res.ok ? missing() : res;
        await lazy.put(req, res.clone());
        return res;
      }
      return fetch(req);
    })());
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith((async () => {
      const cache = await caches.open(FONTS);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === "opaque") cache.put(req, res.clone());
      return res;
    })());
  }
});

/* Streak reminders (app/features/reminders/api.ts, worker/features/reminders/cron.ts): show the pushed message, open the app on tap. */
sw.addEventListener("push", (event) => {
  let d = { title: "A story is waiting", body: "Kerim has a story for you today.", url: "/" };
  try { d = { ...d, ...event.data?.json() }; } catch { /* keep the default */ }
  event.waitUntil(sw.registration.showNotification(d.title, { body: d.body, icon: "/icon-192.png", badge: "/icon-192.png", data: { url: d.url }, tag: "kumru-streak" }));
});

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await sw.clients.matchAll({ type: "window", includeUncontrolled: true });
    const t = clickTarget(event.notification.data?.url, sw.location.href, all.map((c) => c.url));
    return "focus" in t ? all[t.focus].focus() : sw.clients.openWindow(t.open);
  })());
});
