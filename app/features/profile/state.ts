// The two device settings the Profile cards read: the theme and "read story lines aloud". They live in localStorage, not in the
// progress document, so a signal mirrors each for the cards to redraw on.
import { signal } from "@preact/signals-core";
import { local } from "../../core/local.ts";
import { currentTheme, setTheme, type Theme } from "./theme.ts";

export const theme = signal<Theme>(currentTheme());
export const readAloud = signal(local.get("st-auto", "1") === "1");

export function chooseTheme(t: Theme): void {
  setTheme(t);
  theme.value = t;
}

export function setReadAloud(on: boolean): void {
  local.set("st-auto", on ? "1" : "0");
  readAloud.value = on;
}

/** Bumped when the learner picks another voice, so the Voice card redraws. */
export const voiceTick = signal(0);
