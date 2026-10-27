// The footer of the session screen: a Check button, a hint line, the flashcard rating, or the result of an answer with Continue.
import { useEffect, useRef } from "preact/hooks";
import { Icon } from "../../ui/Icon.tsx";
import { Kid } from "./common.tsx";
import { foot, next } from "./engine.ts";

export function Foot() {
  const f = foot.value;
  const cont = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (f.t !== "fb") return;
    const t = setTimeout(() => cont.current?.focus({ preventScroll: true }), 30);
    return () => clearTimeout(t);
  }, [f]);
  return (
    <div class={"s-foot" + (f.t === "fb" ? (f.ok ? " ok" : " bad") : "")}>
      {f.t === "check" ? (
        <div class="foot-row"><button class="btn primary block" type="button" disabled={!f.ready || undefined} onClick={() => { if (f.ready) f.run(); }}>{f.label}</button></div>
      ) : f.t === "hint" ? (
        <div class="hint" style="text-align:center">{f.text}</div>
      ) : f.t === "rate" ? (
        <div class="foot-row rate">
          <button class="btn bad" type="button" onClick={() => f.rate("a", "wrong")}>Again<small>didn't know</small></button>
          <button class="btn primary" type="button" onClick={() => f.rate("g", "right")}>Good<small>knew it</small></button>
          <button class="btn good" type="button" onClick={() => f.rate("e", "easy")}>Easy<small>instantly</small></button>
        </div>
      ) : f.t === "fb" ? (
        <>
          <div class="fb-head">
            <Icon name={f.ok ? "check" : "x"} />{f.head}
            {f.praise ? <span class="fb-praise"><span lang="tr">{f.praise[0]}</span><span lang="fa">{f.praise[1]}</span></span> : null}
          </div>
          <div class="fb-body">{f.body.map((k) => <Kid k={k} />)}</div>
          <div class="foot-row"><button class="btn primary block" type="button" ref={cont} onClick={next}>Continue<Icon name="arrow" class="bi" /></button></div>
        </>
      ) : f.t === "buttons" ? (
        <div class="foot-row">{f.items.map((b) => <button class={"btn" + (b.primary ? " primary" : "")} type="button" onClick={b.run}>{b.label}</button>)}</div>
      ) : null}
    </div>
  );
}
