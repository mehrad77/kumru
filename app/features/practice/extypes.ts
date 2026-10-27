/** The question types a practice session can ask, with what the Lab and the session pickers say about them. */
export interface ExType { k: string; name: string; desc: string; c: string; tts?: boolean }

export const EXTYPES: ExType[] = [
  { k: "flash", name: "Flashcards", desc: "Flip a card, then rate how well you knew it.", c: "var(--accent)" },
  { k: "choice", name: "Multiple choice", desc: "Pick the right meaning or the right word.", c: "var(--m-pl)" },
  { k: "type", name: "Type it", desc: "See the meaning, type the Turkish.", c: "var(--m-case)" },
  { k: "listen", name: "Listen and type", desc: "Hear a word, type what you hear.", c: "var(--m-pers)", tts: true },
  { k: "match", name: "Match pairs", desc: "Tap each word and its meaning.", c: "var(--m-tense)" },
  { k: "build", name: "Build the sentence", desc: "Tap the words into the right order.", c: "var(--m-q)" },
  { k: "drill", name: "Suffix drill", desc: "Choose a suffix, or mix them all.", c: "var(--m-poss)" },
];
