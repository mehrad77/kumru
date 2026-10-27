import { SELF } from "cloudflare:test";

export const BASE = "https://turk.shab.boo";

export async function api(path: string, init: { method?: string; body?: unknown; token?: string; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = { ...(init.headers || {}) };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  const r = await SELF.fetch(BASE + path, { method: init.method || (init.body !== undefined ? "POST" : "GET"), headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body) });
  const text = await r.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: any = text ? JSON.parse(text) : null;
  return { status: r.status, json, headers: r.headers };
}

let n = 0;
export async function signup(username = `user${++n}`, password = "correct horse") {
  const r = await api("/api/signup", { body: { username, password, tz: "Europe/Istanbul", label: "test" } });
  if (r.status !== 201) throw new Error(`signup ${r.status} ${JSON.stringify(r.json)}`);
  return { token: r.json.token as string, user: r.json.user as { id: string; username: string }, recovery: r.json.recovery as string, password };
}
