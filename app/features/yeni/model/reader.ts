// Links into Notebook (yeni.shab.boo). Pure.

export const READER = "https://yeni.shab.boo";

/** The reader's slug for a word (same rule as slugOf in apps/reader/src/lib/tr.ts). */
export function readerSlug(tr: unknown): string {
  return String(tr || "").toLocaleLowerCase("tr").replace(/\s+/g, " ").trim()
    .replace(/[âîû]/g, (c) => ({ â: "a", î: "i", û: "u" })[c as "â"] as string)
    .replace(/(?:\s*\.\.\.|[.!?])+$/, "").trim()
    .replace(/[^a-zçğıöşü0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export interface ReaderCard { id: string; kind?: string; level?: string; tr?: string }

/** The reader's word page for a card; only vocabulary words from the books have one (not the app's own yk- cards). */
export function readerUrl(c: ReaderCard | null | undefined): string | null {
  return c && c.kind === "word" && c.level && c.tr && !c.id.startsWith("yk-")
    ? READER + "/" + c.level.toLowerCase() + "/kelimeler/" + encodeURIComponent(readerSlug(c.tr)) + "/" : null;
}
