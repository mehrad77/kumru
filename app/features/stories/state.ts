// The stories as the page holds them: the `stories`, `characters` and `places` collections (static, hashed, precached; loaded the
// first time the Stories tab or a story link opens), which of them are out today, and the learner's record of each (`S.st`).
// Before Season 1's launch day (shared/stories.ts SEASON_LAUNCH) only editors and a remembered ?stories see them, so the
// owner can walk the reader on production; everyone else keeps the "coming" card. A story opens once every story before it is
// finished (`readable`).
import { signal } from "@preact/signals-core";
import { local } from "../../core/local.ts";
import { rerender } from "../../core/router.ts";
import { S } from "../../core/store.ts";
import { serverNow } from "../../host/transport.ts";
import { SEASON_LAUNCH, isReadable, istanbulDay, nextForYou, visibleStories } from "../../../shared/stories.ts";

/** The story document as the reader reads it (sahne/packages/sahne-story/src/types.ts StoryDoc, loosely). */
export interface Story {
  id: string; season: number; releaseDate: string; kind?: "episode" | "special"; level?: string; draft?: true;
  arc?: { id: string; tr: string; en?: string; fa?: string; mechanics: string[] };
  title: string; titleEn?: string; titleFa?: string; summary?: string; summaryFa?: string;
  place: string; cast: string[]; extras?: string[]; words?: string[]; lessons?: string[];
  gl?: Record<string, [string, string]>;
  steps: unknown[]; quiz?: QuizItem[]; followUp?: unknown[]; unlocks?: string[];
  [k: string]: unknown;
}
export interface QuizItem { q: string; en?: string; fa?: string; options: string[]; a: number; why?: string; kind?: "comp" | "word" }
/** What the learner's progress keeps per story (docs/SPECS_SCHEMA.md §3.1 `st`). */
export interface StRecord { done?: boolean; stars?: number; reads?: number; at?: number; picks?: number; ch?: Record<string, number | string>; fu?: boolean }

export const stories = signal<Story[]>([]);
export const characters = signal<Record<string, Record<string, unknown>>>({});
export const places = signal<Record<string, Record<string, unknown>>>({});
export const loaded = signal(false);
/** The base URL of the stories' thumbnails (the manifest's `thumbs`: /thumbs/<hash8>/), once the collections have loaded. */
export const thumbBase = signal("");
/** The story open in the reader (open.ts), for the address bar. */
export const storyId = signal<string | null>(null);

let loading: Promise<void> | null = null;
/** Load the three collections once (they are precached, so this works offline). */
export function loadStories(): Promise<void> {
  loading ??= (async () => {
    const db = S.db as { collection(n: string): { get(): Promise<{ docs: { id: string; data(): Record<string, unknown> }[] }> } } | null;
    if (!db) return;
    const all = async (name: string) => Object.fromEntries((await db.collection(name).get()).docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
    const man = fetch("/data/manifest.json").then((r) => r.json() as Promise<{ thumbs?: string }>).catch(() => ({} as { thumbs?: string }));
    const [st, ch, pl, m] = await Promise.all([all("stories"), all("characters"), all("places"), man]);
    thumbBase.value = m.thumbs ?? "";
    stories.value = (Object.values(st) as Story[]).sort((a, b) => (a.releaseDate < b.releaseDate ? -1 : a.releaseDate > b.releaseDate ? 1 : 0));
    characters.value = ch;
    places.value = pl;
    loaded.value = true;
    rerender();
  })().catch((e) => { loading = null; console.warn("stories:", e); });
  return loading;
}

// ---- who sees what ------------------------------------------------------------------------------------------------------

/** Remember ?stories (and ?stories=0) before the router opens a tab. */
export function applyStoriesSwitch(search: string = location.search): void {
  const q = new URLSearchParams(search).get("stories");
  if (q !== null) local.set("stories", q === "0" ? "0" : "1");
}
/** A preview of the stories before their launch: editors, or the remembered ?stories switch. */
export const preview = (): boolean => local.get("stories", "") === "1" || (S.canEdit && local.get("stories", "") !== "0");

/** Today in Istanbul, by the server's clock; `?today=YYYY-MM-DD` stands in for it in dev builds (smoke tests of the launch). */
export function today(): string {
  const q = new URLSearchParams(location.search).get("today");
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q) && (window as { __KUMRU_DEV__?: unknown }).__KUMRU_DEV__) return q;
  return istanbulDay(serverNow());
}

/** The stories this learner can open now, in release order: what is out today, or every story in a preview. */
export function openStories(): Story[] {
  const all = stories.value;
  return preview() ? all : visibleStories(all, today(), SEASON_LAUNCH);
}
/** Whether the archive has opened for everyone (Season 1's launch). */
export const launched = (): boolean => today() >= SEASON_LAUNCH[1];

export const record = (id: string): StRecord => ((S.st as Record<string, StRecord>)[id] ?? {});
export const isDone = (id: string): boolean => !!record(id).done;
export const nextStory = (): Story | null => nextForYou(openStories(), isDone);
/** Whether the learner may open `id` now: it is out and every story before it is finished. */
export const readable = (id: string): boolean => isReadable(openStories(), id, isDone);
/** The story released today (Istanbul), if one came out today. */
export const todays = (): Story | null => openStories().find((s) => s.releaseDate === today()) ?? null;
/** The next story to come out after today (not in a preview, where every story is already open). */
export function upcoming(): Story | null {
  if (preview()) return null;
  const t = today();
  return stories.value.find((s) => !s.draft && s.releaseDate > t && !!SEASON_LAUNCH[s.season]) ?? null;
}
/** Story `id`'s thumbnail URL ("" until the manifest is in, or when there is none). */
export const thumbUrl = (id: string): string => (thumbBase.value ? `${thumbBase.value}${id}.webp` : "");
