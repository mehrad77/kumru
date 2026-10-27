// Small pieces of the question screens: the speaker with its slower twin, the Turkish letter row and the quiet hint line under answers.
import { useEffect, useLayoutEffect } from "preact/hooks";
import { Icon } from "../../../ui/Icon.tsx";
import { speak } from "../../../ui/speech.ts";
import { footHint } from "../engine.ts";

/** The question side of a listening step: the speaker (and a slower one) instead of the text; it plays once on its own. */
export function AudioPrompt({ tr }: { tr: string }) {
  useEffect(() => { const t = setTimeout(() => speak(tr), 250); return () => clearTimeout(t); }, [tr]);
  return (
    <div class="listen-btns">
      <button class="big-speak" type="button" aria-label="Play again" onClick={() => speak(tr)}><Icon name="speaker" /></button>
      <button class="btn" type="button" onClick={() => speak(tr, 0.55)}>Slower</button>
    </div>
  );
}

/** Under a set of answers the footer only says "Tap an answer". */
export function useHint(text = "Tap an answer"): void {
  useLayoutEffect(() => { footHint(text); }, [text]);
}
