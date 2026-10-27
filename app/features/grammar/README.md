# grammar

The lesson page and what is on it. No tab, no server half. The Turkish engine that builds the forms (vowel harmony, noun and verb builders) is `app/lib/morphology.ts`, shared with the drills, placement and onboarding.

| | |
|---|---|
| Deep link | `lesson` (`/lesson/<id>`, `WebFeature.open`): opens once the lessons have loaded, a missing one lands on the Path; while the page is open the address bar shows it (`url`, priority 30) |
| Screens | `LessonPage.tsx` (the full-screen page on the overlay stack, `core/overlay.ts`: Back and Escape close it; top bar, title, blocks, examples, "Remember", the tutor's "Try it", "Mark as learned", "Drill this", previous and next), `Block.tsx` (table, chain, compare, slots, tip, widget), `Widgets.tsx` (harmony, noun, cases, verb, clock, place and quiz), `Text.tsx` (`Morph`, `MEl`, `Fa`, `Lab`, `OutBlock`) |
| Code | `lesson.ts` (the open lesson as a signal, `openLesson`, `closeLesson`, `toggleLearned`, `lessonTitle`, `lessonOrder`; the page's host element carries `lesson-page lp-lesson`, which the overlay lock and the CSS key on), `dom.ts` (the same helpers as plain DOM for the DOM-built practice steps) |
| Model | `model/morph.ts` (the `[text:role]` suffix markup, the quiz items), `model/widgets.ts` (what the harmony box shows, the clock's sentences, the cat's places) |
| CSS | `grammar.css`. The page chrome the class page and the tutor lab share (`.lesson-page`, `.lp-bar`, `.lp-back`, `.lp-crumb`, `.lp-wrap`) and the text classes the practice screens use too (`.w-word`, `.w-fa`, `.w-en`, `.tip`, `.exi`, `.qz-q`, `.qz-gap`) are in `app/styles/components.css` |
| State | `lessonId` (signal); "learned" is `S.learned` (progress document), answers in the quiz box go to `recordEx("quiz", ok, lessonId)` and `bumpDay` |

The data shapes are in `docs/GRAMMAR_BRIEF.md`; `uv run tools/grammar_lessons.py --check` validates the lessons and their widgets.

## What other features call

`openLesson` (the Path's unit and skill sheets, the practice engine's "Open lesson" and "Full lesson" links), `closeLesson`, `lessonPageId()`, and for the practice steps that draw their own nodes: `morph`, `mEl`, `quizLine` (plain DOM) and `renderBlock(block)` (a host node the block draws into once Preact has loaded).

## What this feature calls

The tutor's `tryItBox` (a DOM node, drawn into the page with `BuiltNode`), the drills' `startDrill` and `lessonDrillTypes`, progress (`rev`, `recordEx`, `bumpDay`, `saveProgress`), words' `closeGloss`.
