// The client for the Friends routes (docs/SPECS_API.md section 6): the payload (my profile, who I follow, the profiles I may see,
// their names), saving my public profile, name lookup and search. State lives in state.ts; this file only asks.
import type { Friends, ProfileDoc, ProfilePutOk, Search } from "../../../shared/api.ts";
import { weekKey } from "../../lib/progress.ts";
import { api, getToken } from "../../host/transport.ts";

export const friendsApi = {
  /** The Friends payload, or null signed out. */
  load: async (): Promise<Friends | null> => (getToken() ? (await api("GET", `/api/friends?week=${weekKey(Date.now())}`)).json : null),
  /** `GET /api/users`: names for ids the payload did not name. */
  names: async (ids: string[]): Promise<Record<string, string>> =>
    (await api("GET", "/api/users?ids=" + ids.slice(0, 100).map(encodeURIComponent).join(","))).json.names,
  /** A friend code (6 characters), a username (@name) or part of a name. */
  search: async (q: string): Promise<Search> => (await api("GET", "/api/profiles/search?q=" + encodeURIComponent(q))).json,
  /** Save my public profile; the stored copy carries the permanent friend code. */
  save: async (doc: ProfileDoc): Promise<ProfilePutOk> => (await api("PUT", "/api/profile", { doc, week: weekKey(Date.now()) })).json,
  profileLink: (username: string): string => `${location.origin}/@${username}`,
};
