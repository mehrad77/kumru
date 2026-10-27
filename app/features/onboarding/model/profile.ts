// The "about you" answers (hometown, job, hobby, why Turkish) as the profile the stories use. The tutor (app/features/tutor/check.ts) asks the AI
// for clean forms and passes its reply to `normProfile`; without the AI, `profileFallback` keeps what the learner typed. Pure.
import { hasFa, placeKey } from "./names.ts";

/** One answer in the three languages: what was typed, and its Turkish, English and (hometown only) Persian forms. */
export interface ProfileItem { raw: string; tr: string; en: string; fa?: string }
export interface Profile {
  name: { tr: string; alt: string; en: string; fa: string; why?: string };
  city: ProfileItem | null; job: ProfileItem | null; hobby: ProfileItem | null; why: ProfileItem | null;
  bio: { en: string; tr: string };
  ai: boolean; at: number;
}
/** What the learner typed: the name and the four answers. */
export interface Answers { name: string; city: string; job: string; hobby: string; why: string }

/** Common home towns with their Turkish, English and Persian spellings: right even without the AI, and they win over the AI. */
export const CITIES: [string, string, string][] = [["Tahran", "Tehran", "تهران"], ["Şiraz", "Shiraz", "شیراز"], ["Tebriz", "Tabriz", "تبریز"], ["İsfahan", "Isfahan", "اصفهان"], ["Meşhed", "Mashhad", "مشهد"], ["Ahvaz", "Ahvaz", "اهواز"], ["Kum", "Qom", "قم"], ["Reşt", "Rasht", "رشت"], ["Yezd", "Yazd", "یزد"], ["Hemedan", "Hamadan", "همدان"], ["Erdebil", "Ardabil", "اردبیل"], ["Zencan", "Zanjan", "زنجان"], ["Kazvin", "Qazvin", "قزوین"], ["İstanbul", "Istanbul", "استانبول"], ["Ankara", "Ankara", "آنکارا"], ["İzmir", "Izmir", "ازمیر"]];

export function cityLookup(raw: unknown): (ProfileItem & { fa: string }) | null {
  const k = placeKey(raw);
  if (!k) return null;
  const c = CITIES.find(([t, e, f]) => placeKey(t) === k || placeKey(e) === k || f === String(raw).trim());
  return c ? { raw: String(raw).trim().slice(0, 40), tr: c[0], en: c[1], fa: c[2] } : null;
}

const TR_OK = /^[A-Za-zÇĞİÖŞÜçğıöşü' .,-]+$/;

/** The profile with the learner's words as they are. */
export function profileFallback(a: Answers): Profile {
  const f = (raw: unknown, n: number): ProfileItem | null => { const r = String(raw || "").trim().slice(0, n); return r ? { raw: r, tr: r, en: r, fa: r } : null; };
  return { name: { tr: a.name, alt: a.name, en: a.name, fa: "" }, city: cityLookup(a.city) || f(a.city, 40), job: f(a.job, 80), hobby: f(a.hobby, 80), why: f(a.why, 80), bio: { en: "", tr: "" }, ai: false, at: Date.now() };
}

/** The AI's reply made safe: trimmed, length-capped, Turkish forms only in Turkish letters, a known city overriding the AI's. Throws `{code: "invalid_json"}` for a reply that is no object. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normProfile(r: any, a: Answers): Profile {
  if (!r || typeof r !== "object") throw { code: "invalid_json" };
  const str = (v: unknown, n: number) => String(v || "").trim().slice(0, n);
  const trv = (v: unknown, raw: string, n: number) => { const s = str(v, n); return s && TR_OK.test(s) ? s : raw; };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = (o: any, raw0: unknown, n: number, fa?: boolean): ProfileItem | null => {
    const raw = String(raw0 || "").trim().slice(0, n);
    if (!raw) return null;
    o = o && typeof o === "object" ? o : {};
    const x: ProfileItem = { raw, tr: trv(o.tr, raw, n), en: str(o.en, n) || raw };
    if (fa) x.fa = hasFa(str(o.fa, n)) ? str(o.fa, n) : raw;
    return x;
  };
  const nm = r.name && typeof r.name === "object" ? r.name : {}, tr = trv(nm.tr, a.name, 40);
  return {
    name: { tr, alt: trv(nm.alt, tr, 40), en: str(nm.en, 40) || a.name, fa: hasFa(str(nm.fa, 40)) ? str(nm.fa, 40) : "", why: str(nm.why_alt, 120) },
    city: cityLookup(a.city) || item(r.city, a.city, 40, true), job: item(r.job, a.job, 80), hobby: item(r.hobby, a.hobby, 80), why: item(r.why, a.why, 80),
    bio: { en: str(r.bio && r.bio.en, 400), tr: str(r.bio && r.bio.tr, 200) }, ai: true, at: Date.now(),
  };
}

