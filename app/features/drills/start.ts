// Starting a drill session (the session kinds are the practice feature's).
import { startCustom } from "../practice/index.ts";
import { DT } from "./model/drills.ts";

/** A timed drill session: `k` is one drill type, "" the mixed mode. `again` starts the same drill once more. */
export function startDrillSession(mins: number, k: string, opt: { lab?: boolean; verbs?: boolean } = {}): void {
  const d = k ? DT.find((x) => x.k === k) : undefined;
  const base = opt.verbs ? "Verb gym" : "Suffix drill";
  const focus: Record<string, unknown> = { kind: "drill", dtype: k, title: base + (d ? ": " + d.label : ""), label: d ? d.label : base, lab: !!opt.lab, verbs: !!opt.verbs };
  focus.again = () => startDrillSession(mins, k, opt);
  startCustom(mins, focus);
}

/** "Drill this" on a lesson page: ten minutes of one drill type. */
export function startDrill(k: string): void {
  const d = DT.find((x) => x.k === k);
  startCustom(10, { kind: "drill", dtype: k || "", title: "Suffix drill" + (d ? ": " + d.label : ""), label: d ? d.label : "Suffix drill" });
}
