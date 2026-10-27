// Notebook feature: the reader's notebook as Kumru sees it. The consent sheet for /connect/yeni (code + PKCE, docs/AUTH.md),
// the connections list on the Account card, the "In the book" line and checkpoint offers on the Path, the Profile banner, the
// /unit/<REF> deep link, and the book summary a learner may share with a class. Server half: worker/features/yeni; contract:
// shared/yeni.ts; routes: docs/SPECS_API.md section 11a. README.md lists what it owns.
import type { ComponentType } from "preact";
import type { WebFeature } from "../../core/feature.ts";
import { S } from "../../core/store.ts";
import { openGate } from "../account/index.ts";
import { addSaveHook } from "../progress/index.ts";
import { BOOT } from "../../core/router.ts";
import { gateNote } from "./gateNote.ts";
import { bookOpenUnit, bookPayload, bookSent } from "./book.ts";
import { openConnect } from "./sheets.ts";
import { markMeReady, watchPassword } from "./state.ts";

export { READER, readerSlug, readerUrl } from "./model/reader.ts";

/** The class pages' views of a member's shared book progress, for the classes feature to draw (this index carries no Preact). */
export const loadClassBookBox = () => import("./ClassBook.tsx").then((m) => m.ClassBookBox);
export const loadClassBookLine = () => import("./ClassBook.tsx").then((m) => m.ClassBookLine);

export const feature: WebFeature = {
  id: "yeni",
  // /connect/yeni: the consent sheet opens at once, with a placeholder, and fills in when the session is known
  boot: {
    // on /connect/yeni the sign-in gate says who is asking and offers a way back to the reader
    gated: (ctx) => { if (ctx.gated) { if (BOOT.connect === "yeni") openGate(gateNote()); } else if (BOOT.connect) openConnect(); },
    identity: markMeReady,
  },
  slots: {
    // the connections row on the Account card, the banner at the end of the Profile grid, and the book box above the Path
    pathBanners: [{ order: 10, load: () => import("./PathBits.tsx").then((m) => m.PathBits as ComponentType) }],
    accountRows: [{ order: 10, load: () => import("./AccountRow.tsx").then((m) => m.AccountRow as ComponentType) }],
    profileCards: [{ order: 100, load: () => import("./Promo.tsx").then((m) => m.Promo as ComponentType) }],
  },
  open: {
    unit: {
      open: bookOpenUnit,
      needs: () => S.loaded && S.gLoaded && S.tLoaded && S.progLoaded,
      exists: (u) => /^(A1|A2|B1)_[1-6]$/.test(u),
      gone: ["That unit doesn't exist.", "path"],
    },
  },
};

// the book progress rides along with every progress save. (The progress feature imports no feature, so it is up before this runs.)
addSaveHook({ rider: () => { const bk = bookPayload(); return bk ? { data: { book: bk.doc }, sent: () => bookSent(bk.sig) } : null; } });
// a new password disconnects every reader (docs/AUTH.md)
watchPassword();
