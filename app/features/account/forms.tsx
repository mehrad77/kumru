// The account sheets' form: labelled fields with hints and errors, a password Show/Hide toggle, a busy submit button and
// links under it. Errors show under the field the server names (`field`, which is the field's `k`), else under the fields.
import "./account.css";
import type { ComponentChildren } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { closeSheet } from "../../ui/sheet.ts";
import { BuiltNode } from "../../ui/island.tsx";
import { accErr, type FailureLike } from "./model/errors.ts";

export interface Field {
  /** The value's key, and the `field` a server error names. */
  k: string;
  label: string;
  type?: "text" | "password";
  auto?: string;
  name?: string;
  caps?: "off" | "characters";
  mode?: "text" | "numeric";
  hint?: string;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternMsg?: string;
  empty?: string;
  /** A username: a leading @ is dropped. */
  at?: boolean;
}

export interface FormOptions {
  /** Shown between the fields and the error line (a DOM node, or Preact children). */
  extra?: ComponentChildren | Node | null;
  /** [text, action] pairs under the button. */
  links?: [string, () => void][];
  /** The button's label while the action runs. */
  busy?: string;
  /** A label while the button must wait ("" when it may go): the human check. */
  gate?: string;
  /** After any failure (the human check is spent). */
  onFail?: (e: unknown) => void;
  /** Start values, by key. */
  values?: Record<string, string>;
}

export interface FormProps extends FormOptions {
  fields: Field[];
  submit: string;
  action: (values: Record<string, string>) => Promise<unknown>;
}

let formN = 0;

export function AccForm({ fields, submit, action, extra, links, busy: busyLabel, gate = "", onFail, values }: FormProps) {
  const n = useMemo(() => ++formN, []);
  const form = useRef<HTMLFormElement>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const focusNext = useRef<string | null>(null);
  const working = useRef(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const t = setTimeout(() => { const i = form.current?.querySelector("input"); if (i && !form.current!.contains(document.activeElement)) i.focus(); }, 50);
    return () => clearTimeout(t);
  }, []);
  // a field error moves the focus to its field once the error and aria-describedby are drawn
  useEffect(() => { const k = focusNext.current; if (k) { focusNext.current = null; inputs.current[k]?.focus(); } });

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    if (working.current || gate) return;
    setErr("");
    const v: Record<string, string> = {}, bad: Record<string, string> = {};
    let first: string | null = null;
    for (const f of fields) {
      const x = (inputs.current[f.k]?.value || "").trim().replace(f.at ? /^@+/ : /$^/, "");
      v[f.k] = x;
      const m = !x ? f.empty || "Fill this in." : f.min && x.length < f.min ? "Use at least " + f.min + " characters." : f.pattern && !f.pattern.test(x) ? f.patternMsg || "That doesn't look right." : "";
      if (m) { bad[f.k] = m; first = first || f.k; }
    }
    setErrs(bad);
    if (first) { focusNext.current = first; return; }
    working.current = true;
    setBusy(true);
    try { await action(v); }
    catch (x) {
      const m = accErr(x), k = (x as FailureLike | null)?.field;
      if (k && fields.some((f) => f.k === k)) { setErrs({ [k]: m }); focusNext.current = k; }
      else setErr(m);
      onFail?.(x);
    } finally { working.current = false; setBusy(false); }
  };

  const field = (f: Field, idx: number) => {
    const id = "af" + n + "-" + idx, last = idx === fields.length - 1, fe = errs[f.k] || "";
    const hintId = f.hint ? id + "-h" : null;
    const described = fe ? [id + "-e", hintId].filter(Boolean).join(" ") : hintId || undefined;
    const pw = f.type === "password", show = !!shown[f.k];
    // the attributes as one object: Preact's input typings tie `type` to the ARIA ones and reject a type picked at run time
    const attrs: Record<string, unknown> = {
      id, type: pw && show ? "text" : f.type || "text", name: f.name || f.k, autocomplete: f.auto || "off", autocapitalize: f.caps || "off", autocorrect: "off",
      spellcheck: false, dir: "ltr", maxLength: f.max, inputMode: f.mode, enterKeyHint: last ? "go" : "next", "aria-required": "true",
      "aria-invalid": fe ? "true" : "false", "aria-describedby": described, defaultValue: values?.[f.k],
      onInput: f.at ? (e: Event) => { const i = e.currentTarget as HTMLInputElement; if (/^@/.test(i.value)) i.value = i.value.replace(/^@+/, ""); } : undefined,
    };
    const input = <input ref={(i) => { inputs.current[f.k] = i; }} {...attrs} />;
    const toggle = () => { setShown({ ...shown, [f.k]: !show }); inputs.current[f.k]?.focus(); };
    return (
      <div class="acc-field">
        <label for={id}>{f.label}</label>
        {pw ? (
          <div class="pw-wrap">
            {input}
            <button class="pw-toggle" type="button" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show ? "true" : "false"} onClick={toggle}>{show ? "Hide" : "Show"}</button>
          </div>
        ) : input}
        {f.hint ? <p class="hint acc-fhint" id={hintId!}>{f.hint}</p> : null}
        <p class="acc-ferr" id={id + "-e"}>{fe}</p>
      </div>
    );
  };

  return (
    <form ref={form} class="acc-form" noValidate onSubmit={onSubmit}>
      {fields.map(field)}
      {extra instanceof Node ? <NodeHost node={extra} /> : extra ?? null}
      <p class="acc-err" role="alert" id={"ae" + n}>{err}</p>
      <button class={"btn primary block" + (busy ? " busy" : "")} type="submit" aria-busy={busy ? "true" : undefined} disabled={!busy && !!gate}>
        {busy ? busyLabel || "Working…" : gate || submit}
      </button>
      {links && links.length ? <div class="acc-links">{links.map(([text, fn]) => <button class="btn sm ghost" type="button" onClick={fn}>{text}</button>)}</div> : null}
    </form>
  );
}

/** A DOM-built node, laid out as if it were a child here. */
export function NodeHost({ node }: { node: Node }) {
  const render = useMemo(() => () => node, [node]);
  return <BuiltNode render={render} contents />;
}

/** A loading row: a spinner and what is loading. */
export const Loading = ({ text }: { text: string }) => (
  <div class="acc-loading" role="status"><span class="spin" aria-hidden="true" /><span>{text}</span></div>
);

/** A sheet whose data did not load: the reason and a way to try again, inside the sheet. */
export const SheetError = ({ error, retry }: { error: unknown; retry: () => void }) => (
  <>
    <p class="acc-err" role="alert">{accErr(error)}</p>
    <button class="btn primary block" type="button" onClick={retry}>Try again</button>
    <button class="btn block" type="button" onClick={closeSheet}>Close</button>
  </>
);

/** A button that is working: its label changes, a spinner shows and a second tap does nothing until it is done. */
export function BusyButton({ class: cls, label, busyLabel, run }: { class: string; label: string; busyLabel: string; run: () => Promise<unknown> }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (busy) return;
    setBusy(true);
    try { await run(); } finally { setBusy(false); }
  };
  return <button class={cls + (busy ? " busy" : "")} type="button" aria-busy={busy ? "true" : undefined} onClick={go}>{busy ? busyLabel : label}</button>;
}
