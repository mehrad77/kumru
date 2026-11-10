// The `builder` lazy bundle (host.lib("builder"), app/host/lib.ts): Sahne's character builder with the kit and the `base` set
// family (the wall and floor behind the preview), about 230 KB gzip. Onboarding's character steps mount it; nothing else loads it.
// sahne/packages/sahne/DESIGN.md §10 is the builder; what a learner is offered is the kit's starter set with "More" on every field,
// adults only. The onboarding walks the sections as its own steps, so the builder has no tabs, and no emotion strip.
import { mountBuilder, normalize, type BuilderUI } from "sahne";
export type { BuilderUI };
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
    builds: ["adult"],
    tabs: false,
    moods: false,
    onChange: (d) => o.onChange(d),
    confirm: (action) => o.confirm(action),
  });
}

/** The learner's document as it may be stored (untrusted: no cast parts, palette colours, at most 2 KB, an adult), or null. */
export function storable(char: unknown): unknown {
  const d = normalize(char, kit, { trusted: false, maxBytes: CHAR_MAX_BYTES });
  return d && d.body.build !== "adult" ? normalize({ ...d, body: { ...d.body, build: "adult" } }, kit, { trusted: false, maxBytes: CHAR_MAX_BYTES }) : d;
}
