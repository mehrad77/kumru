// The `avatar` lazy bundle (host.lib("avatar"), app/host/lib.ts): Sahne's still portraits with the kit, about 140 KB gzip.
// The facade (ui/avatar/portrait.ts) loads it at idle after start-up, and on demand the first time it meets an avatar
// document; until then it draws the generated silhouette (ui/avatar/silhouette.gen.ts) and the learner's cached head.
// Learners' documents are never trusted: another learner's `char` can only use the palettes and the learner parts.
import { normalize, portrait as sahnePortrait } from "sahne";
import { kit } from "sahne-kit";
import { CHAR_MAX_BYTES } from "../../shared/char.ts";

/** Bumped when the bundle's surface changes, so the page can tell what it loaded. */
export const version = 2;
export const ready = true;
export const maxBytes = CHAR_MAX_BYTES;
export { kit };

let ids = 0;

/** A learner's head as an SVG string (the `.chr` span's contents): `framing` head unless a call needs more. */
export function portraitSvg(char: unknown, o: { size?: number; label?: string; framing?: "head" | "bust" | "full"; trusted?: boolean } = {}): string {
  return sahnePortrait(char, kit, { framing: o.framing ?? "head", detail: o.size ?? 96, trusted: o.trusted === true, idPrefix: "av" + (++ids).toString(36), label: o.label });
}

/** A learner's character as a `.chr` span, the cast avatar class, so .ring, .fr-av and friends keep their styles. */
export function portrait(char: unknown, o: { size: number; cls: string; label: string }): HTMLElement {
  const s = document.createElement("span");
  s.className = "chr sahne " + (o.cls || "");
  if (o.size) s.style.cssText = `width:${o.size}px;height:${o.size}px`;
  s.setAttribute("role", "img");
  s.setAttribute("aria-label", o.label || "A character");
  s.innerHTML = portraitSvg(char, { size: o.size });
  s.firstElementChild?.setAttribute("aria-hidden", "true");
  return s;
}

/**
 * The learner's document as it may be stored: normalized against the kit as an untrusted document (no cast parts,
 * palette colours only, trimmed to 2 KB); null when it is not an avatar document of this kit.
 */
export function storable(char: unknown): Record<string, unknown> | null {
  return normalize(char, kit, { trusted: false, maxBytes: CHAR_MAX_BYTES }) as unknown as Record<string, unknown> | null;
}
