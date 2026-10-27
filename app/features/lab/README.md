# lab

Kerim's Lab: practice the learner chooses (decks, one question type, Prove it, the verb gym, the listening lab) and features on trial before they reach the Path. No server half. Practice here moves word confidence only: no XP, no streak day, never the path position (`inLab` in the progress feature; rules in docs/PROGRESS.md).

| | |
|---|---|
| Tabs | `lab` (`/lab`), between Stories and Friends; `when: labOn`, so the tab bar button and deep links follow it (`core/router.ts`) |
| Who sees it | editors, and anyone who opened the page with `?lab` (remembered under `kumru:lab`; `?lab=0` hides it again). `access.ts`: `applyLabSwitch` (runs when the feature loads), `labOn`. Opening it to everyone means dropping the editor check there |
| Screens | `LabTab.tsx` (the bench scene with Kerim in goggles, the speech bubble, two blurred *Coming soon* cards, one recipe card per feature), `SheetBodies.tsx` (the sheets: length picker, deck sources, topics, gym, verb gym, listening lab), `art.ts` (the scene SVG, goggles and collar), `sheets.ts` (opens the sheets; DOM only) |
| State | none of its own; the length is remembered under `kumru:labMin`. `sources.ts` builds the word pools from `S.cards` / `S.stats` and starts sessions (`labStart`, `verbStart`, `proveStart`) |
| Model | `model/decks.ts` (lengths, the smallest deck per question type, topics, counts), `model/prove.ts` (`claimedWords`, `proveSteps`; `scripts/kumru_tree.test.cjs` requires it) |
| CSS | `lab.css` (`lab-*`). The report's "words moved" line (`.nr-xp.lab-moved`) is in the practice feature's `practice.css` |

## Boot

At the `identity` phase a link to `/lab` on an account that may not open it says "Kerim's Lab isn't open on this account".

## What this feature calls in other features

`weakPool` and `useTree` from the path feature. It starts its sessions with `startCustom`, `newWordBatch`, `catchUpWords` and `topicRank` from the practice feature. The question types the Gym lists are `EXTYPES` from the practice feature. The suffix-drill picker is the drills feature (`openDrillSheet`, and `loadDrillGrid` for the verb gym's chips).
