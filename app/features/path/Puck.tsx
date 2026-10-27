// An isometric puck: a ground shadow, an extruded wall, a top face (a circle seen at 30 degrees is an ellipse of ratio .577, drawn here
// as 42x24), a groove on the top face that fills as the skill is learned, and the icon lying on the top face (the isometric matrix
// .866 .5 -.866 .5). Colours come from CSS variables set per state (.pt-n.sk.done and so on); the gradients are shared and live in
// `ensureDefs()`.
import { Icon } from "../../ui/Icon.tsx";

/** The inside of an icon's `<svg>`. */
export const skInner = (svg: string | undefined): string => String(svg || "").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

/** The gradients every puck refers to, once, in the document. */
export function ensureDefs(): void {
  if (document.getElementById("sk-defs") || !document.body) return;
  document.body.insertAdjacentHTML("beforeend", '<svg id="sk-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="sk-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".55" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".06"/></linearGradient><linearGradient id="sk-wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></linearGradient></defs></svg>');
}

const WALL = "M8 40V51A42 33 0 0 0 92 51V40Z";

/** `inner` is an icon's svg content, `l` of `L` parts are done (the groove fills), `pulse` rings the current one. */
export function Puck({ inner, l, L, pulse }: { inner: string; l: number; L: number; pulse?: boolean }) {
  ensureDefs();
  const p = L ? Math.min(1, l / L) : 0;
  // the icon stays upright, barely squashed onto the top face, and raised on three layers so it reads as embossed
  const lay = (cls: string, y: number) => (
    <g transform={`translate(50 ${y}) scale(1.5 1.3)`}>
      <svg x="-12" y="-12" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"><g class={cls} dangerouslySetInnerHTML={{ __html: inner }} /></svg>
    </g>
  );
  return (
    <svg class="sk-puck" viewBox="0 0 100 94" aria-hidden="true">
      <ellipse class="sk-shadow" cx="50" cy="62" rx="43" ry="31" />
      {pulse ? <ellipse class="sk-pulse" cx="50" cy="51" rx="42" ry="33" /> : null}
      <path class="sk-wall" d={WALL} />
      <path d={WALL} fill="url(#sk-wall)" />
      <g class="sk-up">
        <ellipse class="sk-top" cx="50" cy="40" rx="42" ry="33" />
        <ellipse cx="50" cy="40" rx="42" ry="33" fill="url(#sk-sheen)" />
        <ellipse class="sk-groove" cx="50" cy="40" rx="37" ry="28" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        {p > 0 ? <path class="sk-fill" d="M50 12A37 28 0 1 1 50 68A37 28 0 1 1 50 12" pathLength="100" stroke-dasharray="100" stroke-dashoffset={100 * (1 - p)} fill="none" stroke-linecap="round" stroke-linejoin="round" /> : null}
        {lay("sk-ico-sh", 43.4)}{lay("sk-ico-mid", 41.9)}{lay("sk-ico", 40.2)}
      </g>
    </svg>
  );
}

/** The badge on a done (check) or skipped (double arrow) puck. */
export const Badge = ({ state }: { state: string }) =>
  state === "done" ? <span class="sk-badge" aria-hidden="true"><Icon name="check" class="bi" /></span>
    : state === "placed" ? <span class="sk-badge skip" aria-hidden="true"><Icon name="skip" class="bi" /></span> : null;
