// The account sheets (docs/SPECS.md section 8): create an account, sign in, use a recovery code, add this phone with a code,
// change the password, add a phone (QR), signed-in devices, sign out and delete. Signing in in any way reloads the page, so
// boot runs once with the new identity (docs/SPECS.md section 8.7).
import { signal, type Signal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import { rerender } from "../../core/router.ts";
import { S } from "../../core/store.ts";
import { closeSheet, confirmSheet } from "../../ui/sheet.ts";
import { toast } from "../../ui/toast.ts";
import { account, type TurnstileState } from "./api.ts";
import { AccForm, Loading, SheetError, type Field, type FormProps } from "./forms.tsx";
import { accErr, type FailureLike } from "./model/errors.ts";
import { openIsland } from "../../ui/open.ts";
import { flags, passwordChanged } from "./state.ts";
import { welcomeNext } from "./welcome.ts";

const form = (title: string, props: FormProps) => openIsland(title, title, async () => AccForm, props);
const reload = () => location.reload();

const USERNAME: Field = { k: "username", label: "Username", auto: "username", at: true, max: 24 };
const NEW_PASSWORD: Field = { k: "password", label: "New password", hint: "At least 8 characters.", type: "password", auto: "new-password", name: "new-password", min: 8 };

/* ---------- create an account: the human check gates the button, a failed submit spends it, a widget that can't load says so ---------- */
function Signup() {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<{ needed: boolean; reset: () => void } | null>(null);
  const [needed, setNeeded] = useState(false);
  const [tok, setTok] = useState<string | null>(null);
  const [failed, setFailed] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    const on = (s: TurnstileState) => {
      if (s.token !== undefined) { setTok(s.token); setFailed(""); setNote(""); }
      else if (s.expired) { setTok(null); setNote(""); }
      else if (s.error) {
        setTok(null);
        setFailed(s.error);
        setNote(s.error === "script" ? "The human check couldn't load. Check your connection, then try again." : "The human check didn't work. Try again.");
      }
    };
    widget.current = account.turnstile(box.current!, on);
    setNeeded(widget.current.needed);
  }, []);
  const token = useRef(tok);
  token.current = tok;
  const reset = () => { setTok(null); widget.current?.reset(); };
  const gate = needed && tok === null ? (failed ? "Human check failed" : "Checking you're human…") : "";
  const action = async (v: Record<string, string>) => {
    const username = v.username.toLowerCase();
    try {
      const r = await account.signup(username, v.password, token.current || "");
      closeSheet();
      welcomeNext("Welcome to Kumru!");
      openRecovery(r.recovery, username, reload);
    } catch (x) {
      if ((x as FailureLike | null)?.field === "turnstile") setNote(accErr(x));
      throw x;
    }
  };
  return (
    <AccForm
      fields={[
        { ...USERNAME, hint: "3–24 characters: a–z, 0–9, _ and .", pattern: /^[A-Za-z0-9_.]{3,24}$/, patternMsg: "Use 3–24 letters, digits, _ or . — no spaces." },
        { k: "password", label: "Password", hint: "At least 8 characters.", type: "password", auto: "new-password", name: "new-password", min: 8 },
      ]}
      submit="Create account" action={action} busy="Creating your account…" gate={gate}
      onFail={() => { if (needed) reset(); }}
      links={[["Already have an account? Sign in", openLogin]]}
      extra={
        <div class="acc-extra">
          <div class="acc-ts" ref={box} />
          <p class="acc-err" role="alert">{note}</p>
          <button class="btn sm ghost" type="button" hidden={!failed} onClick={() => { setFailed(""); setNote(""); reset(); }}>Check again</button>
        </div>
      }
    />
  );
}

export const openSignup = () => { openIsland("Create an account", "Create an account", async () => Signup, {}); };

export function openLogin(): void {
  form("Sign in", {
    fields: [USERNAME, { k: "password", label: "Password", type: "password", auto: "current-password" }], submit: "Sign in", busy: "Signing in…",
    action: async (v) => { const r = await account.login(v.username.toLowerCase(), v.password); welcomeNext(r.restored ? "Welcome back: your account is restored." : "Welcome back!"); reload(); },
    links: [["Forgot your password?", openRecover], ["Create account", openSignup]],
  });
}

