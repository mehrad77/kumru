// The colour theme: "system" follows the device, "light" and "dark" are the learner's choice (on this device, not synced).
import { local } from "../../core/local.ts";

export type Theme = "system" | "light" | "dark";

export const currentTheme = (): Theme => { const t = local.get("theme", "system"); return t === "light" || t === "dark" ? t : "system"; };

export function applyTheme(): void {
  const t = currentTheme();
  if (t === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

export function setTheme(t: Theme): void {
  local.set("theme", t);
  applyTheme();
}
