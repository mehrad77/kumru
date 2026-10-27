// An icon from the set in core/dom.ts, hidden from screen readers (the Preact twin of `svgEl`).
import { ICON, type IconName } from "../core/dom.ts";

export const Icon = ({ name, class: cls }: { name: IconName; class?: string }) => (
  <span class={cls} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICON[name] }} />
);
