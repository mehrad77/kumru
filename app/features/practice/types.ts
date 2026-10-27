/* eslint-disable @typescript-eslint/no-explicit-any -- a session and its steps are open records the session kinds fill (S.session) */
// The shapes the runner shares with the code that builds sessions. A session is the object kept in `S.session`; a step is one
// entry of its queue.
import type { ComponentChildren } from "preact";

/** A card as the questions read it. */
export type Card = { id: string; kind?: string; tr: string; en?: string; fa?: string; topic?: string; level?: string; ref?: string; origin?: string; detail?: string; ex?: string; pos?: string; accept?: string[]; gloss?: Record<string, string>; retired?: boolean; [field: string]: any };

/** One step of a session's queue: `k` is its kind (`flash choice type listen match build drill learn spot fixit hearpick hearbuild`, or a
 * kind the driver draws itself), the rest says what to ask. Fields the runner reads: `c` the card, `dir` ("t" asks for the Turkish, "m"
 * for the meaning), `dpool` the wrong options, `pool`/`spool` the words or sentences to draw from, `cards` the pairs of a match round,
 * `sent` the sentence of a build, `hint` (hinted words), `audio` (sound in place of text), `label` (shown before the kind), `retry`,
 * `n`/`of` (a learn card's place in its lesson), `dtype` (a drill kind). */
export interface Step { k: string; c?: Card; label?: string; retry?: number; [field: string]: any }

/** The object in `S.session`. Session kinds add their own fields (`node`, `mins`, `lab`, `focus`, `fixed`, …); the runner reads and keeps
 * the ones below. */
export interface Session {
  kind: string;
  queue: Step[];
  /** Steps in a fixed session (a path node, a ready-made list); `Infinity` for a timed one. */
  total: number;
  /** Steps shown so far. */
  i: number;
  right: number;
  wrong: number;
  /** [Turkish, meaning] of what was missed, for the report. */
  missed: [string, string][];
  /** Ids of the cards asked in this session (a deck question avoids them while others remain). */
  used: Set<string>;
  /** The step being asked. */
  cur?: Step;
  combo?: number;
  best?: number;
  newWords: Card[];
  /** The path node this session plays; `node` and `fixed` sessions show "n / total" and a progress bar by steps. */
  node?: any;
  fixed?: boolean;
  mins?: number;
  start?: number;
  endAt?: number;
  timeUp?: boolean;
  reported?: boolean;
  lab?: boolean;
  focus?: any;
  /** Called when the session ends (a timer to clear). */
  onEnd?: () => void;
  [field: string]: any;
}

/** What draws the steps of a session: kinds.ts registers one. */
export interface Driver {
  /** Choose the next step for the runner to draw (a question, an intro or lesson card, a report). */
  step(): Step | null;
  /** The close button: return true when you took over (a report), false to end the session. */
  close(): boolean;
}

/** The footer of the session screen. */
export type Foot =
  | { t: "none" }
  /** A button that checks the answer; `ready` enables it. */
  | { t: "check"; label: string; ready: boolean; run: () => void }
  /** A line of hint under the answers. */
  | { t: "hint"; text: string }
  /** Again / Good / Easy under a flashcard. */
  | { t: "rate"; rate: (k: "a" | "g" | "e", ev: string) => void }
  /** The result of an answer: right or wrong, the head, the explanation, Continue. */
  | { t: "fb"; ok: boolean; head: string; praise: [string, string] | null; body: Child[] }
  /** A row of buttons (a report's Continue and Try again). */
  | { t: "buttons"; items: { label: string; primary?: boolean; run: () => void }[] };

export type Child = ComponentChildren | Node;

/** What the body of the screen shows. */
export type View =
  | { t: "none" }
  | { t: "step"; n: number; st: Step; prep: import("./prepare.ts").Prep };


/** The top bar: the count text and how full the bar is (0 to 100). */
export interface Progress { count: string; pct: number; now: number; max: number }
