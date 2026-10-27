// A learner's name in Turkish: capitals, Turkish endings that fit the name (Mehrad'ın, Şirazlı) and a rough Latin spelling of a
// Persian name. Pure.
import { stripT } from "../../../lib/turkish.ts";
import { ALL_V, H2, H4 } from "../../../lib/morphology.ts";

/** Upper-cases the first letter the Turkish way. */
export const cap = (v: string): string => (v ? v.charAt(0).toLocaleUpperCase("tr") + v.slice(1) : v);

export const hasFa = (s: unknown): boolean => /[؀-ۿ]/.test((s as string) || "");

/**
 * A Turkish ending on a name or city, in vowel harmony with it: nameSuffix("Mehrad", "ın") is Mehrad'ın. `bare` leaves out the apostrophe
 * (Şirazlı); "ki" at the end (daki) stays as it is. A name with no Latin letters gets the ending as it was written.
 */
export function nameSuffix(name: string, suf: string | undefined, bare?: boolean): string {
  if (!suf) return name;
  const low = name.toLocaleLowerCase("tr"), latin = /[a-zçğıöşü]/.test(low);
  if (!latin) return name + (bare ? "" : "'") + suf;
  const inv = suf.length > 2 && /ki$/.test(suf) ? "ki" : "", sf = inv ? suf.slice(0, -2) : suf;
  const endsV = ALL_V.includes(low[low.length - 1]);
  let body = sf;
  if (!endsV && /^[nys]/.test(body) && ALL_V.includes(body[1] || "")) body = body.slice(1);
  if (endsV && /^[ıiuüae]/.test(body) && sf === body) body = (body[0] === "ı" || body[0] === "i" || body[0] === "u" || body[0] === "ü" ? "n" : "y") + body;
  const h2 = H2(low), h4 = H4(low);
  let out = "";
  for (const ch of body) out += "ae".includes(ch) ? h2 : "ıiuü".includes(ch) ? h4 : ch;
  if (/^d/.test(out) && "fsthşçkp".includes(low[low.length - 1])) out = "t" + out.slice(1);
  return name + (bare ? "" : "'") + out + inv;
}

const FA_LETTER: Record<string, string> = { "ا": "a", "آ": "a", "ب": "b", "پ": "p", "ت": "t", "ط": "t", "ث": "s", "س": "s", "ص": "s", "ج": "c", "چ": "ç", "ح": "h", "خ": "h", "ه": "h", "د": "d", "ذ": "z", "ز": "z", "ض": "z", "ظ": "z", "ر": "r", "ژ": "j", "ش": "ş", "ع": "", "ء": "", "غ": "g", "گ": "g", "ف": "f", "ق": "k", "ک": "k", "ك": "k", "ل": "l", "م": "m", "ن": "n", "و": "v", "ی": "i", "ي": "i", "ئ": "i" };

/** A rough Latin spelling of a Persian name, letter by letter (the offline fallback of the AI's suggestions). */
export function translitOffline(fa: string): string {
  const t = [...String(fa || "").trim()];
  let o = "";
  t.forEach((ch, i) => {
    if (ch === "ه" && i === t.length - 1 && i > 0) { o += "e"; return; }
    if (/[ً-ٟ‌‍]/.test(ch)) return;
    o += FA_LETTER[ch] !== undefined ? FA_LETTER[ch] : (/[A-Za-z0-9 \-']/.test(ch) ? ch : "");
  });
  return cap(o.replace(/\s+/g, " ").trim());
}

/** A name or city reduced to lower-case ASCII letters (and Persian letters), to compare spellings. */
export const placeKey = (x: unknown): string => stripT(String(x || "").trim().toLocaleLowerCase("tr")).replace(/[^a-z؀-ۿ]/g, "");
