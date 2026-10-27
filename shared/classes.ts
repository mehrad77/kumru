/* Classes (docs/SPECS_API.md section 7). */
import type { ProfileDoc } from "./friends.ts";
import type { WeakCard } from "./progress.ts";
import type { BookDoc } from "./yeni.ts";

/** The icons and colours a teacher can give a class (the page draws them from its own icon set and palette). */
export const CLASS_ICONS = ["book", "bulb", "chat", "flame", "spark", "target", "listen", "note", "flash", "drill"] as const;
export const CLASS_COLORS = ["sage", "sand", "sky", "rose", "plum", "sun"] as const;
export type ClassIcon = (typeof CLASS_ICONS)[number];
export type ClassColor = (typeof CLASS_COLORS)[number];
/** What a teacher can set on a class; every field is optional on update. */
export interface ClassStyle { name?: string; description?: string; schedule?: string; icon?: ClassIcon; color?: ClassColor }
export interface Class { id: string; name: string; code: string; owner: string; created: number;
  members: number; share: boolean; shareBook: boolean; joined: number; description: string; schedule: string; icon: ClassIcon; color: ClassColor }
export interface ClassJoin { code: string; share: boolean }
export interface ClassBoard { week: string; board: string[]; profiles: Record<string, ProfileDoc>; names: Record<string, string> }
export interface ClassMember { id: string; username: string; nick: string; joined: number; share: boolean; shareBook: boolean;
  pos?: { lv: string; u: number }; streak?: number; lastDay?: string; weak?: WeakCard[]; book?: BookDoc }
/** PATCH /api/classes/:id/me: either switch, or both. */
export interface ClassShare { share?: boolean; shareBook?: boolean }
