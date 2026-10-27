/* What tapping a reminder does (app/host/sw.ts): focus an open window of the site the reminder points at, or open its URL.
   Pure, so app/host/notify.test.ts can also replay the retired YaKerim site's worker against today's absolute payload URL. */

/** `focus` an open window (by index) or `open` a URL. `url` is the reminder's `data.url`, absolute or relative to `self`. */
export function clickTarget(url: string | undefined, self: string, windows: string[]): { focus: number } | { open: string } {
  const target = new URL(url || "/", self);
  const at = windows.findIndex((w) => new URL(w).origin === target.origin);
  return at >= 0 ? { focus: at } : { open: target.href };
}
