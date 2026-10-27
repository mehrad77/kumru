// When a story is out (docs/stories/STORIES_SCHEMA.md §3, ROADMAP.md M8 and M9): every learner gets the same story on the same
// Istanbul day, and a season opens on its launch day. Pure; the page passes the time (the server's clock when it has one).
//
// A story is visible when it is not a draft (production builds leave drafts out anyway), its releaseDate is on or before today in
// Istanbul, and today is on or after its season's launch. Season 1 (A1) launches as one archive: every A1 date up to s1e45 is on or before the launch,
// so 45 open together on the launch day and s1e46–s1e48 follow one a day.
//
// Out is not open: a learner reads the stories in order, so a story opens once every story before it is finished (`isReadable`).

/** Turkey keeps UTC+3 all year (no daylight saving since 2016). */
const ISTANBUL_OFFSET_MS = 3 * 3600_000;

/** The launch day of each season, an Istanbul date. A season missing here is not launched. */
export const SEASON_LAUNCH: Readonly<Record<number, string>> = { 1: "2026-10-28" };

/** The Istanbul calendar date (YYYY-MM-DD) at `ms`. */
export const istanbulDay = (ms: number): string => new Date(ms + ISTANBUL_OFFSET_MS).toISOString().slice(0, 10);

export interface StoryDates { id: string; season: number; releaseDate: string; draft?: boolean }

/** Whether a story is out on `today` (an Istanbul date). */
export function isReleased(s: StoryDates, today: string, launch: Readonly<Record<number, string>> = SEASON_LAUNCH): boolean {
  const opens = launch[s.season];
  return !s.draft && !!opens && today >= opens && s.releaseDate <= today;
}

/** The stories out on `today`, in release order. */
export function visibleStories<T extends StoryDates>(stories: readonly T[], today: string, launch: Readonly<Record<number, string>> = SEASON_LAUNCH): T[] {
  return stories.filter((s) => isReleased(s, today, launch)).sort((a, b) => (a.releaseDate < b.releaseDate ? -1 : a.releaseDate > b.releaseDate ? 1 : a.id < b.id ? -1 : 1));
}

/** The first story the learner has not finished, in release order: the archive's "Next for you" (null when all are done). */
export function nextForYou<T extends StoryDates>(visible: readonly T[], done: (id: string) => boolean): T | null {
  return visible.find((s) => !done(s.id)) ?? null;
}

/** Whether the learner may open `id`: it is out, and every story before it is finished (the first unfinished one is open). */
export function isReadable<T extends StoryDates>(visible: readonly T[], id: string, done: (id: string) => boolean): boolean {
  for (const s of visible) {
    if (s.id === id) return true;
    if (!done(s.id)) return false;
  }
  return false;
}
