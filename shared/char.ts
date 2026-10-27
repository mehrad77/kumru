// The learner's character as Kumru stores it (`progress.char`, the Friends profile's `char`):
// what kind of document a value is, whether it is small enough to store and send to friends, and
// whether the Worker accepts it (`charProblem`). Pure, no DOM: the page and the Worker share it.
//
// Two shapes exist. The legacy `char` is up to eight small integers that indexed the old part tables;
// it is still accepted (old documents keep saving) and drawn as the silhouette. Sahne's avatar document
// (sahne/packages/sahne/DESIGN.md §5.2) replaces it in M8: `{v: 1, kit, body, ...}`, at most 2 KB. The rules
// below agree with sahne's `isLegacyChar` and `isAvatarDoc` (app/lib/char.test.ts checks that) without
// importing the engine, so the page can sort documents before the engine is loaded.
import { CAST_PARTS } from "./cast-parts.gen.ts";

/** The slots of the legacy `char`, in the order the old builder shows them. */
export const LEGACY_SLOTS = ["skin", "hair", "hairC", "beard", "top", "wear", "acc", "shirt"] as const;
export type LegacySlot = (typeof LEGACY_SLOTS)[number];
export type LegacyChar = Partial<Record<LegacySlot, number>>;

/** The most bytes of JSON a `char` may take (sahne's AVATAR_MAX_BYTES). */
export const CHAR_MAX_BYTES = 2048;

/**
 * `none`: no character yet (null, undefined, `{}`). `legacy`: the old eight-index shape.
 * `avatar`: a Sahne avatar document (shape only; the engine's `normalize` checks the contents).
 * `bad`: anything else, drawn as if there were none.
 */
export type CharKind = "none" | "legacy" | "avatar" | "bad";

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const SLOTS: ReadonlySet<string> = new Set(LEGACY_SLOTS);

export function charKind(c: unknown): CharKind {
  if (c === null || c === undefined) return "none";
  if (!isObj(c)) return "bad";
  const keys = Object.keys(c);
  if (!keys.length) return "none";
  if (Object.hasOwn(c, "v")) {
    return c.v === 1 && typeof c.kit === "string" && c.kit.length <= 40 && isObj(c.body) ? "avatar" : "bad";
  }
  return keys.every((k) => SLOTS.has(k) && Number.isInteger(c[k])) ? "legacy" : "bad";
}

export const isLegacyChar = (c: unknown): c is LegacyChar => charKind(c) === "legacy";

/** The legacy char with only its known slots, each a whole number from 0 (a negative or missing slot is 0). */
export function legacyChar(c: unknown): Required<LegacyChar> {
  const src = isObj(c) ? c : {};
  const out = {} as Required<LegacyChar>;
  for (const k of LEGACY_SLOTS) {
    const v = src[k];
    out[k] = typeof v === "number" && Number.isInteger(v) && v > 0 ? v : 0;
  }
  return out;
}

/** UTF-8 bytes of the value as JSON (what a save sends); Infinity when it cannot be serialised. */
export function charBytes(c: unknown): number {
  try {
    const s = JSON.stringify(c ?? null);
    return new TextEncoder().encode(s).length;
  } catch {
    return Infinity;
  }
}

/** Whether `c` may be stored as `char`: no character, a legacy one, or an avatar document within the size limit. */
export const charStorable = (c: unknown, max = CHAR_MAX_BYTES): boolean =>
  charKind(c) !== "bad" && charBytes(c) <= Math.min(max, CHAR_MAX_BYTES);

/** The avatar fields only a trusted author's document may carry (the cast's own parts, motion and voice). */
const AUTHOR_ONLY = ["custom", "motion", "voice"] as const;
const CAST: ReadonlySet<string> = new Set(CAST_PARTS);

/** Every string anywhere inside a value: the part ids of an avatar document are among them. */
function strings(x: unknown, out: string[] = []): string[] {
  if (typeof x === "string") out.push(x);
  else if (Array.isArray(x)) for (const y of x) strings(y, out);
  else if (isObj(x)) for (const y of Object.values(x)) strings(y, out);
  return out;
}

/**
 * Why the Worker would refuse `c` as a learner's `char`, or null when it is acceptable
 * (docs/SPECS_SCHEMA.md §3.1): no character, the legacy shape, or a `v: 1` sahne-kit avatar
 * document of at most 2 KB that wears no part reserved for the cast and has no author-only field.
 * Unknown part ids pass: the kit may have grown, and `normalize` drops what it does not know.
 */
export function charProblem(c: unknown): string | null {
  const kind = charKind(c);
  if (kind === "bad") return "char is not a character document.";
  if (charBytes(c) > CHAR_MAX_BYTES) return `char is more than ${CHAR_MAX_BYTES} bytes.`;
  if (kind !== "avatar") return null;
  const d = c as Record<string, unknown>;
  if (!String(d.kit).startsWith("sahne-kit")) return "char is from another kit.";
  for (const k of AUTHOR_ONLY) if (Object.hasOwn(d, k)) return `char.${k} is for the cast only.`;
  const cast = strings(d).find((s) => CAST.has(s));
  return cast ? `char wears ${cast}, a part for the cast only.` : null;
}
