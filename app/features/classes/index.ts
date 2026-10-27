// The classes feature: a class has a code, a weekly board and an owner (the teacher) who sees what members choose to share. The
// Classes card on Friends and Profile, the class page (/c/<code>), the join / start / manage forms and the members list. Server half:
// worker/features/classes; contract: shared/classes.ts; routes: docs/SPECS_API.md section 7. README.md lists what it owns.
import type { ComponentType } from "preact";
import type { WebFeature } from "../../core/feature.ts";
import { classesApi } from "./api.ts";
import { pageCode } from "./page.ts";

export { classesApi as classes } from "./api.ts";
export { classList, bookClasses, loadClasses } from "./state.ts";
export { joinClassFromInvite, openClassMember } from "./sheets.ts";

/** A class's weekly board from the Worker (the Friends leaderboard shows it). */
export const classBoard = (id: string) => classesApi.board(id);
/** The board list component, for another feature to draw (its index carries no Preact). */
export const loadBoardList = () => import("./BoardList.tsx").then((m) => m.BoardList);

export const feature: WebFeature = {
  id: "classes",
  slots: {
    friendsCards: [{ order: 10, load: () => import("./ClassCards.tsx").then((m) => m.FriendsClasses as ComponentType) }],
    profileCards: [{ order: 20, load: () => import("./ClassCards.tsx").then((m) => m.ProfileClasses as ComponentType) }],
  },
  // while a class page is open the address bar shows /c/<code>
  url: [{ priority: 40, current: () => { const c = pageCode(); return c ? "/c/" + c : null; } }],
};

