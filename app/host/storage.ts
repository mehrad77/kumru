/* Device storage. Every key starts with `kumru:` (docs/SPECS_SCHEMA.md section 6), and every read and write
   may throw (private mode, blocked site data), so each is wrapped and the page works with none of them. */

export const LS_PREFIX = "kumru:";

export function lsGet(key: string): string | null {
  try { return localStorage.getItem(LS_PREFIX + key); } catch { return null; }
}

export function lsSet(key: string, value: string): void {
  try { localStorage.setItem(LS_PREFIX + key, value); } catch { /* storage full or blocked */ }
}

export function lsDel(key: string): void {
  try { localStorage.removeItem(LS_PREFIX + key); } catch { /* blocked */ }
}

/** Remove every `kumru:` key (?fresh, sign-out of a shared phone). */
export function lsClearAll(): void {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(LS_PREFIX)) localStorage.removeItem(k);
  } catch { /* blocked */ }
}
