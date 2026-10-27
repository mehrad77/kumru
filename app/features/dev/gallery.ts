// The dev gallery of Kerim (/kerim, or #kerim): every mood perched and flying at three sizes, talk, every mood of the head, the cast
// avatar and the landing, for review screenshots. It draws over the page and closes back to the Path.
import "./gallery.css";
import { el } from "../../core/dom.ts";
import { chAvatar } from "../../ui/avatar/index.ts";
import { K_MOODS, PUP, pup, pupLine, rndOf, setMood } from "../../ui/kerim/kerim.ts";

export function kerimGallery(): void {
  document.querySelector(".kg")?.remove();
  const cell = (k: HTMLElement, lbl: string) => el("figure", {
    class: "kg-c", title: "Click to replay",
    onclick: () => {
      const p = k.querySelector<HTMLElement>(".kerim") || k;
      if (p.classList?.contains("kerim")) setMood(p, K_MOODS.find((m) => p.classList.contains(m) && lbl.startsWith(m)) || lbl.split(" ")[0]);
    },
  }, k, el("figcaption", { text: lbl }));
  const row = (t: string, ...c: HTMLElement[]) => el("section", null, el("h3", { text: t }), el("div", { class: "kg-r" }, ...c));
  const land = el("div", { class: "kg-r" });
  const replay = () => land.replaceChildren(cell(pup("greet", 130, { pose: "hero" }), "hero: lands, greets"), cell(pup("happy", 88), "88: lands"), cell(pup("idle", 52, { enter: true, talk: 2600 }), "companion: lands, talks"));
  const theme = (v: string) => () => { document.documentElement.dataset.theme = v; };
  replay();
  const kg = el("div", { class: "kg" },
    el("div", { class: "kg-h" }, el("h2", { text: "Kerim" }),
      el("button", { class: "btn sm", type: "button", text: "Light", onclick: theme("light") }),
      el("button", { class: "btn sm", type: "button", text: "Dark", onclick: theme("dark") }),
      el("button", { class: "btn sm", type: "button", text: "Replay landing", onclick: replay }),
      el("button", { class: "btn sm primary", type: "button", text: "Close", onclick: () => { kg.remove(); history.replaceState(null, "", "#path"); } })),
    el("section", null, el("h3", { text: "Landing" }), land),
    ...[44, 88, 130].map((z) => row(z + "px", ...K_MOODS.map((m) => cell(pup(m, z, { enter: false }), m)), cell(pup("idle", z, { enter: false, talk: 1e9 }), "talk"))),
    ...[44, 88, 130].map((z) => row(z + "px flying", ...K_MOODS.map((m) => cell(pup(m, z, { pose: "flying", enter: false }), m + " flying")))),
    row("Head 64 (the narrator window and appbar crop)", ...K_MOODS.map((m) => cell(pup(m, 64, { pose: "head" }), m)), cell(pup("idle", 64, { pose: "head", talk: 1e9 }), "talk")),
    row("Head and cast", cell(pup("idle", 30, { pose: "head" }), "head 30"), cell(pup("idle", 64, { pose: "head" }), "head 64"), cell(chAvatar("kerim", 64, ""), "cast 64"), cell(chAvatar("kerim", 64, "ring"), "cast ring"), cell(chAvatar("kerim", 64, "talk"), "cast talk")),
    row("Lines", pupLine("sad", ...rndOf(PUP.oops)), pupLine("cheer", ...rndOf(PUP.cheer))));
  document.body.append(kg);
}
