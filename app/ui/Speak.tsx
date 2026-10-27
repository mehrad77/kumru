// The listen button next to a Turkish word (the Preact twin of `speakBtn` in speech.ts): nothing without a Turkish voice.
import { ICON } from "../core/dom.ts";
import { hasVoice, speak } from "./speech.ts";

export function SpeakBtn({ text }: { text: string }) {
  if (!hasVoice()) return null;
  return <button class="speak" type="button" aria-label="Listen" onClick={(e) => { e.stopPropagation(); speak(text); }} dangerouslySetInnerHTML={{ __html: ICON.speaker }} />;
}
