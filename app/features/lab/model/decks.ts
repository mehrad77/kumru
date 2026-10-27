// What the Lab's sheets offer: the lengths, the smallest deck each question type can use, topics and counts.

export interface LabCard { id: string; kind: string; tr: string; fa?: string; en?: string; topic?: string; src?: string; accept?: unknown; gloss?: unknown; retired?: boolean }

/** 5, 10, 15 minutes or no limit (the report then comes when the learner closes). */
export const LAB_MINS: readonly number[] = [5, 10, 15, 0];
export const DEFAULT_MIN = 10;

/** How many cards a question type needs in a deck. */
export const LAB_MIN: Record<string, number> = { flash: 1, choice: 1, type: 1, listen: 1, match: 4 };

/** The stored length, or the default when it is not one of `LAB_MINS`. */
export const readLen = (raw: string | null | undefined): number => { const m = +(raw ?? ""); return LAB_MINS.includes(m) && raw != null && raw !== "" ? m : DEFAULT_MIN; };
export const lenLabel = (v: number): string => (v ? v + " min" : "No limit");

/** "3 words to fix", or null for an empty list. */
export const countText = (n: number, one: string, many: string): string | null => (n ? n + (n === 1 ? one : many) : null);

/** Words with a topic, grouped by topic, in the course's topic order (`rank`), then alphabetically. */
export function topicGroups<T extends { topic?: string }>(words: readonly T[], rank: (topic: string) => number): [string, T[]][] {
  const m = new Map<string, T[]>();
  for (const c of words) if (c.topic) m.set(c.topic, (m.get(c.topic) || []).concat(c));
  return [...m].sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]));
}
