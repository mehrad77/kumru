# practice

The session **runner**, every **question type**, and the session **kinds** that use them: a path node's queue, timed and review sessions (the Lab's, the Path's Review sheet, drills, Fix my mistakes), the new-word and catch-up queues, the intro and lesson cards, and the two reports. No tab, no deep link, no server half.

## What it owns

| | |
|---|---|
| Screen | `#session` (a full-screen page, `body.in-session`): `Runner.tsx` (top bar with the close button and the progress bar, the step, the keyboard), `Foot.tsx` (Check, a hint line, Again/Good/Easy, the feedback with Continue, a row of buttons for a report) |
| Questions | `steps/Flash.tsx`, `Choice.tsx` (also *Hear and pick*), `Type.tsx` (*Type it*, *Listen and type*, *Say it*), `Match.tsx`, `Build.tsx` (also *Hear and build*; tap or drag the tiles), `Drill.tsx` (suffix drill), `Learn.tsx` (a new word's teach card), `Mistakes.tsx` (*Spot the right one*, *Fix the sentence*, *All fixed*: Fix my mistakes, from `features/tutor`) |
| Node steps | `steps/Lesson.tsx`: `Intro` ("Up next"), `Read` (a lesson to read), `LiteCard` and `CardQ` (a lite lesson's cards and their fill-the-gap check), `LessonDone`. `steps/Report.tsx`: the node report (stars, XP, goal ring, new words, misses) and the timed/Lab report |
| Session kinds | `kinds.ts`: `startCustom(mins, focus)` (`focus.kind` is `node`, a deck kind such as `flash`/`choice`/`smart`/`drill`/`mist`, or `focus.steps`, a fixed list), `startNode(node)`, the driver (`customStep`, `closeStep`: blocks of one focus until time is up, a node's fixed queue, the report once it ends), `finishNode` (stars, XP, the stored result), the `?only=` dev filter. The reports' data and buttons are built here and drawn by `steps/Report.tsx` |
| Queues | `env.ts` builds the pure model's view of the learner (`queueEnv`, `nodeEnv`, `unitEnv`) from the store, `features/progress`, `drills`, `tutor` and the Path's pickers. `model/queues.ts` (`newWordQueue`, `catchUpQueue`, `newBatch`, `reviewPool`, `nodeWords`, `topicRank`, `sortByKeys`), `model/nodes.ts` (`nodeQueue`, `skillQueue`, `lessonSteps`, `liteQ`, `wordSteps`, `nodeStars`, `missedList`), `model/unit.ts` (`unitInfo`), `model/report.ts` (`confMoved`) |
| Choosing | `prepare.ts`: what a step asks (the card, the wrong options, the tiles), decided once when the step comes up; a step that cannot be asked falls back (flash, choice, type, match to a drill; build to choice; a `listen` without a Turkish voice to `type`) |
| State | `state.ts` (signals: `view`, `foot`, `progress`), `engine.ts` (the imperative API below) |
| Model | `model/answers.ts` (typing and building checks, slips, accept patterns), `gloss.ts` (word hints, meaning clashes), `lessons.ts` (`wordLessonSteps`), `deck.ts` (weights, options, tiles), `letters.ts` (letter bank), `requeue.ts` (the retry rule), `time.ts`, and the queue files above; tests: `practice.test.ts`, and `requeue` in `scripts/kumru_tree.test.cjs` |
| Other | `cards.ts` (the deck, sentence pool, meaning in the learner's language, hints index), `knownNow.ts` (*I already know this*: pool and queue edits, undo), `move.ts` + `ConfMove.tsx` (the confidence change after an answer), `common.tsx` (kind line, meaning, hinted words, answer line), `extypes.ts` (`EXTYPES`, for the Lab's gym) |
| CSS | `practice.css`: the runner, the questions, the reports, the intro and lesson cards. Stay in `app/styles/components.css`: `.session`, `body.in-session .wrap` (needed before the runner loads), `.s-close` (sheets use it), `.q-*`, `.choice(s)` (the placement climb uses them), `.foot-row`; `.ans-conf` is in `app/styles/base.css` |
| Storage | none (progress goes through `features/progress`) |

`kinds.ts`, `env.ts`, `session.ts` and `index.ts` are in the entry chunk (no Preact); `engine.ts` + `Runner.tsx` + the steps load when the first session starts (`startSession` shows the empty screen at once).

## The session contract

```ts
startSession(session: Session): void   // S.session = session; shows #session; draws the first step once the runner has loaded
endSession(silent?: boolean): void     // leaves; without `silent` goes to the Path (the Lab after a Lab session); calls session.onEnd()
setDriver({ step, close }): void       // registered by kinds.ts on every startCustom
```

`Session` (`types.ts`) is `{ kind, queue, total, i, right, wrong, missed, used, newWords, combo, best, cur, node?, fixed?, mins?, start?, endAt?, timeUp?, reported?, lab?, focus?, onEnd?, … }` and each queue entry a `Step`: `{ k, … }`. `k` is a question (`flash choice type listen match build drill learn spot fixit hearpick hearbuild`, plus what to ask: `c` the card, `dir`, `dpool`, `pool`/`spool`, `cards`, `sent`, `hint`, `audio`, `label`, `retry`, `n`/`of`, `dtype`) or a node step (`intro read card cardq lessonDone`, drawn by `steps/Lesson.tsx`), or `report` (`data` and `bar`, drawn by `steps/Report.tsx`). `Driver.step()` is asked for every step and returns the `Step` to draw; `Driver.close()` is the close button (return true when you took over, e.g. a report: a timed or Lab session with answers ends with its report, anything else just ends).

A step that sets its own footer or gives feedback uses the runner's imperative API (`engine.ts`): `footCheck(label, ready, onCheck)` (returns the function that re-asks `ready`), `feedback(ok, head, ...body)` (counts the answer, XP and combo, shows right/wrong with Continue), `markMiss(tr, meaning)`, `renderStep()` / `next()`, `refreshProgress()` (a timed session's clock), `praiseEl()`; a report sets `foot.value = { t: "buttons", items }`.

Rules the runner keeps: a wrong path step comes back three steps later at most twice (`requeue`), and a retry counts for neither stars nor XP; the combo cheer at 3, 5, 8, …; answers go through `features/progress` (`bumpConf`, `recordCard`, `recordEx`, `recordDrill`, `addXp`); Enter checks or continues, 1 to 4 pick an answer, Escape ends the session; switching tab ends a session (`onLeave`). A report names its own count in the top bar (`Step.bar`) and marks the session `reported`, so the close button on a report just ends it.

Dev switches (`app/host/dev.ts` sets `window.__DEV`): `?only=build,type` limits a session's question kinds and makes a node loop its skill; `?skill=sk_id&part=N` and `?treedone=N` are the Path's (`devAutostart`).

## What other features call

Other features import `startCustom`, `startNode`, `newWordBatch`, `catchUpWords`, `topicRank`, `sortByKeys` and `unitInfo` from `index.ts` (Path, Lab, drills, tutor, onboarding).

## What it calls in the path feature

The Path's word and skill-tree pickers, which the node queues and `finishNode` use: `coreWords`, `secWords`, `secLessons`, `unitLessons`, `skillReview`, `treePlacedWords`, `treeWordIds`, `nextUnitIdx`, `treeSyncPos`, and `openReviewSheet` (the report's "Review again"). `finishNode` still writes `S.tp` (the tree's marks) itself.

## Uses of other features

`progress` (answers, confidence, XP, `myLevel`), `path` (above), `drills` (`DT`, `makeDrillQ`, `drillOptions`, `drillWhy`, `pickDrillType`), `grammar` (`mEl`, `openLesson`, `quizLine`, `renderBlock`), `tutor` (`mistakes`, `pickMistake`, `mistakeSeen`, `sameSent`, `loadFixNote`, `loadExplain`), `words` (`showGloss`).