export function openRecover(): void {
  form("Use a recovery code", {
    fields: [USERNAME, { k: "recovery", label: "Recovery code", hint: "Ten characters, like ABCDE-FGHIJ.", caps: "characters", mode: "text", auto: "one-time-code", max: 40 }, NEW_PASSWORD],
    submit: "Set new password", busy: "Setting your password…",
    action: async (v) => {
      const username = v.username.toLowerCase();
      const r = await account.recover(username, v.recovery, v.password);
      closeSheet();
      welcomeNext("Welcome back: your password is changed.");
      openRecovery(r.recovery, username, reload);
    },
    extra: <p class="hint">This also signs your other devices out and disconnects Notebook. You get a new recovery code.</p>,
    links: [["Back to sign in", openLogin]],
  });
}

export function openPairClaim(): void {
  form("Add this phone with a code", {
    fields: [{ k: "code", label: "The 12-character code from your other phone", caps: "characters", mode: "text", max: 20 }], submit: "Add this phone", busy: "Adding this phone…",
    action: async (v) => { await account.pairClaim(v.code); welcomeNext("This phone is added."); reload(); },
  });
}

export function openPassword(): void {
  form("Change password", {
    fields: [{ k: "current", label: "Current password", type: "password", auto: "current-password", name: "current-password" }, { ...NEW_PASSWORD, k: "next" }],
    submit: "Change password", busy: "Changing…",
    action: async (v) => {
      await account.password(v.current, v.next);
      closeSheet();
      passwordChanged();
      toast("Password changed. Your other devices were signed out and Notebook was disconnected.", 5000);
      if (S.tab === "profile") rerender();
    },
    extra: <p class="hint">This signs out your other devices and disconnects Notebook.</p>,
  });
}

export function openDelete(): void {
  form("Delete my account", {
    fields: [{ k: "password", label: "Your password", type: "password", auto: "current-password", name: "current-password" }], submit: "Delete my account", busy: "Deleting…",
    action: async (v) => { await account.deleteAccount(v.password); reload(); },
    extra: <p class="hint acc-danger">Your account stops working now and everything in it is erased after 7 days. Signing in again before then restores it.</p>,
  });
}

export function openLogout(): void {
  confirmSheet({
    title: "Sign out of this phone?", label: "Sign out",
    body: "Your progress stays in your account. This device forgets you until you sign in again, and anything not yet saved here is lost.",
    action: async () => { await account.logout(); reload(); },
  });
}

/* ---------- the recovery code: shown once (signup and after a recovery). The sheet can't be closed until the learner says it
   is saved: no X, no backdrop, no Escape; the gate's reload poll waits too (flags.recoveryOpen) ---------- */
interface RecoveryProps { code: string; user: string; saved: Signal<boolean>; lock: Signal<string>; finish: () => void }

function Recovery({ code, user, saved, lock, finish }: RecoveryProps) {
  const codeEl = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    if (copied === null) return;
    const t = setTimeout(() => setCopied(null), 2500);
    return () => clearTimeout(t);
  }, [copied]);
  const copy = async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(code); ok = true; }
    catch {
      try {
        const r = document.createRange();
        r.selectNodeContents(codeEl.current!);
        const s = getSelection()!;
        s.removeAllRanges();
        s.addRange(r);
        ok = document.execCommand("copy");
      } catch { /* the toast says how */ }
    }
    setCopied(ok ? "Copied" : "Select it to copy");
    toast(ok ? "Recovery code copied" : "Press and hold the code to copy it");
  };
  const download = () => {
    const txt = "Kumru recovery code\n\nUsername: " + user + "\nRecovery code: " + code + "\nKept on: " + new Date().toISOString().slice(0, 10)
      + "\n\nIf you forget your password, this code and your username get you back in at turk.shab.boo (Sign in → Forgot your password?).\nIt works once and gives you a new one. Keep this file private.\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    a.download = "kumru-recovery-" + user + ".txt";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div class="acc-form">
      <p class="hint">If you forget your password, this code and your username get you back in. It is shown only now: copy it, download it, or write it down.</p>
      <div ref={codeEl} class="acc-code" id="rc-code" tabindex={0} aria-label={"Recovery code " + code.split("").join(" ")}>{code}</div>
      <div class="acc-actions">
        <button class="btn sm" type="button" onClick={copy}>{copied ?? "Copy"}</button>
        <button class="btn sm" type="button" onClick={download}>Download .txt</button>
      </div>
      <label class="acc-check" for="rc-ok">
        <input type="checkbox" id="rc-ok" checked={saved.value} onChange={(e) => { saved.value = e.currentTarget.checked; lock.value = ""; }} />
        <span>I've saved it</span>
      </label>
      <p class="hint acc-lock" role="status">{lock.value}</p>
      <button class="btn primary block" type="button" disabled={!saved.value} onClick={finish}>Continue</button>
    </div>
  );
}

