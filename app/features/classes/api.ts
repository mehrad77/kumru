// The client for the Classes routes (docs/SPECS_API.md section 7): the classes I teach and have joined, a class's weekly board, its
// members (what each shares with the owner), and the class switches. Nothing is cached here; state.ts holds the list.
import type { Class, ClassBoard, ClassMember, ClassShare, ClassStyle } from "../../../shared/api.ts";
import { weekKey } from "../../lib/progress.ts";
import { api } from "../../host/transport.ts";

export const classesApi = {
  list: (): Promise<Class[]> => api("GET", "/api/classes").then((r) => r.json.classes),
  create: (name: string, style: ClassStyle = {}): Promise<Class> => api("POST", "/api/classes", { ...style, name }).then((r) => r.json.class),
  join: (code: string, share: boolean): Promise<Class> => api("POST", "/api/classes/join", { code, share }).then((r) => r.json.class),
  leave: (id: string) => api("POST", `/api/classes/${id}/leave`),
  /** `share` (place, streak, hardest words) and/or `shareBook` (reader book progress). */
  setShare: (id: string, fields: ClassShare): Promise<Class> => api("PATCH", `/api/classes/${id}/me`, fields).then((r) => r.json.class),
  update: (id: string, fields: ClassStyle): Promise<Class> => api("PATCH", `/api/classes/${id}`, fields).then((r) => r.json.class),
  remove: (id: string) => api("DELETE", `/api/classes/${id}`),
  removeMember: (id: string, uid: string) => api("DELETE", `/api/classes/${id}/members/${uid}`),
  board: (id: string): Promise<ClassBoard> => api("GET", `/api/classes/${id}/board?week=${weekKey(Date.now())}`).then((r) => r.json as ClassBoard),
  members: (id: string): Promise<ClassMember[]> => api("GET", `/api/classes/${id}/members`).then((r) => r.json.members as ClassMember[]),
  link: (code: string): string => `${location.origin}/c/${code}`,
};

/** How a failed request reads to a learner. */
export const clErr = (e: unknown): string => (e as { message?: string } | null)?.message || "Something went wrong.";
