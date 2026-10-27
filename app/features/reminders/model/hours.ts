// The hours a reminder can be set to, and the default.

export const DEFAULT_HOUR = 20;

/** "07:00" for 7. */
export const hourLabel = (h: number | string): string => String(h).padStart(2, "0") + ":00";

export const HOURS: readonly number[] = Array.from({ length: 24 }, (_, h) => h);
