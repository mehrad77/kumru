// The settings building blocks in Preact: a card, a row and a switch; text is bidi-isolated as `el()` does. The styles are
// `.set-card`, `.set-row`, `.set-ctl` and `.switch`.
import type { ComponentChildren } from "preact";
import { bidiTxt } from "../core/i18n.ts";
import type { IconName } from "../core/dom.ts";
import { Icon } from "./Icon.tsx";

/** The icon in front of each settings card's title. */
const SET_ICON: Record<string, IconName> = { Account: "user", Classes: "users", Reminders: "bell", Study: "target", Language: "globe", "Voice & audio": "listen", Appearance: "sun", Privacy: "shield", "Editor tools": "sliders" };

export function SetCard({ title, children }: { title: string; children?: ComponentChildren }) {
  const icon = SET_ICON[title];
  return (
    <section class="card set-card">
      <h2>{icon ? <Icon name={icon} class="set-ic" /> : null}{bidiTxt(title)}</h2>
      {children}
    </section>
  );
}

export function SetRow({ title, sub, children }: { title: string; sub?: string | null; children?: ComponentChildren }) {
  return (
    <div class="set-row">
      <div><b>{bidiTxt(title)}</b>{sub ? <span class="hint">{bidiTxt(sub)}</span> : null}</div>
      <div class="set-ctl">{children}</div>
    </div>
  );
}

export function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button class={"switch" + (on ? " on" : "")} type="button" role="switch" aria-checked={on ? "true" : "false"} aria-label={label} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}
