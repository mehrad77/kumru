// The `player` lazy bundle (host.lib("player"), app/host/lib.ts): Sahne's stage with the Turkish plugin, the kit with Kerim and the
// animals, the story adapter and the player's logic, about 250 KB gzip, and each story's set families on top (≤ 40 KB each).
// The Stories feature loads it when a story opens; the service worker caches it on first use (sahne/packages/sahne/DESIGN.md §4.3).
// Everything Sahne the reader needs comes through here, so no engine code reaches the feature's own chunk.
import { browserVoice, glossInto, interact, mountStage, normalize, propText, type Gloss, type GlossOptions, type Stage } from "sahne";
import { canListen, cannotListen, listenFor } from "sahne/listen";
import { kit as baseKit } from "sahne-kit";
import { puppets as kerimPuppets } from "sahne-kit/kerim";
import { puppets as animalPuppets } from "sahne-kit/puppets";
import { familiesOf, loadSet, withSet } from "sahne-kit/set";
import { tr } from "sahne-tr";
import { adaptStory, albumBand, flagsOf, metIn, storyPlayer, unlockedOf, warmthOf, type CharacterDoc, type StoryDoc, type StoryPlace } from "sahne-story";

export { adaptStory, albumBand, flagsOf, metIn, unlockedOf, warmthOf, browserVoice, canListen, cannotListen, glossInto, interact, listenFor, propText, storyPlayer, tr };
export type { Gloss, GlossOptions, Stage };

const withPuppets = { ...baseKit, puppets: { ...baseKit.puppets, ...kerimPuppets, ...animalPuppets } };

/** The kit for one story: the base kit, the puppets, and the set families its places use (fetched now, cached by the service worker). */
export async function kitFor(places: StoryPlace[]) {
  return withSet(withPuppets, await loadSet(familiesOf(places)));
}

/** The learner's character as Nima's, untrusted: no cast parts, palette colours only (the stage trusts its cast). */
export const learnerAvatar = (char: unknown) => normalize(char, baseKit, { trusted: false });

/** A mounted stage for a story, in log mode or theatre mode. */
export function stageFor(host: HTMLElement, kit: Awaited<ReturnType<typeof kitFor>>, o: { theatre: boolean; gloss: GlossOptions; motion?: "full" | "calm" | "still"; sounds?: string; onContext?: (lost: boolean) => void }): Stage {
  return mountStage(host, { kit, lang: tr, bubbles: o.theatre ? true : "log", gloss: o.gloss, glosses: false, voice: browserVoice(), motion: o.motion, sounds: o.sounds, onContext: o.onContext });
}

export type { CharacterDoc, StoryDoc, StoryPlace };
