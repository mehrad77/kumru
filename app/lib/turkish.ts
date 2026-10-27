// Turkish text as the app compares it: lower-cased the Turkish way with punctuation gone, and with the diacritics folded.

/** Lower case (Turkish i/ı), punctuation to spaces, one space between words. */
export const normT = (s: unknown): string => String(s || "").toLocaleLowerCase("tr").replace(/[.,!?;:"«»()¿¡…]/g, " ").replace(/\s+/g, " ").trim();

/** The letters without their diacritics (ç to c, ğ to g, ı to i, …). */
export const stripT = (s: string): string => s.replace(/[çğıöşüâîû]/g, (ch) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" } as Record<string, string>)[ch]);
