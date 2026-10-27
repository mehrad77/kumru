// The `builder` lazy bundle (host.lib("builder"), app/host/lib.ts): Sahne's character builder with the kit and the `base` set
// family (the wall and floor behind the preview), about 230 KB gzip. Onboarding's avatar step mounts it; nothing else loads it.
// sahne/packages/sahne/DESIGN.md §10 is the builder; what a learner is offered is the kit's starter set with "More" on every field.
import { mountBuilder, normalize, type BuilderUI } from "sahne";
import { kit, starterOffer } from "sahne-kit";
import { loadSet, withSet } from "sahne-kit/set";
import { CHAR_MAX_BYTES } from "../../shared/char.ts";

export interface BuilderHost {
  doc: unknown;
  theme: "auto" | "light" | "dark";
  onChange(doc: unknown): void;
  /** Asked before Start over (and Cancel) throw work away. */
  confirm(action: "cancel" | "reset"): Promise<boolean>;
}

/** Mount the builder into `host` for a learner. */
export async function mount(host: HTMLElement, o: BuilderHost): Promise<BuilderUI> {
  const base = await loadSet(["base"]).catch(() => null);
  return mountBuilder(host, {
    kit: base ? withSet(kit, base) : kit,
    doc: o.doc ?? undefined,
    mode: "learner",
    offer: starterOffer,
    more: true,
    lang: "en",
    theme: o.theme,
    backdrop: base ? "wall" : "sky",
    onChange: (d) => o.onChange(d),
    confirm: (action) => o.confirm(action),
  });
}

/** The learner's document as it may be stored (untrusted: no cast parts, palette colours, at most 2 KB), or null. */
export const storable = (char: unknown): unknown => normalize(char, kit, { trusted: false, maxBytes: CHAR_MAX_BYTES });
