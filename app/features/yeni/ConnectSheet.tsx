// /connect/yeni: the consent sheet (docs/SPECS_API.md section 11a, docs/AUTH.md). The reader sends a signed-in learner here
// (the gate first when signed out; the gate keeps the URL, so signing in comes back). Allow asks the Worker for a one-time code
// bound to the reader's challenge and return URL, then goes back with #yk_code=<code>&state=<state>; Cancel, X, Escape and the
// backdrop go back with #yk_error=denied&state=<state>. The reader trades the code for its token itself; no token passes
// through this page. A link that fails parseConnect (api.ts) gets an error and no redirect.
import "./yeni.css";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { holdUrl, setTab, urlFor } from "../../core/router.ts";
import { signals } from "../../core/store.ts";
import type { SheetBack } from "../../ui/open.ts";
import { closeSheet, confirmSheet } from "../../ui/sheet.ts";
import { accErr, logout } from "../account/index.ts";
import { yeni } from "./api.ts";
import { bookLinked } from "./book.ts";
import { YiMark } from "./Mark.tsx";
import { Loading } from "./parts.tsx";
import { meReady } from "./state.ts";

export interface ConnectLink { ret: string; state: string; challenge: string }
type View = { k: "loading" } | { k: "fail"; e: unknown } | { k: "bad"; e: { code?: string; message?: string } | null } | { k: "ask"; p: ConnectLink };

/** Leave the consent flow for the app: the address bar goes back to the tab, so a reload never re-asks with a stale link. */
function leave(): void {
  closeSheet();
  holdUrl(false);
  try { history.replaceState(null, "", urlFor()); } catch { /* history is not available */ }
  setTab("path");
}

export function ConnectSheet({ back, link, reopen }: { back: SheetBack; link: ConnectLink | null; reopen: (p: ConnectLink) => void }) {
  const [view, setView] = useState<View>(link ? { k: "ask", p: link } : { k: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (view.k !== "loading") return;
    let live = true;
    (async () => {
      let origins: string[];
      try { origins = (await Promise.all([yeni.origins(), meReady]))[0]; }
      catch (e) { if (live) setView({ k: "fail", e }); return; }
      if (!live) return;
      try { setView({ k: "ask", p: yeni.parseConnect(location.search, origins) }); }
      catch (e) { setView({ k: "bad", e: e as { code?: string; message?: string } }); }
    })();
    return () => { live = false; };
  }, [attempt, view.k]);

  useEffect(() => { back._onDismiss = view.k === "loading" ? () => {} : view.k === "ask" ? back._onDismiss : leave; }, [view.k]);

  if (view.k === "ask") return <Ask p={view.p} back={back} reopen={reopen} />;
  if (view.k === "bad") return <Bad e={view.e} />;
  if (view.k === "fail") {
    return (
      <div class="acc-form yk-box">
        <p class="acc-err" role="alert">{accErr(view.e)}</p>
        <button class="btn primary block" type="button" onClick={() => { setView({ k: "loading" }); setAttempt(attempt + 1); }}>Try again</button>
        <button class="btn block" type="button" onClick={leave}>Tamam · OK</button>
      </div>
    );
  }
  return <div class="acc-form yk-box"><Loading text="Connecting Notebook…" /></div>;
}

/** A link that doesn't come from the reader (or is out of date): why, in both languages, and an OK that goes to the Path. */
function Bad({ e }: { e: { code?: string; message?: string } | null }) {
  const ok = useRef<HTMLButtonElement>(null);
  useEffect(() => { const t = setTimeout(() => ok.current?.focus(), 50); return () => clearTimeout(t); }, []);
  const tr = e && e.code === "bad_link" ? "Bu bağlantı eksik ya da eskimiş. Okuyucuya dönüp Bağlan düğmesine yeniden bas." : "Bu bağlantı Defter'den gelmiyor, bu yüzden hiçbir şey bağlanmadı.";
  return (
    <div class="acc-form yk-box">
      <p class="acc-err" role="alert" lang="en">{(e && e.message) || "This link doesn't come from Notebook, so nothing was connected."}</p>
      <p class="hint" lang="tr">{tr}</p>
      <button ref={ok} class="btn primary block" type="button" onClick={leave}>Tamam · OK</button>
    </div>
  );
}

