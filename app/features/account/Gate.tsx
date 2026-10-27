// The sign-in gate (docs/SPECS.md section 8.7): nobody uses the app signed out. Boot shows this and nothing else while there is
// no session; its buttons open the account sheets (they sit above it), and signing in reloads the page. `context` says who sent
// the learner here (Notebook's /connect/yeni, drawn by that flow).
import "./account.css";
import { useEffect, useState } from "preact/hooks";
import { BuiltNode } from "../../ui/island.tsx";
import { pup } from "../../ui/kerim/kerim.ts";
import { NodeHost } from "./forms.tsx";
import { openLogin, openPairClaim, openRecover, openSignup } from "./sheets.tsx";

const kerim = () => pup("idle", 0, { pose: "head", enter: false, label: "Kumru" });

export function Gate({ context }: { context?: Node | null }) {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    addEventListener("online", sync);
    addEventListener("offline", sync);
    return () => { removeEventListener("online", sync); removeEventListener("offline", sync); };
  }, []);
  return (
    <div class="gate-card">
      <div class="gate-k"><BuiltNode render={kerim} contents /></div>
      <h1>Kumru</h1>
      {context ? <NodeHost node={context} /> : null}
      <p class="gate-lead">Turkish in a few minutes a day. Your account keeps your progress on every phone.</p>
      <div class="gate-actions">
        <button class="btn primary block" type="button" onClick={openSignup}>Create account</button>
        <button class="btn block" type="button" onClick={openLogin}>Sign in</button>
      </div>
      <p class="hint gate-note" role="status">{online ? "" : "You're offline. Connect to the internet to create an account or sign in."}</p>
      <div class="gate-links">
        <button class="btn sm" type="button" onClick={openRecover}>Forgot your password?</button>
        <button class="btn sm" type="button" onClick={openPairClaim}>Add this phone with a code</button>
      </div>
    </div>
  );
}
