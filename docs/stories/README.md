# Kumru stories

The Kumru story series: one short illustrated story a day, in step with a TÖMER class, from A1 to B1. Kerim the kumru narrates, and the learner is the newcomer Nima, whose every line they choose. These docs decide *what* gets written and how it is stored. The stories play on **Sahne**, the paper-theatre engine in `sahne/packages/sahne/` (`sahne/packages/sahne/DESIGN.md`).

## Status (2026-10-10)

| Part | Where it stands |
|---|---|
| Season 1 (A1) | All 48 briefs decided, with an arc for Nima (`STORIES_A1.md`, *Season arc*) |
| Stories written | All 48 as drafts in `data/stories/<id>.json` (s1e01 the model); s1e02–s1e48 are second-passed and language-checked, awaiting the owner's review (`S1_REVIEW.md`). No A2 brief exists yet |
| Stage | The Sahne engine is built (build steps B0–B5, `sahne/packages/sahne/DESIGN.md` §15). The gallery plays every draft (`pnpm sahne dev`, `#/stories/<id>`) |
| Story code | The story adapter (`adaptStory`) and the lints (`lintStory`, `suggest`) are in `sahne/packages/sahne-story`. The validator is `node sahne/packages/sahne-story/stories.ts --check` (`STORIES_SCHEMA.md` §10), part of `pnpm sahne check` |
| In the app | Nothing yet. Kumru's Stories tab is a "new stories are coming" placeholder; the new reader and the `stories`, `characters` and `places` collections arrive in M8 |

What is next: `ROADMAP.md` (M1 stage gaps is done; M2 places, M3 cast, M4 story tools, M5 writing Season 1, M8 Kumru adopts Sahne, M9 the Season 1 launch).

## Docs

| Doc | What it holds | Read it when |
|---|---|---|
| `STORIES_DESIGN.md` | Purpose, sizes, the learner stand-in, free and plus tiers, how a story is read (reply cards, choices, quiz), and the word and grammar rules | Before any story work |
| `STORIES_WORLD.md` | The districts per level and every place, with its id and first story | Adding or drawing a place |
| `STORIES_CAST.md` | The rules for making characters, the roster, every character sheet, *sen*/*siz*, album captions | Writing anyone's lines |
| `STORIES_CALENDAR.md` | Release dates, real-world events, the proposed production schedule | Dating a story, planning work |
| `STORIES_AUTHORING.md` | The process, the brief template, the review checklist, where drafts go | Writing or reviewing a brief or story |
| `STORIES_SCHEMA.md` | Every file and field, the closed vocabularies, learner data, the validator | Turning a brief into data, building the tools |
| `STORIES_STAGE.md` | How the stories use the Sahne stage: the teaching rules, story → script, staging in story files, mechanics per week, the reader's layout, the reply card, Kerim, the A1 art list | Working on how stories look and move |
| `STORIES_A1.md` | Season 1: the weeks, the season threads, callbacks, all 48 days and the briefs | Writing A1 |
| `STORIES_SYLLABUS_A1.md` | Where each A1 word and lesson first appears in the books | Checking a story's known words |
| `S1_REVIEW.md` | The Season 1 drafts awaiting the owner's review: the season's checks and open decisions, then per story the open points and the Persian to check | Reviewing the drafts |

Reading order for a new writer: DESIGN → CAST → WORLD → AUTHORING → the season's file. For the page or the tools: SCHEMA → STAGE → `sahne/packages/sahne/DESIGN.md`.

The owner reviews changes to the story docs before they are committed.

## Open decisions

Each one lives in its own doc:

- The open characters' details: Kırlangıç, Farzad and Rayan before they are drawn, Nani before A2 (`STORIES_CAST.md` §3).
- Place branches: the İBB library, the Göç İdaresi, Kırlangıç's flat, the lokanta (`STORIES_WORLD.md` §3).
- A daily-story system beyond the main arc; the *proposed* size defaults (`STORIES_DESIGN.md` §3).
- A native Turkish reviewer (`STORIES_AUTHORING.md` §2).
- The launch date: Mon 9 Nov is proposed, not committed (`STORIES_CALENDAR.md`; `ROADMAP.md` M9).
