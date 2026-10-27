# drills

The suffix drills: nineteen drill types (plural, question, the five cases, "my", the verb tenses A1 to B1), the engine that builds a question and its wrong options and explains the answer, and the picker sheet. No tab, no server half. A drill session is a practice session (`startCustom` from the practice feature).

| | |
|---|---|
| Screens | `DrillSheet.tsx` (the picker, opened by `openDrillSheet(mins, {lab, verbs})` through `ui/open.ts` `openIsland`: "Mixed · weakest first", then the noun and verb chips), `DrillGrid.tsx` (the chips: a drill's name and its accuracy; the Lab's verb gym draws it too, through `loadDrillGrid` and `ui/Lazy`) |
| Code | `start.ts` (`startDrillSession`: a timed session through the practice feature's `startCustom`, with `again`; `startDrill`: ten minutes from a lesson page) |
| Model | `model/drills.ts` (`DT` the drill table, `myDrills(level)`, `pickDrillType`, `makeDrillQ`, `drillOptions`, `drillWhy`, `vgroup`, `lessonDrillTypes`, `lessonDrillStart`, `drillTally`, `drillChip`) with its test. It builds forms with `app/lib/morphology.ts` |
| CSS | `drills.css` (`.dgrid`, `.dchip`) |
| State | none of its own: counters are `S.drill` (progress feature: `drillAcc`, `recordDrill`) |

Each drill type names the grammar lesson that teaches it (`DT[].lesson`). `uv run tools/grammar_lessons.py --check` reads the table and fails when one of those ids no longer exists.

## What other features call

The path feature's Review sheet imports `openDrillSheet`; the practice feature builds a node's checks from `DT`. The practice feature's `drill` question type imports `makeDrillQ`, `drillOptions`, `drillWhy`, `pickDrillType`, `vgroup` and `drillAcc` from `index.ts`.

## What this feature calls

Nothing about sessions: `startCustom` is the practice feature's.
