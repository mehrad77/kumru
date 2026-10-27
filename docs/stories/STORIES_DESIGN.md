# Stories: design

What the Kumru story series is for, how learners use a story, and which words and grammar a story may use. The index of all story docs is `README.md`. This series replaces the 16 A1 stories `s01`–`s16` and their cast, which are retired. The data fields are in `STORIES_SCHEMA.md`. The *page* side (the reader, publishing) is not built: the old reader is removed from the app, and the new one comes with M8 (`ROADMAP.md`).

Status: **v1.** The stage and the story adapter are built (`sahne/packages/sahne`, `sahne/packages/sahne-story`) and s1e01 is written as a draft, but no story is in the app yet (`README.md`). Items marked **Open** are not decided. Items marked *proposed* are defaults that can change during review.

## 1. Principles

### Purpose
- **A graded reader.** A story is easy, enjoyable reading that recycles words and grammar. It is independent of the book: if a story matches a unit of the class's book, that is a bonus, not a requirement.
- **About 95% known words.** At most about 1 word in 20 is new to a learner at the story's position. New words are glossed through tap-to-translate.
- **Done** = read to the end **and** quiz passed (3 questions, stars). Flash practice and re-reading are extras.
- **Culture is shown, never explained.** Tea is offered, shoes come off, someone says *Kolay gelsin*. There are no culture notes.

### Sizes

| | Episode (Mon–Fri) | Special (weekend) |
|---|---|---|
| Role | One scene, one small event | Ties the week together: a trip, a party, a problem solved; reuses the week's words and grammar |
| Target words | 5–8 | 10–12 |
| Grammar spots | 1 (Kerim) | 1–2 |
| Choices | 1–2 | 2 |
| Lines, A1 *(proposed)* | 10–14, mostly one sentence per turn | 20–28 |
| Lines, A2 *(proposed)* | 14–18, 1–2 sentences per turn | 26–34 |
| Lines, B1 *(proposed)* | 16–22, 2–3 sentences per turn | 30–40 |

As the level rises, stories don't just get longer: each turn holds more sentences, and characters talk more naturally.

The release calendar (one track, the weekly rhythm, the launch) is in `STORIES_CALENDAR.md`.

### Learner stand-in and personalization
- The learner is an **international student who has just arrived** in Istanbul. They stay with an old friend, Farzad, until they find their own flat, and study at a TÖMER course. The first story starts at **IST airport**, where Farzad picks Nima up.
- **Phase 1 personalization is the name and hometown only.** The stand-in's name and default hometown (Tehran) are swapped for the learner's own, as `personalizeStr` does today. This keeps stories complete for learners without the AI tutor.
- **No gendered words for the stand-in.** Turkish and Persian have no gendered pronouns. English lines and notes refer to the stand-in by name or "you", never he/she.
- **Language-neutral stand-in (decided 2026-10-09).** Only the hometown token says where the stand-in is from. The stand-in's lines, and lines about the stand-in, never claim a country, a nationality or a language ("İranlıyım", "Farsça gibi!"), because those would be wrong for a learner from elsewhere. The Persian bridge lives in the `fa` translations and in the Persian-speaking cast. A1's two kept exceptions are listed in `STORIES_A1.md`, *Season arc*.

### Free tier and plus tier
Every story is fully readable without AI. The AI tutor (plus) adds to a story but never replaces part of it.

| Free (everyone) | Plus (AI tutor, later) |
|---|---|
| Every story: text, audio, tap-to-translate, quiz, stars | **Talk with a character** after the story (AI scenario, one per weekly arc) |
| Kerim's grammar spot and the linked lesson | **Personal lines:** characters mention the learner's job, hobby and reason for learning |
| Flash practice of the story's words | **Ask Kerim** about any line, word or grammar point |
| A **scripted follow-up dialogue** after each story, with choices (no AI) | |

