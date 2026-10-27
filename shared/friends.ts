/* The public profile, follows, the weekly board and search (docs/SPECS_API.md section 6). */

export interface ProfilePut { doc: ProfileDoc; week: string }
export interface ProfilePutOk { doc: ProfileDoc; code: string; updated: number }
export interface Friends { week: string; me: ProfileDoc | null; following: string[]; followers: string[];
  board: string[]; profiles: Record<string, ProfileDoc>; names: Record<string, string> }
export interface Search { self: boolean; code: string | null; ids: string[];
  profiles: Record<string, ProfileDoc>; names: Record<string, string> }
export interface Names { names: Record<string, string> }
// Document shapes (docs/SPECS_SCHEMA.md §3)
export interface ProfileDoc { v: 1; nick: string; char: unknown | null; charPublic?: boolean; code: string; following: string[]; xp: number;
  xpWeek: Record<string, number>; streak: number; lastDay: string; pos: { lv: string; u: number } | null;
  unitsDone: { ref: string; at: number }[]; storiesDone: number;
  cheers: Record<string, { kind: "great" | "go"; at: number }>; updatedAt: number }
