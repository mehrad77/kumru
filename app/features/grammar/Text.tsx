// Small text pieces the grammar screens share: a string with suffix markup, a Persian line, a labelled control.
import type { ComponentChildren } from "preact";
import { bidiTxt, faTxt } from "../../core/i18n.ts";
import { ROLE_NAMES, splitMorph } from "./model/morph.ts";

/** "ev[ler:pl]": the suffixes coloured by role. */
export function Morph({ s }: { s: string }) {
  return <>{splitMorph(String(s ?? "")).map((p) => (p.role ? <span class={"m m-" + p.role} title={ROLE_NAMES[p.role] || p.role}>{p.text}</span> : bidiTxt(p.text)))}</>;
}

/** An element holding a string with suffix markup. */
export function MEl({ tag = "div", s, cls }: { tag?: string; s: string; cls?: string }) {
  const Tag = tag as "div";
  return <Tag class={cls}><Morph s={s} /></Tag>;
}

/** Persian text: right to left, its Latin runs isolated. */
export function Fa({ tag = "div", t, cls }: { tag?: string; t: string; cls?: string }) {
  const Tag = tag as "div";
  return <Tag class={cls} lang="fa" dir="rtl">{faTxt(t)}</Tag>;
}

/** A widget control with its caption (`<label class="wl">`). */
export const Lab = ({ t, children }: { t: string; children: ComponentChildren }) => <label class="wl"><span>{t}</span>{children}</label>;

/** A widget's result: the word with its coloured suffixes, then Persian and English. */
export const OutBlock = ({ word, fa, en }: { word: string; fa: string; en: string }) => (
  <div class="w-out"><MEl s={word} cls="w-word" /><Fa t={fa} cls="w-fa" /><div class="w-en">{bidiTxt(en)}</div></div>
);
