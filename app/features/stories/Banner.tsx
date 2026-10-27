// The Path's "out today" banner (the `pathBanners` slot): the story released today, with its picture. A learner who has not read
// the stories before it is sent to the first one they have not finished (the stories open in order); once it is read, the banner
// says so. Nothing on a day with no new story.
import "./stories.css";
import { S, redrawTick } from "../../core/store.ts";
import { Icon } from "../../ui/Icon.tsx";
import { personalizeStr } from "../onboarding/index.ts";
import { openStory } from "./open.ts";
import { isDone, launched, loadStories, loaded, nextStory, preview, readable, thumbBase, todays } from "./state.ts";
import { Thumb } from "./Thumb.tsx";

export function StoryBanner() {
  void redrawTick.value; void thumbBase.value;
  if (!loaded.value) { if (S.db) void loadStories(); return null; }
  const s = todays();
  if (!s || !(launched() || preview())) return null;
  const title = personalizeStr(s.title, "tr");
  if (isDone(s.id)) {
    return (
      <button class="card st-ban" type="button" onClick={() => openStory(s.id)}>
        <Thumb id={s.id} />
        <span class="st-ban-t"><small>Bugün · Today's story</small><b lang="tr">{title}</b><span class="hint">✓ Read. A new one comes tomorrow.</span></span>
      </button>
    );
  }
  const first = readable(s.id) ? s : nextStory() ?? s;
  return (
    <button class="card st-ban" type="button" onClick={() => openStory(first.id)}>
      <Thumb id={s.id} eager />
      <span class="st-ban-t">
        <small>Yeni hikâye · New today</small>
        <b lang="tr">{title}</b>
        <span class="hint">{first === s ? "Tap to read it." : `First: “${personalizeStr(first.title, "tr")}”, the next story in order.`}</span>
      </span>
      <Icon name="chev" />
    </button>
  );
}
