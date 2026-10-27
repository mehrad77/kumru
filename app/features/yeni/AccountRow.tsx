// The Account card's row for the reader's connections (the card itself is app/features/account).
import "./yeni.css";
import { useEffect } from "preact/hooks";
import { signals } from "../../core/store.ts";
import { SetRow } from "../../ui/settings.tsx";
import { openConnections } from "./sheets.ts";
import { connections, loadConnections } from "./state.ts";

export function AccountRow() {
  const me = signals.me.value, n = connections.value;
  useEffect(() => { void loadConnections(); }, [me]);
  if (!me) return null;
  return (
    <SetRow title="Notebook" sub={(n == null ? "" : n ? n + " connected. " : "None connected. ") + "Readers on yeni.shab.boo that sync their notebook with this account."}>
      <button class="btn sm" type="button" onClick={openConnections}>Connections</button>
    </SetRow>
  );
}
