# Kumru progress: words, lessons, placement and jumps

How the notebook decides what a learner knows and where they stand on the path. Every feature that changes a word's state, a lesson's state or the learner's position follows these rules. Read this before touching placement, the path, practice weighting or any "I know this" control.

Two principles:

- **A learner moves forward only by showing they can.** Nothing places a learner past a unit without a test.
- **A word's state comes only from what happened to that word.** A word the learner was never shown keeps its state, whatever unit they are on.

## 1. Word confidence

Each learner has a confidence score per word, `progress.conf[<card id>]`, an integer from 0 to 15. It replaces the old `box` levels (0–5). A missing entry is 0.

| Event | Change |
|---|---|
| Right answer: choice, type, listen, *Good* flashcard, a pair matched without a mistake | +2 |
| *Easy* flashcard | +3 |
| A typed or letter-tile answer with a forgiven slip (headed *Almost*) | +1 |
| Wrong answer, *Again* flashcard | −3 |
| A pair matched after a mistake in match pairs | −1 |
| *I already know this* | lifts the word to 10 (confident) |
| Placement or jump-test answer | right +2, wrong −3 |

A correct built sentence (exact or an accepted variant, not a swap) adds `near` (+1) to each word of it that the learner has already met and that is not yet confident (`glossSegments` finds the words; unmet words are never raised). A forgiven slip (`diffSlip` in app/features/practice/model/answers.ts) is one wrong, missing or extra letter, two letters swapped, or missing Turkish letters (ç, ğ, ı, ö, ş, ü typed as c, g, i, o, s, u): the missing-letter case counts at any length, the others need a word of 4+ letters, with one edit per word (two from 9 letters) and never in a word of three letters or fewer; the number of words must match. It counts as right (stats record a right answer and `stats[id].n` counts the slip), never requeues, and the feedback shows what the learner wrote and the fixed text with the slipped letters dotted-underlined. A built sentence with two neighbouring words swapped (four or more words) is *Almost* too but changes no confidence.

The score is clamped to 0–15. Answer counts (`progress.stats`) are still kept beside it and still decide *weak*: a wrong last answer, or under 67% right.

| Band | Score | Meaning |
|---|---|---|
| new | 0 and never answered | Not met yet |
| learning | 1–4, or 0 after answers | Met, not yet reliable |
| known | 5–9 | Counts as known |
| confident | 10–15 | Known; almost never practised |

**Known** (score 5 or more) is what counts in unit percentages, the *Words known* stat, and skipping a word in new-word batches.

**Practice weight.** Practice picks words at random, weighted by:

- 0.15 at score 10 or more;
- otherwise `1 + (10 − score) × 0.8`, plus 3 if weak, plus 1.5 if never answered.

A confident word still turns up now and then, and a weak or low-score word turns up often.

A words node does not draw at random: `wordLessonSteps` names the word each check, match and write-it step asks, so every new word of the lesson (up to 8) is asked three times. A lesson first warms up on up to 4 earlier words (`skillReview`: the skill's earlier parts, then the skills before it; weakest first, never a "confident" word), one multiple-choice question each; those answers count like any other. After the write-it steps a lesson asks up to two sentences from the skill's `sentences` (the books' reading practices) as *Build the sentence* steps, and ends with a match round that mixes its last words with earlier ones. Hints (the dotted-underlined words in the tree's sentence steps) cost no XP or confidence. A missed sentence comes back once more; sentence answers are recorded under the card's own `stats` entry and never change a word's confidence. A miss is asked again three steps later (or last, in a short lesson), at most twice; a retry ("Once more") is practice only: it records no answer counts, no exercise totals and no confidence change (`retrying()` in app/features/progress/api.ts; an *I already know this* claim still works), and counts for neither stars nor XP. A teach card records the word as met (`stats[id].v`, shown as *learning*), which is not an answer: until a word is answered it stays new for Catch up.

**A claim is trusted but never final.** *I already know this* (on a new-word card, and on a flashcard or multiple-choice question whose word is still below 10) lifts the word to 10 (never lowers a higher score), so it is confident at once: it leaves the rest of that lesson, is not offered as a review warm-up and almost never comes up in practice (Undo restores it for 5 seconds). Two wrong answers (10 − 3 − 3 → 4) bring it back below known.

## 2. Only shown words are scored

Placement, jump tests and moving the learner's position never change a word the learner didn't answer. Skipping or placing past a unit leaves its words new until they are shown in a lesson, practice, a checkpoint or a test.

## 3. Grammar lessons

Lessons stay learned or not learned (`progress.gram`); they have no score. A lesson becomes learned:

- in its path node, with at least 50% right in the lesson's check;
- in placement or a jump test, only when at least two of its drills were asked and all were right, its unit's probe passed, and the unit lies below the learner's new position;
- by *Mark as learned* on the lesson page, which also undoes it.

## 4. The learner's position

`progress.pos` is the learner's unit on the path. Units after it are locked, and units before it are open.

| How the position changes | Rule |
|---|---|
| Onboarding placement | The quiz suggests a unit. The learner may start there or lower (*One unit earlier*, *Choose myself*), never higher. |
| Checkpoint | Passing the current unit's checkpoint completes it and moves the position to the next unit. |
| *Jump here* | The only way past the current unit without its checkpoint. It needs a test (section 5). |
| Retaking placement (Profile) | Same as onboarding. It can move the learner down, or up to the suggested unit. |

**Placed past** is a unit before the position whose checkpoint isn't passed. It stays open: its lessons, word batches and checkpoint can all be done, and passing the checkpoint marks it done. Its words keep their own scores and are offered as catch-up (section 6).

## 5. Jump here

A locked unit shows **Jump here**. To jump from the current unit C to the target T:

1. A sheet explains the test: a short check of the units being skipped, a few minutes.
2. The adaptive probe from placement runs within C…T−1. It starts at T−1 and drops one unit after each failed probe, with at most 5 probes. A probe is about 6 of the unit's words below score 10 (so claimed or half-learned words are tested too, and a claim can't pass a probe on its own) plus up to 4 suffix items. A unit with nothing left to ask passes. It passes with 5 of 6 words and 75% of the suffix items right (`plPass`).
3. **Result:**
   - T−1 passed → move to T;
   - otherwise, a lower unit above C passed → offer *Jump to Unit X* or *Stay*;
   - nothing passed → *Not yet*, and the learner stays at C.
