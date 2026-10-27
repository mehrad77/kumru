# tutor

The AI tutor and what it keeps. On Kumru's Worker `host.ai` is `null`, so the AI state is `off` and every caller takes its offline path: the lesson page's "Try it" box is hidden, onboarding keeps what the learner typed and skips the writing sample, the Profile card says "Not available here". The code is complete for the day a model is attached (`/api/ai` is a stub). No tab and no server half of its own: the `tutor` document goes through the host's sync (`window.kumru.host.db.doc("data/users/<me>/tutor")`, joined by `window.kumru.merge.tutor`).

| | |
|---|---|
| State | `ai.ts`: `aiStatus` (signal: `unknown`, `ready`, `denied`, `off`), `initAI()` (once, at boot), `aiErrText(e)` (what the learner is told; a host refusal marks the AI `denied`), `askJson(prompt, signal)` (one quick call, JSON back; Stop answers at once). `doc.ts`: the tutor document (`mistakes`, `tries`, `talk`): `loadTutorDoc`, `saveTutorDoc` / `saveTutorSoon`, `addMistake`, `mistakeSeen`, `recordCheck`, `seedPlacementMistakes` |
| Calls to the AI | `check.ts`: `checkSentence` (Try it, tutor lab), `translitName` (a Persian name in Latin letters; the offline guess without the AI), `buildProfile` (onboarding's answers as clean forms; `profileFallback` without the AI), `checkPlacement` (the writing sample) |
| Screens | `TryIt.tsx` (the lesson page's "Try it yourself" box), `TutorLab.tsx` (editors only: runs the fixtures in `tutorlab/fixtures` through the checker and saves the run), `parts.tsx` (`Explain`, `DiffLine`, `LessonLink`, `FixNote`) |
| DOM adapters | `tryit.ts` (`tryItBox(lesson)`: a host node or null), `lab.ts` (`openTutorLab()`: a full-screen page, not on the overlay stack), `session.ts` (`startMistakes`, `pickMistake`); `index.ts` also offers `loadExplain` / `loadFixNote`, the correction pieces of `parts.tsx` as lazy components |
| Model | `model/diff.ts` (`wordDiff`, `normW`, `sameSent`), `model/prompts.ts` (`LEVEL_NOTES`, the prompts, `normCheck`, `normPlace`, `normLatin`, `TUTOR_V`), `model/mistakes.ts` (add, pick, retire), `model/lab.ts` (`verdict`, `summarize`), `model/abortable.ts` |
| CSS | `tutor.css` (`try-*`, `dline`, `d-del`, `d-ins`, `lab-*` of the lab). `.try-in`, `.ai-pill`, `.think-bar`, `.tw-col` are in `app/styles/components.css` (onboarding and Profile use them); `.fix-orig` and `.fix-hint` are the practice feature's (`practice.css`) |
| Storage | `kumru:tutor` (signed out), `kumru:aiInfo` (the "checks use the AI tutor" note, shown until the first check); the document's revision `kumru:rev:tutor` is the host's |

**Fix my mistakes.** Wrong Turkish sentences from "Try it" and the placement sample join `mistakes` (60 kept; a fix retires after two right answers). The Path's "Fix my mistakes" row calls `startMistakes`, which starts a custom practice session (`kind: "mist"`). The session's two question types, *Spot the right one* and *Fix the sentence* (and the "All fixed" screen), are the practice feature's (`steps/Mistakes.tsx`); they call `pickMistake`, `mistakeSeen`, `sameSent` and the `loadFixNote` / `loadExplain` components from `index.ts`.

## Boot

`initAI` at the `gated` phase (signed in); `loadTutorDoc` at the `progress` phase. The path feature's Review sheet imports `mistakes` and `startMistakes` from `index.ts`.

## What this feature calls

In other features: `onboarding` (`learnerBlurb`, `translitOffline`, `profileFallback`, `normProfile`), `progress` (`myLevel`, `bumpDay`, `recordEx`), `grammar` (`lessonTitle`, `lessonOrder`, `openLesson`). `practice` (`startCustom`, for Fix my mistakes).

Used by: `profile` (`aiState`, `openTutorLab`: the AI tutor card and Editor tools), `onboarding` (`aiState`, `aiErrText`, `translitName`, `buildProfile`, `checkPlacement`, `seedPlacementMistakes`).
