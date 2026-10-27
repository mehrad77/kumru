/* window.kumru.host: the only code that talks to the network (docs/SPECS.md section 6). It keeps the
   surface the page used on claude.ai (`db.collection().orderBy().onSnapshot`, `db.doc().get/set/onSnapshot`,
   `user.id/me/canEdit/can`, `ai`) so src/ barely changes, and adds `update` for the new-version
   prompt. The account routes are the account feature's (app/features/account/api.ts). window.kumru.merge is shared/progress.ts and shared/tutor.ts.

   Content comes from the static files. Signed out, `user.id()` is null and the page saves on the device
   only. Signed in, progress and tutor sync through app/host/sync.ts. Friends and classes talk to their routes through their own
   features (app/features/friends/api.ts, app/features/classes/api.ts). `ai` is null: the page's AI features use their offline paths. */
import type { User } from "../../shared/api.ts";
import { mergeProgress } from "../../shared/progress.ts";
import { mergeTutor } from "../../shared/tutor.ts";
import { owner } from "./owner.ts";
import { hostError, loadCollection, snapshotOf, type Snapshot, type HostError } from "./content.ts";
import { loadLib } from "./lib.ts";
import { applyDevSwitches, devSignIn } from "./dev.ts";
import { applyUpdate, registerServiceWorker } from "./pwa.ts";
import { captureInvite } from "./invite.ts";
import { lsGet, lsSet } from "./storage.ts";
import { DocSync, type DocSnapshot } from "./sync.ts";
import { api, getToken } from "./transport.ts";

/** Collections that exist on claude.ai but are empty here (docs/SPECS.md section 6). */
const EMPTY_COLLECTIONS = new Set(["tutorlab"]);

interface CollectionRef {
  orderBy(field: string): CollectionRef;
  get(): Promise<any>;
  onSnapshot(ok: (s: any) => void, err?: (e: any) => void): () => unknown;
}
interface DocRef {
  id: string;
  path: string;
  get(): Promise<DocSnapshot | { exists: boolean; id: string; data: () => any }>;
  set(...args: any[]): Promise<unknown>;
  delete(): Promise<never>;
  onSnapshot?(fn: (s: DocSnapshot) => void): () => unknown;
}

const syncs: Record<"progress" | "tutor", DocSync> = { progress: new DocSync("progress", mergeProgress), tutor: new DocSync("tutor", mergeTutor) };

function collectionRef(name: string, order: string | null): CollectionRef {
  const get = () => (EMPTY_COLLECTIONS.has(name)
    ? Promise.resolve(snapshotOf({}, null))
    : loadCollection(name).then((docs) => snapshotOf(docs, order)));
  return {
    orderBy: (field: string) => collectionRef(name, field),
    get,
    onSnapshot(ok: (s: Snapshot) => void, err?: (e: HostError) => void) {
      let live = true;
      get().then((s) => { if (live) ok(s); }, (e) => { if (live && err) err(e); });
      return () => { live = false; };
    },
  };
}

function docRef(path: string): DocRef {
  const id = path.split("/").pop() || "";
  const denied = () => Promise.reject(hostError("unauthorized", "Sign in to save to your account."));
  const kind = /^data\/users\/[^/]+\/(progress|tutor)$/.exec(path)?.[1] as "progress" | "tutor" | undefined;
  if (kind && getToken()) {
    const s = syncs[kind];
    return { id, path, get: () => s.load(), set: (body: any, opts?: { weak?: any; book?: any }) => s.set(body, opts && opts.weak, opts && opts.book), onSnapshot: (fn: (s: DocSnapshot) => void) => s.onSnapshot(fn), delete: denied };
  }
  return { id, path, get: () => Promise.resolve({ exists: false, id, data: () => undefined }), set: denied, delete: denied, onSnapshot: () => () => {} };
}

/** The signed-in user saved on this device, so an offline boot keeps the identity. */
function cachedUser(): User | null {
  try { const s = lsGet("me"); return s ? JSON.parse(s) : null; } catch { return null; }
}

/** The signed-in user: refreshed from /api/me once per page, the cached copy when offline. */
let meP: Promise<User | null> | null = null;
function me(): Promise<User | null> {
  if (!getToken()) return Promise.resolve(null);
  if (!meP) {
    meP = api("GET", "/api/me").then((r) => {
      lsSet("me", JSON.stringify(r.json.user));
      return r.json.user;
    }, (e: HostError) => (e.code === "unauthorized" ? null : cachedUser()));
  }
  return meP;
}

const user = {
  id: async () => (await me())?.id ?? null,
  me: async () => ({ name: (await me())?.username ?? "", avatarUrl: "" }),
  canEdit: async () => (await me())?.role === "owner",
  /** "data.write" (the Friends profile) once signed in; nothing else is granted on this host. */
  can: async (cap: string) => cap === "data.write" && !!(await me()),
};

export const host = {
  db: { collection: (name: string) => collectionRef(name, null), doc: docRef },
  user,
  ai: null as null,
  owner,
  /** A lazy TypeScript bundle (app/lib/<name>.ts, registered in lib.ts) as an ES module, imported on first use. */
  lib: loadLib,
  signedIn: () => !!getToken(),
  update: applyUpdate,
};

/** The host the page talks to (window.kumru.host). */
export type Host = typeof host;

applyDevSwitches();
captureInvite();
devSignIn();
window.kumru = { host, merge: { progress: mergeProgress, tutor: mergeTutor } };
registerServiceWorker();
/* pull on focus and when the app comes to the front, at most once every 10 s: switching apps quickly
   (or a pane that toggles visibility) must not turn into a request loop */
const PULL_GAP = 10_000;
let lastPull = 0;
const pull = () => {
  if (!getToken() || document.visibilityState !== "visible" || Date.now() - lastPull < PULL_GAP) return;
  lastPull = Date.now();
  syncs.progress.pull();
  syncs.tutor.pull();
};
document.addEventListener("visibilitychange", pull);
addEventListener("focus", pull);
addEventListener("online", () => { for (const s of Object.values(syncs)) s.schedule(0); });
