// The grammar helpers as plain DOM, for the practice feature's lesson cards, which still build or show nodes: a string
// with suffix markup, a Persian line, the quiz sentence, and a lesson block. The lesson page itself uses the Preact twins in Text.tsx.
import { el } from "../../core/dom.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { mountInto } from "../../ui/open.ts";
import { ROLE_NAMES, quizParts, splitMorph } from "./model/morph.ts";
import type { BlockData } from "./Block.tsx";

/** A fragment: the string's text with its suffixes coloured by role. */
export function morph(str: string): DocumentFragment {
  const f = document.createDocumentFragment();
  for (const p of splitMorph(String(str ?? ""))) {
    if (p.role) f.append(el("span", { class: "m m-" + p.role, title: ROLE_NAMES[p.role] || p.role, text: p.text }));
    else f.append(bidiTxt(p.text));
  }
  return f;
}

export const mEl = (tag: string, str: string, cls?: string | null): HTMLElement => {
  const e = el(tag, cls ? { class: cls } : null);
  e.append(morph(str));
  return e;
};


/** A quiz item's sentence with its ___ gap, empty or filled with the answer. */
export function quizLine(it: { q: string }, fill: string | null): HTMLElement {
  const d = el("div", { class: "qz-q w-word", lang: "tr" });
  const parts = quizParts(it.q);
  parts.forEach((pt, j) => {
    if (pt) d.append(morph(pt));
    if (j < parts.length - 1) {
      const g = el("span", { class: "qz-gap" + (fill != null ? " filled" : "") });
      if (fill != null) g.append(morph(fill)); else g.textContent = "___";
      d.append(g);
    }
  });
  return d;
}

/** A lesson block as a node (Preact draws it as soon as it has loaded), or null for a block that draws nothing. */
export function renderBlock(b: BlockData): HTMLElement | null {
  if (!b || !["table", "chain", "compare", "slots", "tip", "widget"].includes(b.t)) return null;
  const host = el("div", { style: "display:contents" });
  void mountInto(host, () => import("./Block.tsx").then((m) => m.Block), { b });
  return host;
}
