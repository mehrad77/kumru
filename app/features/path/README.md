# path

The **Path** tab (second after Stories, the home tab): the learner's road, opened scrolled to the next step (the "Start" node), and Review. For the levels the skill tree covers (`data/path`: all of A1, A2 and B1 once the sections lose `"draft": true`) the road is the tree's sections of skills, each skill an isometric puck, a checkpoint closing every section; for any other level it is the book's units, each a winding road of lesson, words, checkpoint and review steps. The rules of both are in `docs/PROGRESS.md` (sections 5 and 8). No server half.

| | |
|---|---|
| Tab | `path` (`/path`, order 10; `PathTab.tsx` loads lazily) |
| Slots | provides `pathBanners` (drawn under the stats pill; the stories feature's "out today" banner and Notebook book box fill it). Fills none |
| Deep links | `/unit/<REF>` is the yeni feature's; it calls `bookPathReveal` here |
| Screens | `PathTab.tsx` (loading state, then `TopBar`, the `pathBanners` slot, a `Level` heading per level and its sections; the first heading carries Review and "What the steps mean"; each time the tab opens it scrolls the Start node to the middle), `TopBar.tsx` (the stats pill: streak, goal ring, XP; `melt.ts` melts it into the app bar on scroll), `Units.tsx` (`UnitSection`, `NodeItem`), `Tree.tsx` (`SecSection`, `SkillItem`, `CpItem`), `Puck.tsx` (the isometric puck and its badge) |
| Sheets | `sheets.ts` opens them (DOM only: the sheet appears at once, its body loads): `sheets/UnitSheet.tsx` (a unit's words and lessons), `ReviewSheet.tsx` (5/10/15 minutes; weak spots, suffix drill, new words, catch up, unit words, quick review, Fix my mistakes), `SkillSheet.tsx`, `Legend.tsx` ("What the steps mean"), `JumpSheet.tsx` (Jump here) and `TestOutSheet.tsx` (Test out), both running placement's `Climb`, `BookSheet.tsx` (every unit's word list), `WordRow.tsx` |
| State | `state.ts`: `S.tree` as a signal (the `path` collection, set by the boot), `openUnits` (which units and sections the learner opened; the current one is always open, and the rest fold again when the learner leaves the tab: `onLeave` in `index.ts`). The learner's marks are the progress feature's (`S.pos`, `S.nd`, `S.learned`, `S.tp`) |
| Course | `course.ts`: a unit's words and lessons (`coreWords`, `unitLessons`), the road (`unitNodes`, `buildPath`, `nextUnitIdx`), the tree (`treeSecs`, `useTree`, `buildTree`, `skillParts`, `secWords`, `secLessons`, `skillReview`, `treePlacedWords`, `treeWordIds`, `treeSync`, `treeSyncPos`, `startSkill`, `startTreeCp`), `migrateProgress` and `watchMigration` |
| Model | `model/road.ts` (`unitNodes`, `buildPath`, `nextUnitIdx`, `wordNodeCount`), `model/tree.ts` (`skillParts`, `treeFlow`, `skillPos`, `treeMark`; with its test), `model/testout.ts` (`applyTreeTest`: what a finished Test out does; `testout.ts` calls it), `model/book.ts` (`bookPathState`), `model/companion.ts` (Kerim's line from the learner's day) |
| Other | `companion.ts` (`companionLine`, shared with the Profile header), `book.ts` (what Notebook book box asks: `bookPath`, `bookPathAct`, `bookPathReveal`), `testout.ts`, `icons.ts` (`SK_ICON`, a plain literal: `tools/kumru_path.py` reads it), `melt.ts` |
| CSS | `path.css` (`pt-*`, `sk-*`, `us-*`, `lg-*`, `.bk-flash`), Kerim's own rules are `app/ui/kerim/kerim.css` (the Sahne gallery reads them). The Review sheet's option rows (`.rv-o`) are in `app/styles/components.css`: the Lab's sheets use them |
| Storage | `kumru:tree` (`1` shows the tree to everyone, `0` hides it from editors; `?tree` / `?tree=0` set it), `kumru:reviewMin` (the Review sheet's last length) |

## How it stays live

`PathTab` reads `rev` (progress saves), the redraw tick (`rerender()` after a collection snapshot), the content-loaded flags, `S.tree` and `openUnits`, so a saved answer, a placement or a Test out redraws it. While a session is on screen or another tab is showing, it keeps what it drew (no work per answer); the tab switch and the end of a session draw it again.

Old progress is moved onto the path by `watchMigration` (an effect started with the feature): `migrateProgress` once for documents without `v:3`, and `treeMigrate` once per learner when the tree first loads.

## Dev switches

`?tree` / `?tree=0` (the tree, remembered), `?skill=sk_id&part=N` (opens that skill's part as soon as the Path draws; `devAutostart` in `PathTab.tsx`), `?treedone=N` (`app/host/dev.ts`, marks the first N steps done), `?learner`, and `?only=` (the practice feature's).

## What other features call

`index.ts`: `coreWords`, `unitLessons`, `secWords`, `secLessons`, `skillReview`, `treePlacedWords`, `treeWordIds`, `nextUnitIdx`, `treeSyncPos` (the practice feature's node queues and `finishNode`), `openReviewSheet` (the report's "Review again"), `treeSecs`, `treeSync`, `useTree`, `closeUnits` (placement), `weakPool` (the Lab), `companionLine` (the Profile header), `bookPath`, `bookPathAct`, `bookPathReveal` (the yeni feature).

## What it uses

`practice` (`startNode`, `startCustom`, `unitInfo`, `newWordBatch`, `catchUpWords`, `topicRank`, `sortByKeys`), `progress`, `placement` (`loadClimb`, `applyPlacement`, `scoreRecs`, `plSectionItems`), `grammar` (`openLesson`), `drills` (`openDrillSheet`), `tutor` (`mistakes`, `startMistakes`), `profile` (`currentStreak`).
