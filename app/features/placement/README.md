# placement

The adaptive check of words and suffixes that finds where a learner starts (onboarding's quiz step) or whether they may skip ahead (the Path's **Jump here** and **Test out**). The climb is a binary search over units (or tree sections): each probe asks about six words of one place (distractors from the same place, then the same level, then any) and up to four suffix items of its lessons; a probe passes with 5/6 of its words and 3/4 of its suffix items. No tab, no slots, no server half. The rules (scores, cautious learning marks, jumps) are in `docs/PROGRESS.md`.

| | |
|---|---|
| Screens | `Climb.tsx` (the quiz: heading line, prompt, four options, "I don't know"; keys 1-4 answer; draws into whatever holds it) |
| Code | `items.ts` (`plUnitItems`, `plSectionItems`: the probes), `apply.ts` (`scoreRecs`: words +2 / -3, drill counters; `applyPlacement`: marks lessons learned, moves `S.pos`, writes the `S.placed` audit or logs a jump, syncs the skill tree, saves) |
| Model | `model/placement.ts` (`PL_SELF`, `plPass`, `plNext`, `plNudge`, `pickOptions`) with its test |
| CSS | `placement.css` (`.pl-head`, `.pl-body`); the prompt and option classes (`.q-title`, `.choices`, `.choice`, ...) are the practice screen's, in `app/styles/components.css` |
| Storage | none of its own: `S.stats`, `S.drill`, `S.conf`, `S.learned`, `S.pos`, `S.placed` (progress document) |

`index.ts` exports `loadClimb()` (the component, for onboarding's quiz step and the Path's Jump here and Test out sheets, through `ui/Lazy`), `PL_SELF`, `plNudge`, `applyPlacement`, `plSectionItems`, `scoreRecs`.

## What this feature calls in the path feature

`treeSecs`, `treeSync`, `useTree` and `closeUnits` (the skill tree and which units are open are the Path's).