### How learners reach stories
- The Home "today's story" card is the daily hook.
- An archive or library, browsed by date, district, character, level and topic.
- A daily "new story" notification, if the platform allows it.
- The existing **See it in a story** links from grammar lessons and word cards.
- **Shared reactions and comments** on each story, so the daily episode feels social.

### Interaction inside a story
- **The learner says their own lines** (decided 2026-10-08). Every line of the stand-in is chosen by the learner, even when there is only one option. It appears as a reply card with a *Söyle* button, the same card a real choice uses. Learners pick their line on every turn, so they are used to choosing when a real choice comes. Details in `STORIES_STAGE.md` §7.
- **Choices:** 1–2 per episode, of three kinds, about a third each over a season (decided 2026-10-09): **polite** (polite vs blunt, *sen* vs *siz*, the right phrase for the moment), **meaning** (showing Nima understood what was said, or picking the right form) and **action** (what to do: who to ask, where to go, whether to help). Characters react. The plot never branches, but a few picks are **remembered** later in a line or two (callbacks), and every pick moves the learner's hidden **warmth** with a character, which shows only in Kerim's album at the end of the season (`STORIES_SCHEMA.md` §4.5, §4.7, §4.8).
- **Season threads:** each season has a spine (a want the stand-in carries across weeks) and a few threads that run across episodes, including setbacks that last more than one story. A1's are listed in `STORIES_A1.md`, *Season threads*.
- **Season arc (decided 2026-10-09):** the stand-in also changes across a season. The arc follows Truby's *Anatomy of Story*: a weakness every learner shares, a need, a desire, an opponent (comic, never a villain), setbacks, a battle, and a self-revelation shown in the last story, never told. It is decided from the end backwards, before the briefs, and each beat is one line or one staging moment. Choices still never branch: where the arc needs Nima to act, every option leads there. A1's is in `STORIES_A1.md`, *Season arc*.
- **Quiz:** 3 questions on **comprehension** (who, what, where) and the **target words**. Grammar is not quizzed. Kerim's spot and the lesson teach it.
- **Audio:** browser TTS for now. Later, a distinct voice per character.
- **Translation fade** *(proposed)*: the default depends on level, and the learner can always override it.
  - A1: line translation on.
  - A2: line translation off, tap-a-word on.
  - B1: tap-a-word only.

## 2. Words and grammar

- **Stories follow the class (decided 2026-10-09).** The cohort does one unit of its book a week. Week N of A1 is Ünite N, and the last two weeks review. A story may use any grammar and words from its week's unit and earlier: the books's KELİME LİSTESİ and the workbook's words for those units. Target words come from the week's own unit. The weekly map is in `STORIES_A1.md`, and the same rule applies to A2 and B1 when they are planned.
- **Grammar cap.** Each story names 1–3 grammar lessons (`lessons`), all from its week's unit or earlier. A form from a later unit appears only as a fixed, glossed chunk (*Hoş geldin*, *Afiyet olsun*, *Kolay gelsin*).
- **Words come from the cards.** Target words are existing cards, stored by card id. Story-only words (place names, a specific dish) are allowed with a gloss and may become cards later.
- **Recycling.** Each target word reappears in **at least 2 later stories within 2 weeks**. The weekend special reuses the week's words and grammar. A coverage map (word × story, lesson × story) makes this checkable.
- **Book link.** `ref` is the week's unit (e.g. `A1_3`). It is a constraint now, not only metadata.
- **Known words** for the 95% rule (decided): a word is known in week N if its word list is from Ünite N or earlier, or if the books or workbook pages of Ünite 1–N use it. Başlangıç doesn't count, because the class skips it. The page map is `STORIES_SYLLABUS_A1.md`.

## 3. Open items

1. A **versatile daily-story system:** possibly unlimited daily stories, each with its own mini-arc, on top of the main arc; and whether `season` means level or arc (`STORIES_SCHEMA.md` §2 proposes level).
2. The size defaults marked *proposed* (lines per level, translation fade).
