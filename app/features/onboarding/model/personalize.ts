// The learner plays Nima, the stories' newcomer: their text swaps that name for the learner's (keeping Turkish endings in harmony) and Tahran for their
// hometown, and the AI tutor is told who the learner is. Pure: the learner's name and hometown are passed in (../personalize.ts reads them).
import { hasFa, nameSuffix } from "./names.ts";
import type { ProfileItem } from "./profile.ts";

/** The hometown as the profile keeps it. */
export type HomeCity = ProfileItem | null;
/** The profile's answers, as far as the tutor's blurb needs them. */
export interface BlurbProfile {
  city?: { en?: string; tr?: string; raw?: string } | null; job?: { en?: string; raw?: string } | null; hobby?: { en?: string; raw?: string } | null;
  why?: { en?: string; raw?: string } | null; bio?: { en?: string } | null;
}

const FA_KEYS = new Set(["fa", "titleFa", "summaryFa", "bioFa", "roleFa"]), EN_KEYS = new Set(["en", "titleEn", "summary", "bio", "role", "focus"]);
const TAHRAN_RE = /Tahran(?:'([a-zçğıöşü]+)|(l[ıiuü][a-zçğıöşü]*))?(?![a-zçğıöşüA-ZÇĞİÖŞÜ])/g;

/** The learner's first name with a capital, or Nima (the stories' own name for the newcomer, sahne/packages/sahne-story STANDIN). */
export function firstName(nick: string, profileName: string): string {
  const n = (nick || profileName || "").trim().split(/\s+/)[0] || "";
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : "Nima";
}

/** The profile's hometown when it is not Tehran (the stories' default), else null. */
export const homeOf = (profile: { city?: HomeCity } | null | undefined): HomeCity => {
  const c = profile && profile.city;
  return c && c.tr && c.tr.toLocaleLowerCase("tr") !== "tahran" ? c : null;
};

/** A story text with Nima's name and Tahran swapped for the learner's. `k` is the key the text sits under (it says the language). */
export function personalizeText<T>(s: T, k: string | undefined, name: string, city: HomeCity): T {
  if (typeof s !== "string") return s;
  let t: string = s;
  if (name === "Nima" && !city) return s;
  if (name !== "Nima") {
    // a Latin name inside Persian text is isolated (FSI … PDI), so it keeps its own direction
    // no lookbehind: Safari before 16.4 cannot parse one, and a chunk that fails to parse leaves the Stories tab and this flow blank
    if (k && FA_KEYS.has(k)) { const fa = hasFa(name) ? name : "⁨" + name + "⁩"; t = t.replace(/(^|[^؀-ۿ‌])نیما(?![؀-ۿ])/g, (_m, pre) => pre + fa); }
    else if (k && EN_KEYS.has(k)) t = t.replace(/\bNima\b/g, name);
    else t = t.replace(/Nima(?:'([a-zçğıöşü]+))?(?![a-zçğıöşüA-ZÇĞİÖŞÜ])/g, (_m, suf) => nameSuffix(name, suf));
  }
  // the hometown can sit in any text, also inside English notes that quote Turkish or Persian examples
  if (!city) return t as T;
  const c = city;
  return t.replace(/\bTehran\b/g, c.en || c.tr).replace(/تهران(?=[؀-ۿ])/g, hasFa(c.fa) ? (c.fa as string) : (c.tr + "‌")).replace(/تهران/g, hasFa(c.fa) ? (c.fa as string) : c.tr)
    .replace(TAHRAN_RE, (_m, suf, li) => li ? nameSuffix(c.tr, li, true) : nameSuffix(c.tr, suf)) as T;
}

/** A whole story document (strings, arrays, objects) personalized; the keys `who`, `id` and `place` are left alone, and a glossary (`gl`) has its keys swapped too. */
export function personalizeAll(v: unknown, k: string | undefined, name: string, city: HomeCity): unknown {
  const text = (s: unknown, key: string) => personalizeText(s, key, name, city);
  if (Array.isArray(v)) return v.map((x) => personalizeAll(x, k, name, city));
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const key in v as Record<string, unknown>) {
      const val = (v as Record<string, unknown>)[key];
      if (k === "gl") {
        const nk = key.startsWith("nima") ? (text("Nima" + key.slice(4), "tr") as string).toLocaleLowerCase("tr")
          : key.startsWith("tahran") ? (text("Tahran" + key.slice(6), "tr") as string).toLocaleLowerCase("tr") : key;
        o[nk] = Array.isArray(val) ? [text(val[0], "fa"), text(val[1], "en")] : val;
      } else o[key] = personalizeAll(val, key, name, city);
    }
    return o;
  }
  return typeof v === "string" && k !== "who" && k !== "id" && k !== "place" ? text(v, k as string) : v;
}

/** What the AI tutor is told about the learner (the profile from onboarding; the old default when there is none). */
export function blurbOf(me: string, p: BlurbProfile | null | undefined): string {
  if (!p) return "The learner is " + me + ", a newcomer to Istanbul from Tehran.";
  const city = p.city && (p.city.en || p.city.tr || p.city.raw), job = p.job && (p.job.en || p.job.raw), hobby = p.hobby && (p.hobby.en || p.hobby.raw), why = p.why && (p.why.en || p.why.raw);
  return "The learner is " + me + ", a newcomer to Istanbul" + (city ? " from " + city : "") + (job ? "; " + job : "") + (hobby ? "; likes " + hobby : "") + (why ? "; is learning Turkish because " + why : "") + "." + (p.bio && p.bio.en ? " " + p.bio.en : "");
}
