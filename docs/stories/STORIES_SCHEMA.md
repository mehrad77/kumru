# Story data schema

This doc lists every file and field that the story series uses: stories, their steps and staging, characters, places, the learner's story progress, and the collections that hang off stories. It is written for the rebuilt series in `README.md`, with the stage in `STORIES_STAGE.md` and release dates in `STORIES_CALENDAR.md`.

Paths starting with `src/`, `data/`, `shared/` or `public/` are under ``; `tools/` and `docs/` are at the repo root.

Status: **draft v1, 2026-10-08; staging, characters and places revised 2026-10-09 for the Sahne stage** (`sahne/packages/sahne/DESIGN.md`). The line format is settled as option A (`STORIES_STAGE.md` §11): stories are written with their staging. Items marked *proposed* can still change, and items marked **Open** are undecided. `sahne/packages/sahne-story` implements the story and character types (`src/types.ts`) and the schemas (`sahne/packages/sahne-story/schema/`), and all 48 A1 stories are written to them as drafts in `data/stories/`. The app keeps them, its characters and its places in `data/` (`docs/SPECS_SCHEMA.md` §4.1) but does not build or read them yet (M8 in `ROADMAP.md`).

## 1. Files

Course content lives in `data/<collection>/<id>.json`: one document per file, pretty-printed with a trailing newline, named by its id. `sahne/packages/sahne-story/paths.ts` names the three folders below for every reader (the story check, the tests, the kit's set build, the gallery); what the briefs ask of each place (`places/needs.json`), the syllabus data and the schemas stay in `sahne/packages/sahne-story`. The app does not build these collections yet; when it does, the build hashes each into `public/data/` and lists it in `manifest.json`, as it does for the others.

| Collection | Files | Id | Change |
|---|---|---|---|
| `stories` | `stories/<id>.json`, about 48 per level | `s<season>e<NN>` | rebuilt (section 3) |
| `characters` | `characters/<id>.json`: the cast (22 at A1, Kerim and Nima among them) and the generic extras (26, `kind: "extra"`), in one folder | name slug | rebuilt, with an `avatar` document, `motion` and `voice` (section 5) |
| `places` | `places/<id>.json`, 41 at A1 (the sites split into places) | slug | **new**: Sahne place documents (section 6) |
| `scenarios` | none | none | retired; *proposed:* one per weekly arc for the plus tier, if it returns (section 8) |
| `journalPrompts` | none | none | retired (section 8) |

**Code, not data:** the art (body kit, parts, faces, hands, gestures, emotions, set pieces, props, sounds and motifs) is the Sahne kit in `sahne/packages/sahne-kit/` (`sahne/packages/sahne/DESIGN.md` §4.1). Its ids are closed vocabularies listed in the kit's manifest (section 7), and the validator checks every story against them.

**The old series is gone.** `s01`–`s16`, `sc01`–`sc16`, `w1`–`w4` and the 10 old characters (`ada can dede deniz ela marti mert selin simit zeynep`) were deleted when the new stories moved into the app (M8). No new id reuses an old one: the story check refuses a retired character id. Old `st` entries in learners' progress stay where they are and are ignored (section 9).

## 2. Ids and conventions

| Thing | Format | Example | Rule |
|---|---|---|---|
| Story | `s<season>e<NN>` | `s1e01` | Permanent. Rescheduling changes `releaseDate`, never the id |
| Season | 1 = A1, 2 = A2, 3 = B1 | `1` | The season is the level, as the approved ids `s1e01…s1e48` imply. Weekly arcs are a separate field (`arc`). This settles the first half of `STORIES_DESIGN.md` open item 1; confirm |
| Arc | `s<season>w<NN>` | `s1w01` | One per calendar week (`STORIES_CALENDAR.md`) |
| Character | lower-case ASCII slug of the name | `kirlangic`, `omer`, `maria` | Permanent. The stand-in is `nima`, the narrator `kerim` |
| Site | slug | `metro`, `flat_nima`, `bakkal` | Permanent. The list is in `STORIES_WORLD.md` §2 |
| Place | the site's id, or `<site>_<sub>` for one space of a site with several | `bakkal`, `metro_m11`, `flat_nima_stairs` | Permanent. A scene's `scene` names a place, never a bare site that has several |
| Mark | slug, unique within its place | `door`, `counter`, `ledge` | Where a character can stand |
| Prop | slug, unique within its place, or within the story for story-only props | `ekmek`, `sut` | Carries the card ids it names in `terms` |
| Card, grammar lesson | existing ids | `a1-w-ekmek`, `g_a1_2_var_yok` | Must exist in `cards`, `cards-extra` or `grammar` |
| Date | `YYYY-MM-DD`, Istanbul calendar day | `2026-09-07` | Released at 00:00 Europe/Istanbul (UTC+3; *proposed*) |

**Text.** Every line carries `tr`, `en` and `fa`.
- English never says he or she for the stand-in.
- **Personalisation tokens.** `Nima` / `نیما` stands for the learner's name, and `Tahran` / `Tehran` / `تهران` for their hometown. The page swaps them (`personalizeStr`, today keyed on *Ada*). Neither token may appear in any other sense, and the stand-in's suffixes follow the name rules (`Nima'nın`, `Nima'ya`). Nothing else about the stand-in is swapped, so no line may claim a country, a nationality or a language for Nima (`STORIES_DESIGN.md` §1).
- *Kırlangıç* is also a word ("swallow"), so every story that uses it glosses it as a name in `gl`.

## 3. Story document

| Field | Type | Req. | Meaning |
|---|---|---|---|
| `id` | string | ✓ | `s1e01` |
| `releaseDate` | date | ✓ | The day it appears for everyone. Unique across all stories (one track); never a Sunday; never in a break week |
| `kind` | `episode` \| `special` | ✓ | A special comes out on Saturday |
| `level` | `A1` \| `A2` \| `B1` | ✓ | Matches `season` |
| `season` | integer 1–3 | ✓ | Matches the id |
| `arc` | `{id, tr, en, fa, mechanics}` | ✓ | The week's arc, e.g. `{id:"s1w01", tr:"Hoş geldin!", en:"Welcome!", fa:"خوش آمدی!", mechanics:["say","explore"]}`. `mechanics` lists what the week's stories may use: `say`, `explore`, `act`, `aloud`, `unlocks` (`STORIES_STAGE.md` §5). Every story of an arc repeats the same object (the validator checks) |
| `ref` | `A1_1` … `B1_6` | ✓ | The unit of the story's week (weeks 1–6 their own unit, weeks 7–8 `A1_6`). A constraint: the check fails a `ref` that is not the week's, and a lesson or target word from a later unit |
| `title`, `titleEn`, `titleFa` | string | ✓ | `title` is Turkish |
| `summary`, `summaryFa` | string | ✓ | 1–2 sentences, for the archive and as context for the plus-tier talk |
| `place` | place id | ✓ | Where the story opens. The first step's `scene` must name it |
| `cast` | character ids | ✓ | The speakers: 2–4 in an episode, at most 6 in a special. Kerim counts only when she speaks in the scene as a character. Her narration and spots don't count |
| `extras` | character ids | | On stage but silent, e.g. classmates in the background. They don't count towards the cast limit, and they cannot speak
| `lessons` | grammar ids, 1–3 | ✓ | At A1, none later than the story's week (`STORIES_DESIGN.md` §2) |
| `words` | card ids | ✓ | Target words: 5–8 in an episode, 10–12 in a special. **Card ids, not Turkish text** |
| `gl` | `{ word: [fa, en] }` | ✓ | Glosses for words that no card or suffix strip reaches. Keys are lower-case Turkish (`"havalimanı": ["فرودگاه", "airport"]`) |
| `props` | `{ id: prop }` | | Story-only props, added to the places their `at` names (below) |
| `looks` | `{ <character id>: outfit \| look }` | | What characters wear for the whole story (section 5.2); without it, their `avatar` |
| `names` | `{ <character id>: string }` | | The name a character goes by in this story only, for one the learner has not met by name yet (`s1e14`: Maria is *Teyze*); without it, their `name` |
| `steps` | step[] | ✓ | The story (section 4). It starts with a `scene` step |
| `quiz` | quiz item[3] | ✓ | Section 4.6 |
| `followUp` | step[] | | The scripted dialogue after the quiz, free tier. Only `line` and `choice` steps; the stand-in rules apply |
| `draft` | `true` | | Unreviewed. Never in a production build (like the path's draft sections) |

**Story-only props.** A story prop is a place prop (section 6) whose `at` is either a point or mark in the story's opening place, or a map of place id → point or mark, for a thing that travels with the story:

```json
"bavul": {"kit": "suitcase", "n": 1, "shown": false, "terms": ["a1-w-bavul"],
          "at": {"ist": {"x": 0.75, "y": 0, "z": 0.6}, "metro": {"x": -1.15, "y": 0, "z": -0.15}, "flat_farzad": {"x": -1.35, "y": 0, "z": 0.35}}}
```

- It is one thing in every place it stands in: its count, whether it is shown, and its parameters go with it from place to place. Where it stands is each place's own.
- A character in the next scene who holds it keeps it in hand, even in a place its `at` does not name.
- Its id must not be the id of a prop of any place it stands in. The `props` lint checks this, and that each place is one the story visits and each mark is one that place has.

**Removed fields:**
- `order` and `chapter` are replaced by `releaseDate` and `id`.
- `chapterTitle`/`chapterTitleEn` become `arc`.
- `seasonTitle` is a page string per season.
- `complexity` follows from `level` and `kind`.
- `focus` is derived from the titles of `lessons`.

**Release gating.** The page lists a story once its `releaseDate` is on or before today's Istanbul date. Stories with later dates do ship in the static file, ready ahead of time. Anyone reading the file can see them early, which is accepted. The alternative is a deploy every day.

## 4. Steps

A step is an object with exactly one kind:

| Kind | Recognised by | Shape |
|---|---|---|
| line | `who` | 4.1 |
| beat | `beat` | 4.2: staging with no speech, e.g. `{"beat": {"sfx": {"id": "clock_tick", "word": "tik tak"}, "cam": "close", "at": "obj:saat"}}` |
| act | `act` | 4.5a |
| scene | `scene` | 4.3 |
| spot | `spot` | 4.4 |
| choice | `choice` | 4.5 |

### 4.1 Line

| Field | Type | Meaning |
|---|---|---|
| `who` | character id | The speaker. Kerim narrating: `who:"kerim"` with `narr:true` |
| `tr`, `en`, `fa` | string | The line |
| `narr` | `true` | A narration box from Kerim's inset instead of a speech bubble |
| `note` | `{en, fa}` | A short note shown under the line: a dialect feature (A2+), or a deliberate *sen*/*siz* switch |
| `mistake` | `{fix}` | The line holds a learner mistake by a foreign classmate. `fix` is the correct form. The validator checks that a later line within three lines uses it (someone corrects it), and the page never offers the wrong form as a gloss or card |
| *staging* | | Section 4.2 |

**The stand-in's lines.** A line whose `who` is `nima` becomes a **say step**: a reply card with *Söyle* that the learner taps (`STORIES_STAGE.md` §7). No extra field is needed. The stand-in never has two lines in a row, and a story gives the stand-in a turn within its first four lines.

### 4.2 Staging fields (lines, beats, spots and replies)

All are optional. Defaults keep most lines plain, and `--suggest` proposes the routine ones. They are the staging fields of a Sahne script, used unchanged (except `looks`, which the adapter turns into the script's `costume`); the full table with every value is `sahne/packages/sahne/DESIGN.md` §5.6.

| Field | Values | Meaning | Default |
|---|---|---|---|
| `to` | character id \| `all` \| `viewer` | Who the line is said to: gaze, framing, *sen*/*siz* checks | The last other speaker |
| `emo` | emotion (7) | The speaker's face and posture | Carried for 2 lines, then the character's resting mood |
| `do` | gesture (7) | One gesture; `n` (1–5) for counting, `loop: true` for an ongoing action (*-(I)yor*) | Talking only |
| `at` | `obj:<prop>` \| `ch:<id>` \| `ch:<id>.<body part>` \| `mark:<mark>` \| `viewer` | The target of `do` and of the gaze | `to` |
| `move` | `{who, to, how, via?}` or an array | `to` is a mark; `how` is `walk`, `run`, `hop`, `enter`, `exit` or `fly`; `via` lists marks to pass (the landings of `flat_nima_stairs`), and a leg that climbs is taken a step at a time. On foot a walk goes round the place's walls, railings and closed gates by itself (a `route` lint warning says so); a gate or door opens only for an `enter` or `exit` through its door mark. At most one move per character per line | — |
| `obj` | `[{id, op, to?, via?, ms?, n?, at?, set?}]` | Prop changes: `show hide give take add own place set go` (`set` changes a parameter: a clock's `time`, a phone's `screen`, a `label`; `set: {n}` changes the count; `set: {still: true}` holds a moving prop; `go` sends a prop along `via` marks to the mark `to`: the cat between the bowls, a rolling yarn ball) | — |
| `link` | `{ token: target }` | Words in `tr` that name something on stage, for word ↔ object taps. The key is the token as written, lower-case | Inferred from the props' `terms` |
| `react` | `{ <id>: emo \| gesture \| {emo, do, at} }` | Listeners' reaction after the line; at most two | — |
| `cam` | `wide two single close ots obj follow split photo` | A framing override | The director decides |
| `via` | `phone` \| `video` | The speaker is not on stage: a phone inset, or a split frame with `cam: "split"` | — |
| `voice` | `normal whisper silent mouthing` | `silent` is the stand-in's "…" card | `normal` |
| `sfx` | `{id, word?, at?}` or an array | A sound, with its written sound word ("tık tık") shown where it comes from | — |
| `env` | `time:<t> state:<s> weather:<w> thunder lights_on lights_off fireworks stop:<station> depart`, one or a list | A one-off change to the place. `stop:<station>` brings a vehicle that stops in to one of its stations (any but the first) and holds it there, doors open; `depart` shuts the doors and goes on. A bare `stop` halts it where it is, between stations (stuck in traffic: pair it with the place's `stuck` state on the bus), until `depart`. Neither waits for the train. Unless the car is already on its way there, `stop` starts it on the leg to that station, so it reaches the platform about 11 s later: put it on the scene's first beat, and the ride and the arrival play under the lines that follow. `time:<t>:<ms>` changes the time over `ms` (default 0.9 s; up to a minute: dusk falling while the city's lights come on, s1e35). `state:<s>` turns one of the place's states on (`state:-<s>` off; `state:<s>:fade` fades instead of cutting; `state:<s>:roll` takes 1.4 s and rolls a roller shutter down or up: the bakkal's `closed`) | — |
| `frame` | `past` \| `past_inset` | A remembered event: the old-photo look, or a small picture of another scene (`of`: a story id and step) | — |
| `on` | a word of `tr` | The word the gesture's stroke meets ("yok" for a shrug) | The linked word for `at`, else the first word |
| `tempo` | number | This line's speed ("İsmail, quickly": 1.4) | The character's `motion.tempo` |
| `looks` | `{ <character id>: outfit \| look }` | A change of clothes as the line starts, after any walk (a coat coming off). Only on a line or beat at the top level, never in a choice or an act (section 5.2) | — |

**Lint rules:** `STORIES_STAGE.md` §4.

### 4.3 Scene

```json
{"scene": "bakkal", "time": "day", "at": {"ismail": "counter", "nima": "door"}, "kerim": "ledge"}
```

This changes place, or sets the opening place, and puts characters on marks. A scene in the same place keeps its props as they are; whoever is not listed leaves and takes what they hold. A new place starts with its own props as its file says, and the story's props there come as they were last seen (below). `time` is `dawn`, `day`, `golden`, `dusk`, `night` or `overcast` (default `day`), and `weather` (`grey`, `rain`) is optional and carries into the next scenes until it changes. `state` (one or a list) turns on states of the place beside its defaults, such as the class `empty` at 8:30; the same place keeps its states from scene to scene. A scene names a place, never a bare site with several places (`metro_osmanbey`, not `metro`); moving between places of one site carries every prop and plays no new music. `kerim` is optional: the mark where Kerim perches in the world; without it she perches on the place's `perch`. She is on stage only when her character document has a `puppet`, and otherwise speaks from her window alone. `looks` (section 5.2) dresses characters at the cut, from this scene on. `stop` is for a vehicle that stops (the M11 car, whose place lists its `stops`): the scene opens with it standing at that station, doors open; without it the car runs from station to station on its own. A scene step may come later in a story, for example IST → the M11 in `s1e01`. Characters not listed are off stage.

### 4.4 Spot (Kerim's grammar spot)

```json
{"spot": {"lesson": "g_a1_2_var_yok", "ex": "Ekmek var. Süt yok.", "en": "…", "fa": "…", "show": "var_yok"}}
```

| Field | Meaning |
|---|---|
| `lesson` | It must be in the story's `lessons` and be a current `g_<lv>_<unit>_<slug>` id. Today's stories still use old ids like `g13` |
| `ex` | The example. It must be a line, or part of a line, from this story |
| `en`, `fa` | Kerim's explanation. A `tr` line is optional, at A2 and up |
| `show` | *Optional:* a teaching overlay (section 7) |
| staging | Kerim's own staging, e.g. `do:"fly"` with `move` along marks to act out *-DAn* / *-(y)A* |

### 4.5 Choice

```json
{"choice": {"id": "seat", "kind": "action", "to": "maria", "options": [
  {"tr": "Buyurun, oturun.", "en": "…", "fa": "…", "ok": true, "tone": "polite", "sets": "s1e14_seat",
   "react": {"maria": "happy"}, "reply": [ {"who": "maria", "tr": "Çok teşekkür ederim!", "en": "…", "fa": "…"} ]},
  {"tr": "…", "en": "…", "fa": "…", "tone": "casual",
   "react": {"maria": "neutral"}, "reply": [ … ]}
]}}
```

| Field | Meaning |
|---|---|
| `id` | A slug, unique in the story. Learner data stores the pick under it (section 9) |
| `kind` | What the choice trains: `polite` (the right phrase or register for the moment), `meaning` (showing that Nima understood what was said, or picking the right form), `action` (deciding what to do: who to ask, where to go, whether to help). Across a season about a third of the choices are each kind (the validator reports the split) |
| `to` | The character the choice is mainly about: the one whose warmth it moves. Default: the speaker of the line before |
| option `ok` | The pragmatically best option. It feeds the *great picks* count, with no confetti |
| option `tone` | `polite`, `warm`, `formal`, `casual`, `blunt` or `rude`. It names the contrast for review and sets the reaction and warmth defaults |
| option `sets` | *Optional:* a flag the pick sets, `s1e14_seat`. Flags are named `<story>_<slug>` and only the story that sets a flag may name it in `sets` |
| option `warm` | *Optional:* `{ <id>: -1 \| 0 \| 1 }` overrides the warmth default (below) |
| option `react`, `reply` | Run after the pick. Every option gets a reaction |

- 2–3 options, each said by the stand-in. The options look exactly like a one-option say card.
- 1–2 choices per episode, 2 in a special. The plot never branches: all options rejoin the next step. Later stories may *remember* a pick (4.7), but only through a line or two, never a different plot.
- **Warmth default.** The `ok` option gives `to` +1; a `blunt` or `rude` option gives −1; any other option gives 0. `warm` overrides it for any character, for example a choice that pleases one friend and hurts another.

### 4.5a Act

```json
{"act": {"id": "bread", "kind": "tap", "prompt": {"tr": "Hangi ekmek?", "en": "Which loaf?", "fa": "کدام نان؟"},
 "targets": ["obj:ekmek", "obj:simit"], "expect": "obj:ekmek", "to": "ismail",
 "react": {"ok": {"ismail": "happy"}, "other": {"ismail": "confused"}}}}
```

The learner does something on stage instead of reading (`STORIES_STAGE.md` §5). Only weeks whose `arc.mechanics` has `act` may use it.

| Field | Meaning |
|---|---|
| `id` | A slug, unique in the story; learner data stores the result under it, as for a choice |
| `kind` | `tap` (a thing or person), `drag` (a prop to someone: `item`, `targets`), `go` (a mark), `choose` (one of two things on stage) |
| `prompt` | *Optional:* the line or instruction that asks for it, `{tr, en, fa}` |
| `targets`, `expect` | What may be picked, and the expected pick, if there is one |
| `to`, `react`, `warm` | As in a choice: who it is about, the reactions, the warmth |

An act never blocks the story: after two misses the target is hinted, after three it is shown, and the story goes on.

### 4.7 Callbacks (`if` / `unless`)

```json
{"who": "maria", "if": "s1e14_seat", "tr": "Siz… metroda! Teşekkürler!", "en": "…", "fa": "…"},
{"who": "maria", "unless": "s1e14_seat", "tr": "Siz… metroda!", "en": "…", "fa": "…"}
```

- Any line, spot or choice step may carry `if: <flag>` or `unless: <flag>`. It runs only when the learner's pick in the earlier story set (or didn't set) the flag.
- Callbacks come in pairs: every `if` line has an `unless` twin, or the story reads the same without it. A learner who skipped the earlier story gets the `unless` lines.
- The flag must be set by a story with an earlier `releaseDate` (the validator checks).
- A callback changes a line or two, never the plot, the quiz or the target words. Season 1's callbacks are listed in `STORIES_A1.md` (*Callbacks*).

### 4.8 The album

At the end of each season, after its last story, Kerim shows a **photo album**: one photo for each character the learner met in at least three stories, with a caption from that character. The caption depends on the learner's warmth with them:

| Warmth (sum over the season) | Band | Example (Maria Teyze) |
|---|---|---|
| ≤ 0 | `met` | "Komşum Nima." |
| 1–2 | `close` | "Nima… iyi bir komşu." |
| ≥ 3 | `family` | "Nima benim ailem." |

- No number, bar or score is ever shown, and no band is a punishment: `met` is still a warm caption.
- The captions live in the character document (`album`, section 5).
- The photo is a frame from a story both shared, picked by the writer per band (`album[].photo`: a story id and a step index).

### 4.6 Quiz item

```json
{"q": "Bakkalda ne yok?", "en": "What is missing at the bakkal?", "fa": "…", "options": ["Süt", "Ekmek", "Simit"], "a": 0, "why": "“Ama süt yok.”", "kind": "comp"}
```

There are exactly 3 items. `options` has 3 Turkish options, and `a` is the index of the right one. `why` quotes the line that answers it. `kind` is `comp` (who, what, where) or `word` (a target word); a story has at least one of each. Grammar is never quizzed.

## 5. Character document

| Field | Type | Req. | Meaning |
|---|---|---|---|
| `id` | slug | ✓ | `ismail` |
| `order` | integer | ✓ | Gallery and archive-filter order |
| `name`, `nameFa` | string | ✓ | `İsmail`, `اسماعیل` (shown as *İsmail Abi* where the stories call him that) |
| `kind` | `narrator` \| `standin` \| `cast` \| `extra` | ✓ | Exactly one each of `narrator` (Kerim) and `standin` (Nima). `extra` is a generic silent person of a place (a clerk, a çaycı, a child), named only by their role (§5.3) |
| `circle` | `old_friends` \| `neighbourhood` \| `tomer` \| `guest` | | From the character sheet (`STORIES_CAST.md`) |
| `role`, `roleFa`, `bio`, `bioFa` | string | ✓ | The short sheet shown in the character sheet |
| `catch` | `{tr, en, fa}` | | The catchphrase |
| `color` | `#RRGGBB` | ✓ | The speech-bubble notch and avatar ring. It must be distinct from the others in the same scenes |
| `level` | `A1` \| `A2` \| `B1` | ✓ | The level they first appear in. A character never appears before it (Nani is A2) |
| `places` | place ids | | Where they are usually found |
| `address` | `{ <id>: "sen" \| "siz" }` | | How this character addresses each other character. A deliberate switch inside a story is written as a `note` on that line, and the validator allows it |
| `avatar` | object | ✓ (not for a kit puppet: Kerim, Pisi, the gulls) | A Sahne avatar document (section 5.1) |
| `puppet` | `bird` \| `cat` \| `gull` | | A kit puppet that plays the character on stage instead of an avatar (`STORIES_STAGE.md` §8): Kerim's `bird` (without it she is only the narrator window), Pisi's `cat`; `gull` for a gull. A puppet character has no `avatar` |
| `terms` | card ids | | What a tap on the character opens, as a prop's `terms` do: Kerim's `a1-w-kus` |
| `outfits` | `{ <name>: look }` | | Other clothes they wear (section 5.2), e.g. Farzad's `winter` and `indoor`. `default` is reserved: it is the `avatar` itself |
| `motion` | `{tempo, energy, signature[]}` | | `tempo` 0.7–1.3 scales timing; `energy` is `low`, `mid` or `high`; `signature` holds 2–3 gesture ids they use often (`sahne/packages/sahne/DESIGN.md` §7) |
| `voice` | `{rate, pitch, neural?}` | | Browser speech settings now; `neural` is the voice id once neural voices exist (`sahne/packages/sahne/DESIGN.md` §8.4) |
| `album` | `{ <season>: { met, close, family } }` | | The album captions (4.8), each `{tr, en, fa, photo: {story, step}}`, keyed by the season as the ids write it (`"s1"`); `step` indexes the story's `steps`. Needed for every character in three or more stories of that season, except the stand-in and the narrator |

### 5.1 `avatar`

`avatar` is a Sahne avatar document (`sahne/packages/sahne/DESIGN.md` §5.2): the same format a learner's character uses, so the cast and the learners are built from one kit.
- `body.build` is `adult`, `elder` (Maria Teyze), `child` (Ömer) or `toddler` (Rayan).
- Signature items are ordinary kit parts: İsmail's apron, Kırlangıç's yarn and needles, Zafer Hoca's marker and glasses, Reza Bey's lanyard and folder, Serkan's black-and-white Beşiktaş scarf.
- `custom` holds at most two parts reserved for the character (İsmail's moustache, Maria Teyze's bun).

The stand-in's document is Nima's default look, used only until the learner has designed a character. Then the learner's own avatar (`char`, `docs/SPECS_SCHEMA.md`) plays Nima. Kerim has no `avatar`: her document says `puppet: "bird"`, and the adapter casts the kit's bird puppet built from the mascot's paths (`STORIES_STAGE.md` §8). A story that names her as a target writes `ch:kerim`.

### 5.2 Outfits

A character's body is fixed: build, height, shape, skin, face, hair and facial hair. Their clothes change: every `outfit` slot, every `wear` slot (glasses, aids and head coverings included), `carry` and `hold`. A **look** names only clothing slots, in the avatar's own shape; a part id may be a bare string, and `null` takes a slot off:

```json
"outfits": {
  "winter": {"outfit": {"outer": {"id": "outer_coat_long", "colors": ["fab_24"]}}},
  "indoor": {"outfit": {"outer": null}}
}
```

`looks` (`{ <character id>: outfit name | look }`) dresses characters at three levels: the story (section 3), a scene (4.3, from that scene on) and a line or beat (4.2, at that moment).
- An outfit name dresses the character in that outfit: their `avatar` with the outfit applied (`default` is the `avatar` itself).
- An inline look changes only the slots it names, on what they wear now.
- Clothes stay until the next change, across scenes.
- `top`, `bottom` and `shoes` can be changed but never taken off.
- **The learner.** When the learner's own avatar plays Nima, a look changes only `outer` and `wear.hat`, and never puts a hat over the learner's head covering. The same holds for Nima's default look.

The `look` lint (`STORIES_STAGE.md` §4) checks every look and outfit against the kit.

### 5.3 Extras

A generic extra is a character document with `kind: "extra"` in `data/characters/<id>.json`, beside the named cast: `kind` tells them apart. A story names it in `extras` (section 3) and never gives it a line. Its `name` and `nameFa` are the role (`Çaycı`, `چای‌فروش`), `role`/`roleFa` and `bio`/`bioFa` are one plain line, `color` is one neutral grey, `level` is `A1`, and `order` is 100 or more so extras sort after the cast. It has an `avatar` and no `outfits`, `catch`, `album`, `friend` or `address`. Ids name the role and, when needed, the place or a number: `clerk_goc`, `cayci_ortakoy`, `child_1`…`child_8`, `passenger_1`…. Extras are generated, never edited by hand: `node sahne/packages/sahne-story/cast/extras.ts` builds each from a fixed seed and a frozen list of kit parts and colours, then sets the role's own items (an apron, a lanyard, a headscarf), and `--check` fails when a file is stale. It only ever writes or deletes files of `kind: "extra"`, and refuses to write an extra over another character. A new extra is a new entry in that script with a new seed. Named characters who are only silent in a story (Yusuf, Alex) are cast characters, not extras.

## 6. Place document (new)

A place is a Sahne place document (`sahne/packages/sahne/DESIGN.md` §5.5): set pieces from the kit with their parameters, marks, props, the times of day it allows, its lights (carried by its pieces: a lamp, lit windows), its sound (ambience loops, a music motif, and what footsteps sound on) and Kerim's perch. Kumru adds two fields:

| Field | Meaning |
|---|---|
| `name` | `{tr, en, fa}`, shown as the stage label |
| `district` | Text, used by the archive filter |
| `states` | Variations of the place: `{name: {group?, default?}}`, and `in: [states]` on its pieces, marks and props (`sahne/packages/sahne/DESIGN.md` §5.5): the class empty or full, the shutter down, bunting up |
| `site` | The site this place is one space of (`metro` for `metro_m11`); absent when the place is the whole site. Places of one site stay related: moving between them plays no new motif and carries the props, as one place would |

- A prop's `terms` are card ids (`a1-w-ekmek`), so tapping the prop opens that card's gloss, and a line's `link` can be inferred from them. A prop with no word to teach (dressing) says `decor: true` instead.
- Walls, railings, a building's front, counters, desks, tables and gates are solid (`sahne/packages/sahne/DESIGN.md` §5.5, §7): people walk round them, and a gate or door lets them through only on an `enter` or `exit` at its door mark. A desk or a table is solid along its front and its sides, back by half its depth: a seat mark goes in its open back half, walked to from behind. A piece people may pass anyway says `solid: false`. Every mark people stand on must be reachable from the first door mark, out through its own door too (the place lint's `reach` rule); a story moves someone from inside to a mark outside with an `exit` and an `enter`, not a plain walk.
- A mark with `air: true` is a spot in the air: Kerim flies there and hovers (the runway beyond the airport glass, outside the metro window). The place's `perch` is a mark she can stand on.
- A prop's `label` (a sign, a menu, a phone screen) may carry the name token, and the page personalises it.
- Places ship as a hashed collection, like the others. A place is about 2–5 KB, because the art is in the kit.

## 7. Closed vocabularies (owned by the kit)

The vocabularies live in the Sahne kit's manifest (`sahne/packages/sahne-kit/`), and the validator reads them from there: emotions, gestures, props, set pieces, sounds (`sfx` ids and their sound words), music motifs, ambience, teaching overlays (`spot.show`) and prop operations. The first kit's emotions and gestures are listed in `sahne/packages/sahne/DESIGN.md` §5.6.

Teaching overlays (`spot.show`) show only in spots, or when a suffix is tapped:

| Overlay | Shows |
|---|---|
| `deixis` | near, middle and far rings for *bu/şu/o* |
| `var_yok` | shown props and the outlines of missing ones |
| `case_path` | a ring for *-DA*, an arc away for *-DAn*, an arc towards for *-(y)A* |
| `owner` | owner tags |
| `compare` | *daha* / *en* tags, with the *-DAn* standard glowing |
| `aspect` | a looping action for *-(I)yor* beside a result state for *-DI* |
| `clock` | the clock face with *buçuk*, *çeyrek*, *var* and *geçiyor* marked |

## 8. Collections around stories

- **Scenarios**: retired with the old series (M8); there is no `scenarios` collection. *Proposed,* if *Talk with a character* returns for the plus tier: one per weekly arc, ids `sc_<arc>` (`sc_s1w01`), with an `arc` and a place id. Without the AI tutor the page would show none, since `host.ai` is `null` on this host.
- **Journal prompts**: retired with the old series (M8). If writing practice returns, it belongs to the arcs.
- **Reactions and comments** on stories (`STORIES_DESIGN.md` §1): **Open.** They would be the first learner-written story data and need a D1 table and routes inside the free-tier budget (`docs/SPECS.md` §12). They are not part of this schema yet.

## 9. Learner data

These live in the private `progress` document and the public Friends profile (`docs/SPECS_SCHEMA.md` §3.1, §2.4). Their shapes stay as they are.

| Where | Shape | Change |
|---|---|---|
| `progress.st` | `{ [storyId]: { done, stars, reads, at, picks, ch } }` | **New: `ch`**, `{ [choiceId]: optionIndex }`, the option picked at each choice in the last reading. The merge rule stays: `done` wins; `stars` and `reads` take the max; `picks` and `ch` come from the later `at`. Entries for the old `s01`–`s16` stay and are ignored. *Proposed:* a `fu: true` flag once the follow-up is done |
| `progress.log[].st` | stories finished in that session | Unchanged |
| profile `storiesDone` | integer | Counts only ids that exist in the current `stories` collection |

**Done** means the story was read to the end and the quiz passed (`STORIES_DESIGN.md` §1). Stars come from the quiz. Picks are the number of `ok` choices made out of the choices shown.

**Flags and warmth are derived, never stored.** The page computes them from `ch` and the stories' own data: a flag is set when the picked option has `sets`, and warmth is the sum of the picked options' warmth (4.5). So there is nothing new to merge, and a rewritten choice re-scores itself. Re-reading a story and picking differently changes its flags from then on.

## 10. Validator

`node sahne/packages/sahne-story/stories.ts --check` runs inside `pnpm sahne check` and Kumru's `pnpm check` (`scripts/gates.mjs`, with `cast/extras.ts --check`; the `sahne` and `kumru` jobs of `deploy.yml` run them on pull requests); `test/drafts.test.ts` runs the same check over every story in `data/stories/` on its own, so a new story needs no test. It is the one schema source for stories, characters and places: `scripts/kumru_data.py` checks only their references into the app's other collections (lessons, words, cast, place). It checks the schemas (`sahne/packages/sahne-story/schema/`: `story.json`, `character.json`, `place.json`, run with ajv), the story rules below and the lints in `STORIES_STAGE.md` §4 (`lintStory`, `lintPlace`). Errors fail it; warnings and info are the report (the known-word ratio, recycling, the season's choice kinds). The logic is `sahne/packages/sahne-story/check/` (node only, not part of the app's bundle); the release calendar is the *Days* table of `STORIES_A1.md`, the syllabus data `sahne/packages/sahne-story/syllabus/a1.json`.

**Story-level checks** (modelled on `grammar_lessons.py --check`):
- `id` format and uniqueness; `releaseDate` is a date, with no two stories on the same date (one track).
- Every `who` and `cast` id is in `characters`; `cast` size within the limits; every speaker is in `cast`.
- Every `lessons` and `spot.lesson` id exists in `grammar`, and no lesson is from a unit later than the story's week.
- Every `words` id exists in `cards`; target count within the range for `kind`.
- Known-word ratio ≥ 95% against the known words: the books and workbook cards up to the story's unit (`STORIES_DESIGN.md` §2).
- Recycling: each target word reappears in ≥ 2 stories within 14 days after its `releaseDate`. This is reported as a warning while later stories are still unwritten.
- Line count and sentences per turn within the level's band; 1–2 choices per episode; 3 quiz items with a valid answer index.
- Stand-in turns: no two stand-in lines in a row, and the first turn comes within the first four lines.
- *Warning:* a `who: nima` line whose `tr` has *İran*, *İranlı*, *Farsça* or Persian script (the language-neutral rule). A1's kept exceptions are allowed by id.
- Every Turkish token in the lines resolves through `gl`, a card or a known suffix strip, so tap-to-translate never comes up empty.

**Schema-level checks:**
- Ids match their formats and their files, and `releaseDate` is unique and on the calendar.
- Every reference resolves: cast, `who`, `to`, `react`, places, marks, props, cards and lessons.
- The vocabularies are closed.
- Every `link` key is a token of its line, and every `spot.ex` comes from the story.
- The stand-in turn rules (4.1) hold.
- A choice has 2–3 options, each with a reaction, an `id` unique in its story and a `kind`.
- Every `sets` flag is named `<own story>_<slug>`; every `if`/`unless` names a flag set by an earlier story, and `if` lines have an `unless` twin or stand alone (4.7).
- Every character in three or more stories of a season has `album` captions for it (not the stand-in or the narrator: the album is Kerim's, of the people the learner met).
- *Report, not a failure:* the season's split of choice kinds (`polite` / `meaning` / `action`), which should be near a third each.
- The quiz has 3 items, with at least one `comp` and one `word`.
- `arc` is identical across an arc's stories.
- No character appears before its `level`.
- `draft` stories never reach a production build.

`--suggest` proposes `link`, `do`/`at` and `obj` show/hide from the *bu/şu/o*, *var/yok* and number patterns.
