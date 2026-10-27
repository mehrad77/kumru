/* The page's lazy TypeScript bundles. Each is a dynamic import that Vite turns into its own hashed chunk
   (assets/<name>-<hash>.js). `avatar` (the portraits) is precached; `builder` and `player` (Sahne's builder and story player)
   and the set families are cached by the service worker the first time they load (scripts/vite/page.ts LAZY_LIBS), so they
   work offline once used. Add a bundle here and it is loaded with `host.lib("<name>")`. */
const LIBS: Record<string, () => Promise<any>> = {
  avatar: () => import("../lib/avatar.ts"),
  builder: () => import("../lib/builder.ts"),
  player: () => import("../lib/player.ts"),
};

const libLoads = new Map<string, Promise<any>>();

/** The module of the lazy bundle `name`, imported once per page; a failed import is tried again on the next call. */
export function loadLib(name: string): Promise<any> {
  const load = Object.hasOwn(LIBS, name) ? LIBS[name] : null;
  if (!load) return Promise.reject(new Error(`no lazy bundle named "${name}"`));
  let p = libLoads.get(name);
  if (!p) {
    p = load();
    libLoads.set(name, p);
    p.catch(() => libLoads.delete(name));
  }
  return p;
}
