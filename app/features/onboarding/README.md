# onboarding

The full-screen flow that welcomes a learner, and that Profile reopens in parts. Also the learner's name and hometown as the stories and the tutor use them. No tab, no server half: it saves through the progress document.

| | |
|---|---|
| Deep link | `onb`: `/onboarding` (and the old `#onb`) opens the full flow (`WebFeature.open.onb`, a dev screen) |
| Modes | `full` (a new learner: no skip links, Escape and Back don't close it; it is not on the overlay stack), `update` (an existing learner, once, when `S.onb < ONB_V`: what's new, goal), `edit` (name, character, about), `place` (retake the placement). `ORDER` in `model/flow.ts` lists the steps |
| Steps | `steps/Name.tsx`, `Avatar.tsx` (the character builder), `About.tsx` (hometown, job, hobby, why: the tutor's clean forms when it can, else as typed; a check card), `Place.tsx` (self-report, the quiz from the placement feature, the writing sample, the suggested start), `Rest.tsx` (what's new, goal, class, reminder, cast). Each step draws its own header, middle and footer with `Flow.tsx` (`StepView`, `Next`, `Skip`, `Think`); the answers live in one object in `Onboarding.tsx`, so Back finds them again |
| Overlay | `open.ts`: `openOnboarding(mode)` makes the `.onb-back` dialog on the body, puts it on the overlay stack (except `full`) and mounts the flow; closing saves `S.onb = ONB_V` and flushes the invite links that waited (`ui/later.ts`). `maybeOnboard()` is the boot's offer (not on `/connect/yeni`; waits for progress) |
| Model | `model/flow.ts` (modes, step order, `ONB_V`, the classes offered, the answers), `model/names.ts` (`nameSuffix`: Turkish endings in vowel harmony, `cap`, `hasFa`, `translitOffline`), `model/profile.ts` (`CITIES`, `cityLookup`, `profileFallback`, `normProfile`), `model/personalize.ts` (the Nima / Tahran swap: the stories' newcomer becomes the learner, the tutor's blurb). `personalize.ts` fills these with the learner's name and profile from the page state. Tested by `scripts/kumru_onb.test.cjs` |
| CSS | `onboarding.css` (`onb-*`, `av-*`, `nm-in`); the quiz's is `placement.css` |
| Storage | `S.nick`, `S.char`, `S.profile`, `S.prefs.goal`, `S.onb`, `S.placed` (progress document); `kumru:pending-class` (read: an invite waiting skips the class step) |

Other features' parts: the tutor (`tutor`: `translitName`, `buildProfile`, `checkPlacement`, `seedPlacementMistakes`, `aiState`, `aiErrText`; it calls back `learnerBlurb`, `translitOffline`, `profileFallback`, `normProfile` from this feature's `index.ts`), the quiz (`placement`: `loadClimb`, `applyPlacement`, `PL_SELF`, `plNudge`), the class step (`classes`: `classes.list/join`), the reminder step (`reminders`: `remindStep`, `loadRemindBody`), `ui/Seg`, `ui/TypeAids` (Turkish letters, mic), `ui/Portrait`, `ui/Pup`.

## Boot and names

- `maybeOnboard()` at the `routed` phase, once the learner and their progress are known and the first deep link has opened.
- `studentName()` (through `ui/avatar`'s `setLearnerName`) and `personalizeStr()`.
- `personalize()` (a whole story document) is unused until the Sahne stories need it; the test covers it.

## Avatar

The avatar step mounts Sahne.s builder from the lazy `builder` bundle (`app/lib/builder.ts`: learner mode, the kit.s starter set with "More", the `base` set family for the wall); "Start over" asks through `confirmAsk` (`app/ui/sheet.ts`), and the document is normalized as untrusted before it is saved. If the bundle does not load in 8 s the step says so and the learner goes on. Portraits draw through `app/ui/avatar` (`chAvatar`, `Avatar`). `index.ts` gives it the learner.s name (`setLearnerName(studentName)`) for the stand-in. The cast step shows Kerim and the first Season 1 cast heads from `cast.gen.ts` (written by `scripts/avatar-art.ts` from `data/characters`: the characters listed in its `ONBOARDING_CAST`; imported only here, so the SVGs stay out of the entry chunk); its "Start a 10-minute study plan" is the practice feature's `startCustom`.