export function openRecovery(code: string, user: string, then: () => void): void {
  flags.recoveryOpen = true;
  const saved = signal(false), lock = signal("");
  const finish = () => { flags.recoveryOpen = false; closeSheet(); then(); };
  const back = openIsland("Your recovery code", "Recovery code", async () => Recovery, { code, user, saved, lock, finish });
  back.classList.add("sheet-locked");
  back._onDismiss = () => {
    if (saved.value) return finish();
    lock.value = "Tick “I've saved it” first: this code is not shown again.";
    back.querySelector<HTMLInputElement>("#rc-ok")?.focus();
  };
  saved.subscribe((v) => back.classList.toggle("sheet-locked", !v));
}

/* ---------- add a phone: a QR code and a one-time code; the sheet opens at once and fills in when the code arrives ---------- */
type Pairing = Awaited<ReturnType<typeof account.pairStart>>;

function PairStart() {
  const [r, setR] = useState<Pairing | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [now, setNow] = useState(Date.now());
  const load = () => { setError(null); setR(null); account.pairStart().then((p) => { setR(p); setNow(Date.now()); }, setError); };
  useEffect(load, []);
  const left = r ? Math.max(0, Math.round((r.expires - now) / 1000)) : 0;
  useEffect(() => {
    if (!r || !left) return;
    const t = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(t);
  }, [r, now]);
  if (error) return <div class="acc-form"><SheetError error={error} retry={load} /></div>;
  if (!r) return <div class="acc-form"><Loading text="Making a code…" /></div>;
  return (
    <div class="acc-form">
      <div class="acc-qr" aria-label="QR code to add a phone" dangerouslySetInnerHTML={{ __html: r.svg }} />
      <div class="acc-code">{r.code.replace(/(.{4})(?=.)/g, "$1-")}</div>
      <p class="hint" role="status">
        {left
          ? "Scan it with the other phone's camera, or type the code there under Profile → Add this phone with a code. It works once, for " + Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0") + " more."
          : "This code has expired. Close and make a new one."}
      </p>
    </div>
  );
}

export const openPairStart = () => { openIsland("Add a phone", "Add a phone", async () => PairStart, {}); };

/* ---------- signed-in devices: each session, with a confirmed Sign out ---------- */
type DeviceList = Awaited<ReturnType<typeof account.devices>>;

function Devices() {
  const [d, setD] = useState<DeviceList | null>(null);
  const [error, setError] = useState<unknown>(null);
  const load = () => { setError(null); setD(null); account.devices().then(setD, setError); };
  useEffect(load, []);
  if (error) return <div class="acc-form"><SheetError error={error} retry={load} /></div>;
  if (!d) return <div class="acc-form"><Loading text="Loading devices…" /></div>;
  const when = (t: number) => new Date(t).toLocaleDateString();
  const signOut = (s: DeviceList["sessions"][number]) => {
    if (s.id === d.current) return openLogout();
    confirmSheet({
      title: "Sign out " + (s.label || "that device") + "?", body: "It will need your password (or a new code) to sign in again.", label: "Sign out that device",
      action: async () => { await account.revoke(s.id); toast("That device is signed out."); }, then: openDevices, cancel: openDevices,
    });
  };
  return (
    <div class="acc-form">
      {d.sessions.map((s) => (
        <div class="acc-dev" key={s.id}>
          <div><b>{s.label || "Device"}</b><div class="hint">{(s.id === d.current ? "This device · " : "") + "active " + when(s.refreshed)}</div></div>
          <button class="btn sm" type="button" onClick={() => signOut(s)}>Sign out</button>
        </div>
      ))}
    </div>
  );
}

export function openDevices(): void { openIsland("Signed-in devices", "Signed-in devices", async () => Devices, {}); }
