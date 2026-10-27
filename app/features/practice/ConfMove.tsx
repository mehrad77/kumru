// "The word's confidence after this answer": five dots, the ones just won or lost tinted, and the change.
import { bidiTxt } from "../../core/i18n.ts";
import type { Move } from "./move.ts";

export function ConfMove({ mv }: { mv: Move }) {
  const b = Math.ceil(mv.from / 3), up = mv.to > mv.from, d = mv.to - mv.from, a = mv.dots;
  return (
    <span class={"ans-conf " + (up ? "up" : "dn")} title={"Confidence " + mv.to + " of 15"} aria-label={"Confidence " + (up ? "up " : "down ") + Math.abs(d) + ", now " + mv.band}>
      <span class="dots" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => <span class={i < Math.min(a, b) ? "on" : i < Math.max(a, b) ? (up ? "up" : "dn") : ""} />)}
      </span>
      <b>{(up ? "+" : "−") + Math.abs(d)}</b>
      <span>{bidiTxt(mv.band)}</span>
    </span>
  );
}
