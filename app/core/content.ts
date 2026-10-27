// The course content as state: the cards, the grammar lessons and the path's sections (host.db collections, static files served from
// data/) land in `S.cards`, `S.grammar` and `S.tree` with their load flags, and the screen showing is redrawn as each arrives.
import { rerender } from "./router.ts";
import { status } from "./shell/appbar.ts";
import { S } from "./store.ts";

interface Snap { docs: { id: string; data: () => Record<string, unknown> }[] }
interface Collection { orderBy(field: string): Collection; onSnapshot(ok: (s: Snap) => void, err: (e: { code?: string }) => void): unknown }
interface Db { collection(name: string): Collection }

export function startContent(db: Db): void {
  const list = (snap: Snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  db.collection("cards").onSnapshot(
    (snap) => { S.cards = new Map(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }])); S.loaded = true; rerender(); },
    (err) => status("Lost connection to the notebook (" + err.code + "). Reload to reconnect."));
  db.collection("grammar").orderBy("order").onSnapshot(
    (snap) => { S.grammar = list(snap); S.gLoaded = true; rerender(); },
    () => { S.gLoaded = true; rerender(); });
  db.collection("path").orderBy("order").onSnapshot(
    (snap) => { S.tree = list(snap); S.tLoaded = true; rerender(); },
    () => { S.tLoaded = true; rerender(); });
}
