/* Static course content (docs/SPECS.md section 5): data/manifest.json names one content-hashed file per
   collection, and each file is `{ "<id>": { id, …doc } }`. Loaded once per page; collections that
   learners never write need no polling. */

export interface Manifest { v: number; version: string; files: Record<string, string>; counts: Record<string, number> }
/** One document as the page reads it: `data()` is a fresh copy each call. */
export interface DocSnap { id: string; data: () => any }
export interface Snapshot { docs: DocSnap[]; size: number; empty: boolean }
export interface HostError { code: string; message: string }

let manifestP: Promise<Manifest> | null = null;
const collections = new Map<string, Promise<Record<string, any>>>();

async function getJson(url: string): Promise<any> {
  let r: Response;
  try { r = await fetch(url); } catch (e) { throw hostError("offline", "Couldn't reach Kumru: " + String(e)); }
  if (!r.ok) throw hostError(r.status === 404 ? "not_found" : "internal", `${url} answered ${r.status}`);
  return r.json();
}

export function hostError(code: string, message: string): HostError {
  return { code, message };
}

export function loadManifest(): Promise<Manifest> {
  if (!manifestP) {
    manifestP = getJson("/data/manifest.json");
    manifestP.catch(() => { manifestP = null; });
  }
  return manifestP;
}

export function loadCollection(name: string): Promise<Record<string, any>> {
  let p = collections.get(name);
  if (!p) {
    p = loadManifest().then((m) => (m.files[name] ? getJson("/" + m.files[name]) : {}));
    p.catch(() => collections.delete(name));
    collections.set(name, p);
  }
  return p;
}

/** The `{ docs: [{ id, data() }] }` shape the page reads, ordered ascending by `order` when asked. */
export function snapshotOf(docs: Record<string, any>, order: string | null): Snapshot {
  const list = Object.entries(docs).map(([id, d]) => ({ id, data: () => JSON.parse(JSON.stringify(d)) }));
  if (order) list.sort((a, b) => ((docs[a.id][order] ?? 0) - (docs[b.id][order] ?? 0)));
  return { docs: list, size: list.length, empty: !list.length };
}
