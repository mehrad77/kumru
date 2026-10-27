// Aids for a typing box: the row of Turkish letters, and the microphone (where the browser can listen).
import { useEffect, useRef } from "preact/hooks";
import { micBtn } from "./speech.ts";

type Box = HTMLInputElement | HTMLTextAreaElement;

/** Buttons that put ç ğ ı İ ö ş ü into `box` at the cursor. */
export function KbdRow({ box }: { box: { current: Box | null } }) {
  const put = (ch: string) => {
    const inp = box.current;
    if (!inp) return;
    const s = inp.selectionStart ?? inp.value.length, e = inp.selectionEnd ?? s;
    inp.value = inp.value.slice(0, s) + ch + inp.value.slice(e);
    inp.focus();
    inp.setSelectionRange(s + 1, s + 1);
    inp.dispatchEvent(new Event("input"));
  };
  return (
    <div class="kbd" aria-label="Turkish letters">
      {["ç", "ğ", "ı", "İ", "ö", "ş", "ü"].map((ch) => <button type="button" onClick={() => put(ch)}>{ch}</button>)}
    </div>
  );
}

/** The voice-input button for `box`; nothing in a browser without speech recognition. */
export function Mic({ box }: { box: { current: Box | null } }) {
  const host = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const b = box.current ? micBtn(box.current as HTMLInputElement) : null;
    host.current?.replaceChildren(...(b ? [b] : []));
  }, [box]);
  return <span ref={host} style="display:contents" />;
}