4. Answers score their words (section 1), and lessons follow the rule in section 3. The jump is recorded in `progress.placed.jumps[]` as `{from, to, target, probes, at}`.

There is no jump backwards: earlier units are always open.

**From the book.** When the learner marked a unit done in Notebook (both books) and Kumru's unit isn't done, the Path offers it (`app/features/yeni/model/book.ts`, `bookOffer`): the current unit or skill-tree section gets *Take the checkpoint*, a unit ahead gets the tested *Jump here* / *Test out*. Finishing the book never moves `pos` by itself, and the offer starts only what the Path's own buttons would start after their lock checks. `/unit/<REF>` opens a unit the same way.

## 6. Catch-up

New words from placed-past units are not mixed into the general new-word queue. The Review sheet shows a **Catch up** row while any remain. It teaches them lowest unit first, in batches of 12 (the same as *New words*) as flashcards. The general *New words* queue skips placed-past units.

## 7. Migration

A saved progress doc older than `v:4` is converted once:

- `conf[id]` is set from `[0, 2, 4, 6, 8, 10][box[id]]`, so every word that was known (box 3+) stays known (6+), and every word that wasn't stays below 5;
- `box` is left in the doc, unread, so a page from before the change still opens.

## 8. The skill tree

For the levels `data/path` covers (drafted for A1, A2 and B1) the road is a tree of sections and skills instead of the book's units (`progress.tree`, see AGENTS.md). The principles still hold: a learner moves forward only by showing they can, and a word's state comes only from what happened to that word.

**Skill states.** `done` (every part finished, or knowledge shown at migration), `cur` (the one next step), `locked`, and `placed`: skipped by a placement or a test. A placed skill stays open to replay and never blocks the road, and its words keep their own scores and wait under **Catch up** (`treePlacedWords`). A section is passed by its checkpoint, or placed past when all its skills are placed.

**Where a skill sits in the book** (`skillPos`, a unit index 0–17): the highest unit of its lessons, or for a words skill the 80th-percentile unit of its words. It only matters when placing.

**Marks are written only at these moments:**

| Moment | Rule (`treeMark`) |
|---|---|
| First time the tree shows (`treeMigrate`, once, then `tree.mig`) | A skill whose lessons are learned and 80% of whose words are known becomes done (`how: "migrated"`). Any other skill before the learner's unit becomes placed. |
| Onboarding placement, retaking it, or a unit *Jump here* (`applyPlacement`) | Skills before the new unit become placed. |
| Moving the position back (Profile, retake) | Placed marks that no longer lie before the position are dropped; finished and tested skills stay. Moving it forward by hand places nothing. |
| *Test out* succeeds (`testOut`, `applyTreeTest`) | The sections from the current one up to the one before the target are marked tested (`how: "test"`), as are their unfinished skills. |

Nothing else places a skill: finishing steps never does.

