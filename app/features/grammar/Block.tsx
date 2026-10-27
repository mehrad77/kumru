// One block of a lesson (data/grammar/*.json `blocks`): a table, a chain of suffixes, a Turkish/Persian comparison, a row of slots,
// a tip or an interactive box (Widgets.tsx). Shared by the lesson page and the practice screens' reading steps.
import { useErrorBoundary } from "preact/hooks";
import type { ComponentChildren } from "preact";
import { bidiTxt } from "../../core/i18n.ts";
import { WIDGETS } from "./Widgets.tsx";
import { Fa, MEl } from "./Text.tsx";
import "./grammar.css";

export interface BlockData { t: string; [field: string]: any } // eslint-disable-line @typescript-eslint/no-explicit-any -- lesson JSON, checked by tools/grammar_lessons.py

function Safe({ children }: { children: ComponentChildren }) {
  const [err] = useErrorBoundary();
  return err ? <div class="hint">This exercise couldn't load.</div> : <>{children}</>;
}

export function Block({ b }: { b: BlockData }) {
  if (b.t === "table") {
    const fa = new Set<number>(b.fa || []);
    return (
      <div class="tbl-wrap">
        <table class="gt">
          {b.cap ? <caption>{bidiTxt(b.cap)}</caption> : null}
          <thead><tr>{b.head.map((h: string, i: number) => <th scope="col" lang={fa.has(i) ? "fa" : undefined}>{bidiTxt(h)}</th>)}</tr></thead>
          <tbody>{b.rows.map((r: string[]) => <tr>{r.map((c, i) => (fa.has(i) ? <Fa tag="td" t={c} /> : <MEl tag="td" s={c} />))}</tr>)}</tbody>
        </table>
      </div>
    );
  }
  if (b.t === "chain") {
    return (
      <figure class="chain">
        <div class="chain-row">
          {b.parts.map(([t, r, en, fa]: string[]) => (
            <div class={"mp" + (r === "stem" ? " stem" : " m-" + r) + (t.startsWith(" ") ? " gap" : "")}>
              <div class="mt">{t.trim()}</div><div class="me">{bidiTxt(en || "·")}</div><Fa t={fa || "·"} cls="mf" />
            </div>
          ))}
        </div>
        {b.cap ? <MEl tag="figcaption" s={b.cap} /> : null}
      </figure>
    );
  }
  if (b.t === "compare") {
    return (
      <div class="cmp">
        <div class="cmp-row">
          <div class="cmp-tr"><span class="lbl">Türkçe</span><MEl s={b.tr} cls="w-word" /></div>
          <div class="cmp-fa"><span class="lbl" lang="fa">فارسی</span><Fa t={b.fa} cls="w-fa" /></div>
        </div>
        <div class="w-en">{bidiTxt(b.en)}</div>
        {b.note ? <div class="hint">{bidiTxt(b.note)}</div> : null}
      </div>
    );
  }
  if (b.t === "slots") {
    return (
      <div class="slots" style={`grid-template-columns:auto repeat(${b.labels.length},minmax(0,1fr))`}>
        <div />{b.labels.map((l: string) => <div class="sl">{bidiTxt(l)}</div>)}
        <div class="sk">Türkçe</div>{b.tr.map((x: string) => <div class="sc">{bidiTxt(x)}</div>)}
        <div class="sk" lang="fa">فارسی</div>{b.fa.map((x: string) => <Fa t={x} cls="sc" />)}
      </div>
    );
  }
  if (b.t === "tip") return <div class="tip"><div>{bidiTxt(b.en)}</div>{b.fa ? <Fa t={b.fa} /> : null}</div>;
  if (b.t === "widget" && WIDGETS[b.w]) return <Safe>{WIDGETS[b.w](b.o || {})}</Safe>;
  return null;
}
