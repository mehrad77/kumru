// The words feature: what the app shows about a single word. The /card/<id> sheet (the reader's "Practise in Kumru" links), the
// tap-to-translate popup, the practice chip (how a card is going) and the read-only notes list on Profile. README.md lists what it
// owns.
import type { ComponentType } from "preact";
import type { WebFeature } from "../../core/feature.ts";
import { S } from "../../core/store.ts";
import { openCardSheet } from "./sheets.ts";

export { trLow } from "./model/text.ts";
export { closeGloss, showGloss, type GlossInfo } from "./gloss.ts";

export const feature: WebFeature = {
  id: "words",
  // "My notes" is the first card of the Profile grid after Stats: a count that opens the notes as a page
  slots: { profileCards: [{ order: 5, load: () => import("./Notes.tsx").then((m) => m.NotesCard as ComponentType) }] },
  open: { card: { open: openCardSheet, needs: () => S.loaded, exists: (id) => S.cards.has(id), gone: ["That card doesn't exist.", "path"] } },
};

