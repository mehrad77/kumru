# Stories: authoring

How a story goes from an idea to the `stories` collection: the process, the brief template, the review checklist. The index of all story docs is `README.md`. The rules a story must follow are in `STORIES_DESIGN.md`; the data structure and the validator are in `STORIES_SCHEMA.md`.

## 1. Process, brief and review

### Process
1. **Season arc and outline.** First the stand-in's arc, decided from the end backwards: the weakness and need, the desire, the opponent, the setbacks, the battle and the self-revelation (`STORIES_DESIGN.md` §1, *Season arc*). Then the outline: the weeks with their units and grammar, the season threads and calendar events (`STORIES_A1.md` for A1).
2. **Weekly arc:** about 1 paragraph. The week's grammar, its 30–40 target words, the special's event, which characters appear and who carries the plus-tier AI scenario.
3. **Story briefs:** one per story (template below). **You outline; Claude writes** the Turkish, English and Persian.
4. **Checks:**
   - the validator (`node sahne/packages/sahne-story/stories.ts`, `STORIES_SCHEMA.md` §10), which also runs the lints of step 6;
   - an independent **second Claude pass**, which reads the story against this guide and the brief without seeing the drafting conversation;
   - **your review** of the Persian and the story quality.

   A native Turkish check is added later; none is available now. Until then, specials and any sentence the second pass flags get extra care.
5. **Buffer:** at least **2 weeks** (~12 stories) are written, checked and loaded ahead of their release dates.
6. **Draft and lint:** a story is written in Kumru's data, `data/stories/<id>.json`, with `"draft": true` until the owner's review (s1e01 is the example). Characters live only in `data/characters/<id>.json`, the cast roster and the generic extras together (an extra is `kind: "extra"`, written by `node sahne/packages/sahne-story/cast/extras.ts`, never by hand): a story names them in `cast` and `extras`, and the check and the gallery read them from there. Places are shared, in `data/places/<id>.json`. `sahne/packages/sahne-story/paths.ts` names these folders for every reader. No test needs writing for a story: `test/drafts.test.ts` runs the whole story check (`stories.ts`, with the lints of `STORIES_STAGE.md` §4) on every story, and `test/play.test.ts` plays every option of every choice; `pnpm sahne check` runs both. The gallery plays every story by itself (`pnpm sahne dev`, then `#/stories/<id>`).
7. **Load:** `pnpm check` (Kumru's gate, `pnpm check`) runs the story check and the extras' check too, and `uv run scripts/kumru_data.py --check` checks the story's lessons, words, cast and place against the app's other collections. A story stays `draft: true` until the owner's review.

### Story brief template
```
id           s1e01                 (season + episode; never changes)
releaseDate  2026-09-07            (rescheduling changes this, never the id)
kind         episode | special
level · ref  A1 · A1_1
arc          short name of the week's arc
place        district + spot (backdrop id)
cast         2–4 ids (episode), ≤ 6 (special); sen/siz for each pair
premise      2–3 sentences: what happens, what small problem or joke drives it
grammar      lessons: [...]; Kerim's spot covers: ...
words        5–8 target card ids (10–12 for a special); recycled words from earlier stories
choices      1–2: [polite | meaning | action], the situation and what the options contrast;
             a flag the `ok` pick sets, if a later story remembers it
quiz         3 questions: comprehension + target words
follow-up    scripted dialogue: who, what the learner practises (free tier)
calendar     any real-world date or season it must reflect
arc beat     the season-arc step this story carries, if any (weakness, setback, battle, …)
```

### Story doc
The full data structure is in `STORIES_SCHEMA.md`: stories, steps and staging, characters, places, and learner progress. In short:
- **New:** `releaseDate`, `kind`, `arc` (with the week's `mechanics`), `ref`, `followUp`, the staging fields on lines, `beat` and `act` steps, and a `places` collection.
- **Changed:**
  - `words` becomes card ids, not Turkish text;
  - `spot.lesson` must be a current `g_<lv>_<unit>_<slug>` id;
  - `chapter` and `order` are replaced by `releaseDate` and `id`.
- **Removed:** the old line fields `act` and `fx`. Gestures are `do`, sounds are `sfx`, and the new `act` step is something the learner does.
- **Season:** the season is the level (`s1` = A1). The weekly arc has its own `arc` field.

The page changes these imply (archive view, date gating, reactions, the new name token for `personalizeStr`, new character art) are a separate code pass: the plan is in `ROADMAP.md` (M8).

### Review checklist
- [ ] Level fit: only allowed grammar (strict at A1), sentence length within the level's band.
- [ ] Known-word ratio ~95%; every new word glossed in `gl`.
- [ ] All target words used at least once; recycled words from the past 2 weeks present.
- [ ] Kerim's spot matches a lesson in `lessons`, and the example is from the story.
- [ ] *sen*/*siz* consistent with the relationship table; no gendered English for the stand-in.
- [ ] The stand-in's lines hold for any hometown: no country, nationality or language claimed for Nima (`STORIES_DESIGN.md` §1).
- [ ] An `arc beat` matches the season arc, and is one line or one staging moment.
- [ ] Staging fits the text: the props a line names are on stage, *bu/şu/o* match the distance, *var/yok* and numbers match what is shown, and every mechanic used is in the week's `arc.mechanics` (`STORIES_STAGE.md` §4–5).
- [ ] Any learner mistake is a common one, made by a foreign classmate, and corrected.
- [ ] Culture shown, not explained; calendar details right for `releaseDate`.
- [ ] Persian natural (not a word-by-word translation); English plain.
- [ ] Choices contrast a real point of their kind (polite, meaning or action); every option gets a reaction; a remembered pick has an `if`/`unless` pair later.
- [ ] The stand-in never has two lines in a row (each turn is one reply card), and gets a turn within the first four lines.
- [ ] Quiz: answers are clearly in the text; the "why" quotes the line.

### Sample brief
The first finished brief is `s1e01` in `STORIES_A1.md` (Week 1). Briefs are written day by day there, each one from four questions to the owner.

## 2. Open items

1. A **native Turkish reviewer**, when one is available.
