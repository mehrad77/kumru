# words

What the app shows about a single word. No server half.

| | |
|---|---|
| Tabs | none |
| Slots | fills `profileCards` (order 5): `NotesCard`, the count of notes and sentences, which opens `Notes` as a page (`ui/page.ts openPage`) |
| Deep links | `card` (`/card/<id>`, and the old `#card=<id>`, `WebFeature.open`): `CardSheet.tsx` in a sheet, with the practice chip and a link to the word's page in the reader |
| Screens | `CardSheet.tsx`, `GlossPop.tsx` (the tap-to-translate popup: Persian and English meaning, the card's practice chip, a link to the reader), `PracticeChip.tsx` (confidence dots, tries and accuracy), `Notes.tsx` ("My notes", the card on Profile and its page: the starter class notes and example sentences, read-only: contributions and votes are gone, the host serves no such collections) |
| State | `state.ts`: `noteKind` (remembered under `kumru:noteKind`), `noteLimit` |
| Model | `model/text.ts`: `trLow` |
| CSS | `words.css` (`#pf-notes`, `.item*`, `.more`). The popup box and the dotted `.gw` words are in `app/styles/components.css` while the lesson page and the practice questions use them |

`gloss.ts` and `sheets.ts` are DOM only (entry chunk); Preact and `GlossPop.tsx` / `CardSheet.tsx` load when first used.

Other features use `index.ts`: `trLow`, `showGloss` (the practice questions' dotted words), `closeGloss`, and the tutor reads lesson titles from the grammar feature (`lessonTitle`, `lessonOrder`, `openLesson`).
