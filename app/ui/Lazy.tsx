// A component another feature (or a chunk of this one) offers as `() => import(...)`: drawn once it has loaded, nothing before.
// Features reach each other's screens this way, because their index.ts files carry no Preact.
import type { ComponentType } from "preact";
import { useEffect, useState } from "preact/hooks";

export function Lazy<P extends object>({ load, props }: { load: () => Promise<ComponentType<P>>; props: P }) {
  const [C, setC] = useState<{ c: ComponentType<P> } | null>(null);
  useEffect(() => {
    let live = true;
    load().then((c) => { if (live) setC({ c }); }, (e) => console.warn("component failed to load", e));
    return () => { live = false; };
  }, [load]);
  return C ? <C.c {...props} /> : null;
}