**Test out.** A locked section shows **Test out**. It runs the same adaptive probe as *Jump here* (section 5), one section per step, over the sections from the current one to the one before the target (`runPlacement` with `plSectionItems`): about 6 of the section's words below score 10 plus up to 4 suffix items of its lessons, passing at 5 of 6 words and 75% of the items. A lesson becomes learned only with two clean drills, a passed section probe and the section below the new one. Results mirror section 5 (*open the target*, *start at the highest passed section* or *Not yet*). Attempts are kept in `tree.tests`. Answers score their words as in section 1.

**The old position.** `progress.pos` stays for the friends list, the tutor and the unit path of A2 and B1. With the tree it follows the first unfinished skill forward only (`treeSyncPos`) and never places a skill itself.

**Catch-up and new words.** With the tree, the words of its skills are taught by their skills: the Review sheet's *New words* draws only from words that are in no skill, and *Catch up* offers the words of placed skills first, then the unit-based placed-past words that are in no skill. *Unit words* in the Review sheet opens every unit's word list.

**Going live.** A level is drawn from the tree only when its sections are no longer marked `draft` in `data/path`, for everyone (`treeSecs`); until then only editors and `?tree` see it. A level goes live all at once.

## 9. Lab practice

The Lab tab (Kerim's lab, `app/features/lab`) is practice the learner chooses. It follows the word rules of section 1 and none of the path rules:

- **Words move as usual.** Right, wrong, *Again*, *Good*, *Easy*, forgiven slips and *I already know this* change confidence and answer counts exactly as in a lesson, so a word drilled in the Lab can become known or weak there.
- **No XP, no active day.** A Lab session (`focus.lab`) skips `addXp` and `bumpDay` (`inLab`, app/features/progress/api.ts), so it never fills the daily goal, extends the streak or counts in the weekly leaderboard, and it is not written to the study log (`progress.log`). Its report shows how many words moved up or down instead of XP.
- **No position, no stars.** The Lab never places a skill, passes a checkpoint, learns a lesson or moves `progress.pos`.
- **Prove it** checks claims. A *claimed* word is one at confidence 10 or more with no answers on record (`cardTries` is 0): the lift from *I already know this* before the word was ever answered. Prove it asks up to 12 of them once each, typed from the meaning (letter tiles in recall mode) or picked for phrases of three words or more. A right answer adds +2 and a wrong one subtracts 3 (10 → 7, still known; a second miss brings it to 4). Answering gives the word answer counts, so it leaves the claimed pool whether it was right or wrong; no claim flag is stored.
- **Mistake bank** is the words whose last answer was wrong (`stats[id].l` is 0).

## Where it lives

| Rule | Code |
|---|---|
| Score steps, bands, `isKnown` | `CONF_STEP`, `confAdd` (app/lib/progress.ts), `confOf`, `confBand`, `bumpConf` (app/features/progress/api.ts) |
| Practice weight | `weightOf` (app/features/practice/model/deck.ts) |
| *I already know this* | `markKnownNow` (app/features/practice/knownNow.ts) |
| Placement and jump probe | `applyPlacement`, `scoreRecs` (app/features/placement/apply.ts), `plNext`, `plPass` (app/features/placement/model/placement.ts) |
| *Jump here* | `jumpHere` (app/features/path/sheets.ts), a bounded placement probe |
| Catch-up | `catchUpQueue`, `newWordQueue` (app/features/practice/model/queues.ts), `openReviewSheet` (app/features/path/sheets.ts) |
| Migration | `boxToConf` (app/lib/progress.ts), `applyProgress` (app/features/progress/api.ts) |
| Skill tree marks, placed skills, Test out | `treeMark` (app/features/path/model/tree.ts), `treeMigrate`, `treeSync`, `treeSyncPos` (app/features/path/course.ts), `testOut` (app/features/path/sheets.ts), `applyTreeTest` (app/features/path/model/testout.ts), `plSectionItems` (app/features/placement/items.ts) |
| Lab practice (no XP, no active day), Prove it | `inLab`, `bumpDay`, `addXp` (app/features/progress/api.ts), `claimedWords`, `proveSteps` (app/features/lab/model/prove.ts), `labStart` (app/features/lab/sources.ts), `customReport` (app/features/practice/kinds.ts) |
| Tests | `scripts/kumru_onb.test.cjs`, `scripts/kumru_tree.test.cjs`, `app/lib/progress.test.ts`, `app/features/progress/api.test.ts`, `app/features/placement/model/placement.test.ts`, `app/features/path/model/tree.test.ts`, `app/features/practice/model/practice.test.ts` |
