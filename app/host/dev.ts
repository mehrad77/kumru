/* Dev-only switches (docs/SPECS.md section 11.4). They run only on a local host (`pnpm dev`), before the
   page's own script, so they can shape the device's saved progress the page then boots from.

   ?fresh            clear every kumru: key and cache: a brand-new learner
   ?learner          load the dev learner (part-way through A1; built in by the dev build, scripts/vite/page.ts)
   ?learn=g_a1_4_iyelik,...   mark those lessons learned
   ?treedone=N       mark the first N steps of the skill tree done (skills in order, a checkpoint after each section)
   ?sw               register the service worker in dev too
   ?as=<username>    sign in as a seeded account (pnpm seed) without a password, via POST /api/dev/login

   The page's own dev switches (?only=, ?skill=) read window.__DEV, which this sets. */
import { lsClearAll, lsGet, lsSet } from "./storage.ts";
import { api, forgetSession, setToken } from "./transport.ts";

export function isDev(): boolean {
  const h = location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".localhost");
}

export function applyDevSwitches(): void {
  if (!isDev()) return;
  window.__DEV = true;
  const q = new URLSearchParams(location.search);
  if (q.has("fresh")) {
    lsClearAll();
    // once per visit: the reload after sign-up must not wipe the new session
    q.delete("fresh");
    history.replaceState(null, "", location.pathname + (q.size ? "?" + q : "") + location.hash);
    if ("caches" in window) caches.keys().then((ks) => ks.filter((k) => k.startsWith("kumru-")).forEach((k) => caches.delete(k)));
  }
  const blob = window.__KUMRU_DEV__;
  let p: any = null;
  if (q.has("learner") && blob) p = JSON.parse(JSON.stringify(blob.learner));
  if (q.has("learn") || q.has("treedone")) p = p || JSON.parse(lsGet("progress:anon") || "{}");
  if (!p) return;
  p.gram = p.gram || {};
  for (const g of (q.get("learn") || "").split(",").filter(Boolean)) p.gram[g] = 1;
  let left = Number(q.get("treedone")) || 0;
  if (left > 0 && blob) {
    const tp: { v: number; sk: Record<string, object>; sec: Record<string, object> } = { v: 1, sk: {}, sec: {} };
    for (const [sid, skills] of blob.tree) {
      let all = true;
      for (const sk of skills) {
        if (left > 0) { tp.sk[sk] = { l: 99, at: 1, stars: 3 }; left--; } else all = false;
      }
      if (all && left > 0) { tp.sec[sid] = { at: 1, stars: 3, how: "cp" }; left--; }
    }
    p.tree = tp;
  }
  lsSet("progress:anon", JSON.stringify(p));
}

/** ?as=<username>: swap this device's session for a seeded account's, then reload without the switch. */
export function devSignIn(): void {
  if (!isDev()) return;
  const q = new URLSearchParams(location.search), name = q.get("as");
  if (!name) return;
  q.delete("as");
  q.delete("fresh");
  const clean = location.pathname + (q.toString() ? "?" + q : "") + location.hash;
  forgetSession();
  api("POST", "/api/dev/login", { username: name }).then((r) => {
    setToken(r.json.token);
    lsSet("me", JSON.stringify(r.json.user));
    location.replace(clean);
  }, (e) => console.warn("?as failed", e));
}
