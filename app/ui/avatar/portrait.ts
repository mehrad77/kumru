// Portraits: the one place the page draws a character.
//
// A learner's `char` (their own S.char, a friend's profile, a class member, an owner row) is drawn only through
// avatarPortrait/myPortrait; Kerim through chAvatar. charKind (shared/char.ts) sorts a value into none | legacy | avatar | bad.
// An avatar document is drawn by the lazy `avatar` bundle (app/lib/avatar.ts: Sahne's still portraits with the kit), which
// loads at idle after start-up (avatarIdle) or the first time a portrait needs it. Until it is in, and for no character, a legacy
// one or a bad one, the generated silhouette shows (silhouette.gen.ts); the learner's own head is cached on the device
// (`kumru:portrait`), so the app bar shows it on first paint.
import { el } from "../../core/dom.ts";
import { rerender } from "../../core/router.ts";
import { S } from "../../core/store.ts";
import { loadLib } from "../../host/lib.ts";
import { charKind } from "../../lib/char.ts";
import { KERIM_CAST } from "sahne-kit/kerim/art";
import { SILHOUETTE_HEAD } from "./silhouette.gen.ts";

/** Who the learner plays in the stories; the onboarding feature registers its `studentName` at start-up. */
let learnerName: () => string = () => "";
export const setLearnerName = (fn: () => string): void => { learnerName = fn; };

export interface CastInfo { id: string; name: string; color: string; role?: string; roleFa?: string; isYou?: boolean; [k: string]: unknown }

/** A cast member's card (S.chars, filled by the stories), with the learner's name on the stand-in. */
export function chInfo(id?: string): CastInfo {
  id = id || "";
  const c: CastInfo = (S.chars && S.chars[id]) || { id, name: id ? id.charAt(0).toUpperCase() + id.slice(1) : "", color: "var(--accent)" };
  if (id !== "nima") return { ...c };
  const name = learnerName();
  return name ? { ...c, name, role: "You · " + (c.role || "the newcomer"), roleFa: "تو · " + (c.roleFa || ""), isYou: true } : { ...c };
}

function span(svg: string, size: number | null | undefined, cls: string | null | undefined, label: string, data: string): HTMLElement {
  const s = el("span", { class: "chr " + data + " " + (cls || ""), style: size ? `width:${size}px;height:${size}px` : null, role: "img", "aria-label": label });
  s.innerHTML = svg;
  s.firstElementChild?.setAttribute("aria-hidden", "true");
  return s;
}

/** Kerim (the mascot's cast art) or, for any other id, the silhouette, as a `.chr` span. */
export function chAvatar(id: string, size?: number | null, cls?: string | null, art?: string | null, label?: string | null): HTMLElement {
  if (id === "kerim" || art) return span(`<svg viewBox="0 0 100 100">${art || KERIM_CAST}</svg>`, size, cls, label || chInfo(id).name || id, "cast");
  return span(SILHOUETTE_HEAD, size, cls, label || chInfo(id).name || id, "sil");
}

interface AvatarImpl { portrait: (char: unknown, o: { size: number; cls: string; label: string }) => HTMLElement; portraitSvg: (char: unknown, o?: { size?: number }) => string }
const AVATAR: { impl: AvatarImpl | null; loading: Promise<AvatarImpl | null> | null } = { impl: null, loading: null };
const ready: (() => void)[] = [];

// ---- the learner's own head, cached on the device (docs/SPECS_SCHEMA.md §6) -------------------------------------------
const OWN_KEY = "kumru:portrait";
function ownCached(char: unknown): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(OWN_KEY) || "null") as { c?: string; svg?: string } | null;
    return v && v.svg && v.c === JSON.stringify(char) ? v.svg : null;
  } catch { return null; }
}
function ownStore(char: unknown, svg: string): void {
  try { localStorage.setItem(OWN_KEY, JSON.stringify({ c: JSON.stringify(char), svg })); } catch { /* full or blocked: drawn again next time */ }
}

/** A learner's character as a `.chr` span (the cast avatar class, so .ring, .fr-av and friends keep their styles). */
export function avatarPortrait(char: unknown, size: number, cls: string, label?: string): HTMLElement {
  const name = label || "A character";
  if (charKind(char) !== "avatar") return span(SILHOUETTE_HEAD, size, cls, name, "sil");
  if (AVATAR.impl) {
    const n = AVATAR.impl.portrait(char, { size, cls, label: name });
    if (char === S.char && !ownCached(char)) ownStore(char, n.innerHTML);
    return n;
  }
  void avatarUse();
  const own = char === S.char ? ownCached(char) : null;
  return span(own || SILHOUETTE_HEAD, size, cls, name, own ? "sahne" : "sil");
}

/** The signed-in learner's character, or the silhouette before they have made one. */
export const myPortrait = (size: number, cls: string): HTMLElement => avatarPortrait(S.char, size, cls, learnerName() || "Your character");

/** Call `fn` once the `avatar` bundle is in (the app bar redraws its chip). */
export const onAvatarReady = (fn: () => void): void => { if (AVATAR.impl) fn(); else ready.push(fn); };

/** Load the `avatar` bundle once and redraw what drew the silhouette in its place. */
export function avatarUse(): Promise<AvatarImpl | null> {
  if (!AVATAR.loading) {
    AVATAR.loading = loadLib("avatar").then((m: AvatarImpl) => {
      AVATAR.impl = m;
      for (const fn of ready.splice(0)) { try { fn(); } catch (e) { console.warn("avatar ready", e); } }
      rerender();
      return m;
    }, (e: unknown) => {
      AVATAR.loading = null;
      console.warn("avatar bundle:", (e as Error)?.message || e);
      return null;
    });
  }
  return AVATAR.loading;
}

/** Load the bundle when the page is idle (start-up calls this once the learner's progress is in). */
export function avatarIdle(): void {
  const go = () => void avatarUse();
  if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 1500);
}
