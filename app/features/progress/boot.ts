// Boot: this device's saved progress at once, then the server's copy merged in (docs/SPECS.md section 9).
import { rerender } from "../../core/router.ts";
import { renderUser } from "../../core/shell/appbar.ts";
import { S } from "../../core/store.ts";
import { mergeProgress } from "../../../shared/progress.ts";
import { applyProgress, loadLocal, progressDoc, saveLocal, saveProgress } from "./api.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ANON = "kumru:progress:anon";
const readAnon = (): Record<string, any> | null => { try { return JSON.parse(localStorage.getItem(ANON) || "null"); } catch { return null; } };
const dropAnon = (): void => { try { localStorage.removeItem(ANON); } catch { /* storage is off */ } };

/** The signed-in page starts from the copy on this device. */
export function applyLocalCopy(): void {
  const lp = loadLocal();
  if (lp) applyProgress(lp);
}

/** Signed in: the server copy merged with this device's last copy (answers not yet sent survive a reload, docs/SPECS.md section 9);
 *  a first sign-in with no server copy uploads the progress made signed out; later server copies (another phone, a 409) arrive
 *  through the doc snapshot and are merged into the live state. `S.progLoaded` is set whatever happens. */
export async function mergeServerProgress(): Promise<void> {
  try {
    if (!S.me || !S.db) return;
    const db: any = S.db, path = "data/users/" + S.me + "/progress";
    const progP = db.doc(path).get();
    progP.catch(() => {});
    const lp = loadLocal();
    let p: any = null;
    try { p = await progP; } catch { /* offline: this device's copy stands */ }
    if (p && p.exists) {
      const sd = p.data() || {};
      let m = lp ? mergeProgress(lp, sd) : sd;
      // progress made on this device before the account existed joins the account's, once
      const anon = readAnon();
      if (anon) { m = mergeProgress(m, anon); dropAnon(); }
      applyProgress(m);
      if (JSON.stringify(m) !== JSON.stringify(sd)) saveProgress();
    } else if (lp) {
      applyProgress(lp);
    } else {
      const anon = readAnon();
      if (anon) { applyProgress(anon); saveProgress(); dropAnon(); }
    }
    db.doc(path).onSnapshot((r: any) => {
      const d = r.data();
      if (!d) return;
      applyProgress(mergeProgress(progressDoc() as any, d));
      saveLocal();
      renderUser();
      rerender();
    });
    renderUser();
    S.progLoaded = true;
    rerender();
  } catch (e) {
    console.warn("progress", e);
  } finally {
    S.progLoaded = true;
  }
}
