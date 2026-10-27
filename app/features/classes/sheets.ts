// Opening the Classes screens (DOM only: this module is in the entry chunk, each screen's Preact component loads when it is first
// drawn): a class's page, the join / start / manage forms, the members list, and a member's profile for the class owner.
import type { Class, ClassBoard, ClassMember } from "../../../shared/api.ts";
import { setTab } from "../../core/router.ts";
import { openIsland } from "../../ui/open.ts";
import { closeSheet, confirmSheet, type ConfirmOptions } from "../../ui/sheet.ts";
import { toast } from "../../ui/toast.ts";
import { addProfiles, openFriendSheet } from "../friends/index.ts";
import { classesApi, clErr } from "./api.ts";
import { showPage } from "./page.ts";
import { classList, loadClasses } from "./state.ts";

/** The destructive-action sheet, with failures read through clErr. */
export const confirmClass = (o: ConfirmOptions): void => confirmSheet({ ...o, errText: clErr });

/** A class's weekly board as a page. The board is fetched first; a failure is said and nothing opens. */
export async function openClassBoard(c: Class): Promise<void> {
  let b: ClassBoard;
  try { b = await classesApi.board(c.id); } catch (e) { toast(clErr(e)); return; }
  closeSheet();
  showPage(c.code, c.name, () => import("./BoardPage.tsx").then((m) => m.BoardPage), { c, b });
}

export function openJoinClass(code: string): void {
  void import("./JoinClass.tsx").then((m) => m.openJoinForm(code));
}

export function openCreateClass(): void {
  openIsland("Start a class", "Start a class", () => import("./Editor.tsx").then((m) => m.CreateClass), {});
}

/** "Manage class"; `focus: "description"` puts the cursor in the description (the class page's "Add a description"). */
export function openEditClass(c: Class, focus?: "description"): void {
  openIsland("Manage class", "Manage class", () => import("./Editor.tsx").then((m) => m.EditClass), { c, focus });
}

export async function openClassMembers(c: Class): Promise<void> {
  let ms: ClassMember[];
  try { ms = await classesApi.members(c.id); } catch (e) { toast(clErr(e)); return; }
  openIsland("Members of " + c.name, "Class members", () => import("./Members.tsx").then((m) => m.Members), { c, ms });
}

const memberCache: Record<string, { at: number; list: ClassMember[] }> = {};

/** The class owner opens a member's profile: the public sheet plus what the member shares with the owner (cached 60 seconds). */
export async function openClassMember(c: Class, b: ClassBoard, id: string): Promise<void> {
  addProfiles(b.profiles, b.names);
  let extra: { load: () => Promise<never>; props: object } | null = null;
  try {
    const hit = memberCache[c.id];
    const m = hit && Date.now() - hit.at < 60e3 ? hit : (memberCache[c.id] = { at: Date.now(), list: await classesApi.members(c.id) });
    const x = m.list.find((y) => y.id === id);
    if (x) extra = { load: (() => import("./TeacherBox.tsx").then((t) => t.TeacherBox)) as () => Promise<never>, props: { m: x } };
  } catch { /* the public sheet alone */ }
  openFriendSheet(id, extra);
}

/** An invite link /c/<code>: open the class if I am in it, else offer to join it. */
export async function joinClassFromInvite(code: string): Promise<void> {
  setTab("friends");
  if (classList.value === null) await loadClasses();
  const c = (classList.value || []).find((x) => x.code === code);
  if (c) void openClassBoard(c);
  else openJoinClass(code);
}
