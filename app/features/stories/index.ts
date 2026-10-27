// The stories feature: Kerim's Sahne stories (docs/stories/, sahne/packages/sahne-story). The Stories tab (the home tab: the timeline
// and "Next for you"; the stories open in order), the reader at /stories/<id>, a full-screen page around Sahne's stage, and the
// Path's "out today" banner. The collections load the first time either
// opens; the stage comes in the lazy `player` bundle. Before Season 1's launch day only editors and ?stories see the stories
// (state.ts); everyone else sees the "coming" card. README.md lists what it owns. This file is in the page's entry chunk, so it
// imports only state.ts: the page and the reader load when a story opens.
import type { ComponentType } from "preact";
import type { WebFeature } from "../../core/feature.ts";
import { S } from "../../core/store.ts";
import { applyStoriesSwitch, loadStories, loaded, openStories, storyId } from "./state.ts";

/** Open story `id` in the reader (loads the reader's chunk). */
export const openStory = (id: string): void => { void import("./open.ts").then((m) => m.openStory(id)); };

// ?stories / ?stories=0 is remembered before the router decides what to open
applyStoriesSwitch();

export const feature: WebFeature = {
  id: "stories",
  tabs: [{ id: "stories", label: "Stories", icon: "chat", order: 5, load: () => import("./StoriesTab.tsx").then((m) => m.StoriesTab) }],
  open: {
    story: {
      open: openStory,
      needs: () => { if (!loaded.value && S.db) void loadStories(); return loaded.value; },
      exists: (id: string) => openStories().some((s) => s.id === id),
      gone: ["That story isn't out yet.", "stories"],
    },
  },
  slots: {
    profileCards: [{ order: 65, load: () => import("./Settings.tsx").then((m) => m.StorySettings as ComponentType) }],
    // the story out today, at the top of the Path
    pathBanners: [{ order: 5, load: () => import("./Banner.tsx").then((m) => m.StoryBanner as ComponentType) }],
  },
  url: [{ priority: 30, current: () => (storyId.value ? "/stories/" + storyId.value : null) }],
};
