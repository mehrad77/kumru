// The page's small settings in localStorage under `kumru:<key>` (the tab, the Lab switch, the calendar). Reads and
// writes never throw; the sync documents live in app/host, not here.
import { lsGet, lsSet } from "../host/storage.ts";

export const local = {
  /** The stored string, or `fallback` (undefined when none is given) when there is none. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(key: string, fallback?: any): any {
    return lsGet(key) ?? fallback;
  },
  set(key: string, value: string): void {
    lsSet(key, value);
  },
};
