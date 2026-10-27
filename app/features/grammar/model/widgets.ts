// The logic of the interactive grammar boxes that is not drawing: what the vowel-harmony box shows for a word, the clock's
// Turkish and Persian sentences, the preposition picture's data. Pure.
import { H2, H4, HARD, endsV, lastV } from "../../../lib/morphology.ts";

export interface HarmonyRow { k: string; m: string }
export interface Harmony { vowel: string; cell: string; before: string; after: string; rows: HarmonyRow[] }

/** The cells of the harmony grid, keyed by their vowels. */
export const HARMONY_CELLS: [string, string, string][] = [["ai", "a · ı", "→ -lar, -da, -ı"], ["ou", "o · u", "→ -lar, -da, -u"], ["ei", "e · i", "→ -ler, -de, -i"], ["öü", "ö · ü", "→ -ler, -de, -ü"]];

/** What the box shows for a typed word (null: type a word with a vowel): its last vowel and four forms. */
export function harmony(input: string): Harmony | null {
  const w = input.trim().toLocaleLowerCase("tr").replace(/[^a-zçğıöşü]/g, "");
  if (!w || !/[aeıioöuü]/.test(w)) return null;
  const v = lastV(w);
  const A = H2(w), I = H4(w), hard = HARD.includes(w[w.length - 1]), vend = endsV(w);
  const softW = !vend && (w.match(/[aeıioöuü]/g) || []).length > 1 && "pçtk".includes(w[w.length - 1])
    ? w.slice(0, -1) + ({ p: "b", ç: "c", t: "d", k: w[w.length - 2] === "n" ? "g" : "ğ" } as Record<string, string>)[w[w.length - 1]]
    : w;
  const vi = w.lastIndexOf(v);
  return {
    vowel: v, cell: ({ a: "ai", ı: "ai", o: "ou", u: "ou", e: "ei", i: "ei", ö: "öü", ü: "öü" } as Record<string, string>)[v], before: w.slice(0, vi), after: w.slice(vi + 1),
    rows: [{ k: "Plural", m: w + "[l" + A + "r:pl]" }, { k: "In / at", m: w + "[" + (hard ? "t" : "d") + A + ":case]" }, { k: "Question", m: w + " [m" + I + ":q]" }, { k: "My …", m: vend ? w + "[m:poss]" : softW + "[" + I + "m:poss]" }],
  };
}

const HN = ["bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz", "on", "on bir", "on iki"];
const ACC = ["bir[i:case]", "iki[y:buf][i:case]", "üç[ü:case]", "dörd[ü:case]", "beş[i:case]", "altı[y:buf][ı:case]", "yedi[y:buf][i:case]", "sekiz[i:case]", "dokuz[u:case]", "on[u:case]", "on bir[i:case]", "on iki[y:buf][i:case]"];
const DAT = ["bir[e:case]", "iki[y:buf][e:case]", "üç[e:case]", "dörd[e:case]", "beş[e:case]", "altı[y:buf][a:case]", "yedi[y:buf][e:case]", "sekiz[e:case]", "dokuz[a:case]", "on[a:case]", "on bir[e:case]", "on iki[y:buf][e:case]"];
const LOC = ["bir[de:case]", "iki[de:case]", "üç[te:case]", "dört[te:case]", "beş[te:case]", "altı[da:case]", "yedi[de:case]", "sekiz[de:case]", "dokuz[da:case]", "on[da:case]", "on bir[de:case]", "on iki[de:case]"];
const FAH = ["یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه", "ده", "یازده", "دوازده"];
const MW: Record<number, string> = { 5: "beş", 10: "on", 15: "çeyrek", 20: "yirmi", 25: "yirmi beş" };
const MF: Record<number, string> = { 5: "پنج دقیقه", 10: "ده دقیقه", 15: "ربع", 20: "بیست دقیقه", 25: "بیست و پنج دقیقه" };

export interface ClockTime { clock: string; say: string; at: string; fa: string; hourAngle: number; minuteAngle: number }

