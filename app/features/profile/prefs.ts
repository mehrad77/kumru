// Writing a preference: the progress document keeps `prefs` (synced between phones); the help language is also remembered on
// this device (`kumru:mlang`) so the first paint of the next visit already has it.
import { local } from "../../core/local.ts";
import { S } from "../../core/store.ts";
import { saveProgress } from "../progress/index.ts";

export function setPref(key: string, value: unknown): void {
  S.prefs = { ...S.prefs, [key]: value };
  if (key === "lang") { S.mlang = String(value); local.set("mlang", String(value)); }
  saveProgress();
}
