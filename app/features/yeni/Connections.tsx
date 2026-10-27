// The Account card's connections list: each connected reader, with a confirmed Disconnect.
import "./yeni.css";
import { useEffect, useState } from "preact/hooks";
import type { YeniTokenInfo } from "../../../shared/api.ts";
import { confirmSheet } from "../../ui/sheet.ts";
import { toast } from "../../ui/toast.ts";
import { yeni } from "./api.ts";
import { dayLabel } from "./model/format.ts";
import { Loading, SheetError } from "./parts.tsx";
import { setConnections } from "./state.ts";

type View = { k: "loading" } | { k: "error"; e: unknown } | { k: "ok"; list: YeniTokenInfo[]; origins: string[] };

export function Connections({ reopen }: { reopen: () => void }) {
  const [view, setView] = useState<View>({ k: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [list, origins] = await Promise.all([yeni.list(), yeni.origins().catch(() => [] as string[])]);
        if (!live) return;
        setConnections(list.length);
        setView({ k: "ok", list, origins });
      } catch (e) { if (live) setView({ k: "error", e }); }
    })();
    return () => { live = false; };
  }, [attempt]);

  if (view.k === "loading") return <div class="acc-form"><Loading text="Loading connections…" /></div>;
  if (view.k === "error") return <div class="acc-form"><SheetError error={view.e} retry={() => { setView({ k: "loading" }); setAttempt(attempt + 1); }} /></div>;
  const { list, origins } = view;
  const site = origins.find((o) => !/localhost|127\.0\.0\.1/.test(o)) || origins[0];
  const disconnect = (t: YeniTokenInfo) => confirmSheet({
    title: "Disconnect " + (t.label || "this reader") + "?",
    body: "That browser stops syncing its Notebook with your account. Its own copy stays on that device, and what's already saved here stays in your account.",
    label: "Disconnect",
    action: async () => { await yeni.revoke(t.id); setConnections(Math.max(0, list.length - 1)); toast("That reader is disconnected."); },
    then: reopen,
    cancel: reopen,
  });
  return (
    <div class="acc-form">
      {list.length ? list.map((t) => (
        <div class="acc-dev">
          <div><b>{t.label || "Notebook"}</b><div class="hint">Connected {dayLabel(t.created_at)} · last used {dayLabel(t.last_used_at)}</div></div>
          <button class="btn sm" type="button" onClick={() => disconnect(t)}>Disconnect</button>
        </div>
      )) : <p class="hint">No reader is connected. On {site ? new URL(site).host : "yeni.shab.boo"}, open Ayarlar and choose Connect with Kumru to sync your notebook.</p>}
      {site ? <a class="yk-site" href={site} target="_blank" rel="noopener noreferrer">Open {new URL(site).host}</a> : null}
    </div>
  );
}
