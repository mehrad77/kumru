// Opening the Lab's sheets. DOM only: the bodies are Preact components in SheetBodies.tsx, loaded when a sheet opens.
import { openDrillSheet } from "../drills/index.ts";
import { hasVoice } from "../../ui/speech.ts";
import { openIsland } from "../../ui/open.ts";
import { toast } from "../../ui/toast.ts";
import { proveStart } from "./sources.ts";

const bodies = () => import("./SheetBodies.tsx");

export const openLabDecks = (): void => { openIsland("Flashcard decks", "Flashcard decks", () => bodies().then((m) => m.DecksSheet), {}); };
export const openLabGym = (): void => { openIsland("Question-type gym", "Question-type gym", () => bodies().then((m) => m.GymSheet), {}); };
export const openLabVerbs = (): void => { openIsland("Verb gym", "Verb gym", () => bodies().then((m) => m.VerbsSheet), {}); };
export const openLabProve = proveStart;

export function openLabListen(): void {
  if (!hasVoice()) { toast("This device has no Turkish voice."); return; }
  openIsland("Listening lab", "Listening lab", () => bodies().then((m) => m.ListenSheet), {});
}

/** The deck sources for one kind of question (the title is the sheet's). */
export const openLabSources = (title: string, kind: string): void => { openIsland(title, title, () => bodies().then((m) => m.SourcesSheet), { kind }); };
/** The topic list for one kind of question. */
export const openLabTopics = (kind: string, min: number): void => { openIsland("Pick a topic", "Pick a topic", () => bodies().then((m) => m.TopicsSheet), { kind, min }); };

/** The suffix-drill picker, as the gym's "Suffix drill" row opens it. */
export const openLabDrill = (mins: number): void => openDrillSheet(mins, { lab: true });