function Ask({ p, back, reopen }: { p: ConnectLink; back: SheetBack; reopen: (p: ConnectLink) => void }) {
  const { ret, state, challenge } = p;
  const host = new URL(ret).host, me = signals.profileName.value || "you";
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const working = useRef(false);
  const allowBtn = useRef<HTMLButtonElement>(null);
  const deny = () => location.replace(ret + "#yk_error=denied&state=" + encodeURIComponent(state));
  // set at commit, not after paint: the X and Escape deny from the moment the sheet shows
  useLayoutEffect(() => { back._onDismiss = deny; }, []);
  useEffect(() => {
    const t = setTimeout(() => allowBtn.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const allow = async () => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setErr("");
    back._onDismiss = () => {};
    try {
      const code = await yeni.code(ret, challenge);
      bookLinked(true);
      location.replace(ret + "#yk_code=" + encodeURIComponent(code) + "&state=" + encodeURIComponent(state));
    } catch (e) {
      working.current = false;
      setBusy(false);
      setErr(accErr(e));
      back._onDismiss = deny;
      setTimeout(() => allowBtn.current?.focus(), 0);
    }
  };
  const other = () => confirmSheet({
    title: "Use another account?",
    body: "This signs @" + me + " out of Kumru on this phone. You'll sign in again and come back to this connection.",
    label: "Sign out and switch",
    action: async () => { await logout(); location.reload(); },
    cancel: () => reopen(p),
  });

  return (
    <div class="acc-form yk-box">
      <div class="yk-who"><YiMark /><div><b>Notebook</b><div class="hint">{host}</div></div></div>
      <p class="yk-me">Signed in as <b>@{me}</b>. <button class="yk-link" type="button" onClick={other}>Not you? Use another account</button></p>
      <p class="yk-connect-q" lang="tr">Defter, notlarını bu hesapla eşitlesin mi?</p>
      <p class="hint" lang="en">Let Notebook sync your notes with this account?</p>
      <p class="hint yk-detail" lang="tr">Okuyucu defterini bu hesapta okuyup kaydeder. Kumru ilerlemene, arkadaşlarına ya da hesabına erişemez.</p>
      <p class="hint yk-detail" lang="en">The reader reads and saves your notebook in this account. It can't see your Kumru progress, friends or account.</p>
      <p class="hint yk-detail" lang="tr">Kumru da bu defteri okuyabilir: kitaptaki ilerlemeni gösterir ve ona göre kontrol noktası önerir. Okuyucu Kumru verilerini yine göremez.</p>
      <p class="hint yk-detail" lang="en">Kumru can read the notebook too, to show your book progress and suggest checkpoints. The reader still can't see your Kumru data.</p>
      <div class="yk-lists">
        <div><b>It can</b><ul><li>Read and save your notebook: answers, writing, self-assessment, pages read, grammar boxes</li></ul></div>
        <div><b>It can't</b><ul><li>See your Kumru progress, friends or account</li><li>Sign in to Kumru as you</li></ul></div>
      </div>
      <p class="acc-err" role="alert">{err}</p>
      <div class="yk-actions">
        <button ref={allowBtn} class={"btn primary block" + (busy ? " busy" : "")} type="button" aria-busy={busy ? "true" : undefined} onClick={allow}>
          {busy ? "Bağlanıyor… · Connecting…" : "İzin ver · Allow"}
        </button>
        <button class="btn block" type="button" disabled={busy} onClick={deny}>Vazgeç · Cancel</button>
      </div>
      <p class="hint yk-foot">Disconnect any time under Profile → Account.</p>
    </div>
  );
}