/** The clock for slider position `t` (0..143, five-minute steps from 12:00): the time, how it is said, how it is said "at", Persian, and the hands. */
export function clockTime(t: number): ClockTime {
  const h = Math.floor(t / 12) % 12, m = (t % 12) * 5, H = h === 0 ? 12 : h, nx = (H % 12) + 1;
  let say: string, at: string, fa: string;
  if (m === 0) { say = "Saat " + HN[H - 1] + "."; at = "Saat " + LOC[H - 1]; fa = "ساعت " + FAH[H - 1] + " است."; }
  else if (m === 30) { say = "Saat " + HN[H - 1] + " buçuk."; at = "Saat " + HN[H - 1] + " buçuk[ta:case]"; fa = "ساعت " + FAH[H - 1] + " و نیم است."; }
  else if (m < 30) { say = "Saat " + ACC[H - 1] + " " + MW[m] + " geçiyor."; at = "Saat " + ACC[H - 1] + " " + MW[m] + " geçe"; fa = "ساعت " + FAH[H - 1] + " و " + MF[m] + " است."; }
  else { const k = 60 - m; say = "Saat " + DAT[nx - 1] + " " + MW[k] + " var."; at = "Saat " + DAT[nx - 1] + " " + MW[k] + " kala"; fa = MF[k] + " به " + FAH[nx - 1] + " است."; }
  return { clock: H + ":" + String(m).padStart(2, "0"), say, at, fa, hourAngle: ((H % 12) + m / 60) * 30, minuteAngle: m * 6 };
}

/** The preposition picture: word, English, the sentence, Persian, and where the cat sits ([x, y, scale]). */
export const PLACES: [string, string, string, string, [number, number, number]][] = [
  ["üst", "on", "Kedi masa[nın:case] üst[ü:poss][n:buf][de:case].", "گربه روی میز است.", [160, 90, 1]],
  ["alt", "under", "Kedi masa[nın:case] alt[ı:poss][n:buf][da:case].", "گربه زیر میز است.", [160, 168, .8]],
  ["yan", "next to", "Kedi masa[nın:case] yan[ı:poss][n:buf][da:case].", "گربه کنار میز است.", [272, 168, .9]],
  ["ön", "in front of", "Kedi masa[nın:case] ön[ü:poss][n:buf][de:case].", "گربه جلوی میز است.", [150, 196, 1.2]],
  ["arka", "behind", "Kedi masa[nın:case] arka[s:buf][ı:poss][n:buf][da:case].", "گربه پشت میز است.", [206, 146, .75]],
];
/** The button label of a place: "üstünde", "altında", "yanında", "önünde", "arkasında". */
export const placeLabel = (w: string): string => w + (w.endsWith("a") ? "sında" : w === "alt" || w === "yan" ? "ında" : "ünde");

export const CASE_KEYS = ["loc", "dat", "abl", "acc", "gen"] as const;
export const CASE_LABELS: Record<string, [string, string]> = { loc: ["in / at", "nerede?"], dat: ["to", "nereye?"], abl: ["from", "nereden?"], acc: ["the (object)", "neyi?"], gen: ["of", "kimin?"] };
export const CASE_ICONS: Record<string, string> = {
  loc: '<svg viewBox="0 0 40 28" aria-hidden="true"><rect x="10" y="6" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="14" r="4" fill="currentColor"/></svg>',
  dat: '<svg viewBox="0 0 40 28" aria-hidden="true"><rect x="20" y="6" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 14h18m-6-5 6 5-6 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  abl: '<svg viewBox="0 0 40 28" aria-hidden="true"><rect x="4" y="6" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 14h24m-6-5 6 5-6 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  acc: '<svg viewBox="0 0 40 28" aria-hidden="true"><circle cx="20" cy="14" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="14" r="4" fill="currentColor"/></svg>',
  gen: '<svg viewBox="0 0 40 28" aria-hidden="true"><circle cx="12" cy="14" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="28" cy="14" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M18 14h4" stroke="currentColor" stroke-width="2"/></svg>',
};
