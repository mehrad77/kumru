// Opening the card sheet (DOM only; CardSheet.tsx draws inside it).
import { el } from "../../core/dom.ts";
import { S } from "../../core/store.ts";
import { mountInto } from "../../ui/open.ts";
import { labSheet } from "../../ui/sheet.ts";

export function openCardSheet(id: string): void {
  const c = S.cards.get(id);
  if (!c) return;
  const host = el("div", { style: "display:contents" });
  labSheet(c.tr, c.tr, host);
  void mountInto(host, () => import("./CardSheet.tsx").then((m) => m.CardSheet), { card: c });
}
