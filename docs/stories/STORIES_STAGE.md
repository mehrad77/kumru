# Kumru story stage

How the stories use **Sahne**, the paper-theatre stage engine in `sahne/packages/sahne/` (its design: `sahne/packages/sahne/DESIGN.md`). This doc covers what is particular to the stories:
- why the stage moves the way it does;
- how a story becomes a script;
- the staging written in story files;
- which mechanics each week uses;
- the reader's layout and the reply card;
- Kerim on stage;
- the A1 art list and the first scenes to build.

Code paths (`src/`, `data/`, `app/`, `public/`) are under ``.

Status: **rewritten 2026-10-09.** Story design: `STORIES_DESIGN.md` (index: `README.md`). Field definitions: `STORIES_SCHEMA.md`.

## 1. History

- **2026-10-08.** The first proposal kept the stage in SVG and in the page: busts replaced by full-body SVG rigs, a director, WAAPI and CSS. It compared three.js, Rive, Pixi with Spine, and Lottie, and chose the SVG rig. Those options were rejected because their art needs an animator or an editor (Rive, Spine, Lottie), or a 3D artist and about 130–160 KB of library (three.js), and an agent can't author any of that.
- **2026-10-09.** A review against the 48 briefs found staging the rig could not express: phone calls, sounds, Nima's freeze, the learner's face acting, clocks, body parts, Kerim flying through a story, time of day, crowds. The owner then opened a full rewrite of the stage, the characters, the learners' avatars and the sound. The result is Sahne: paper theatre in 2.5D, drawn by Claude in code, in its own package, with a path to procedural 3D toon later (`sahne/packages/sahne/DESIGN.md` §1).

Library sizes measured on 2026-10-08 from the npm tarballs (`gzip -9`), kept for a later 3D decision:

| Package (version) | gzip |
|---|---|
| Kumru's whole page (`public/index.html`, 784 KB raw) | 236 KB |
| three 0.186.1: WebGLRenderer, ortho camera, planes | 132 KB |
| three + GLTFLoader + AnimationMixer | 159 KB + models |
| @rive-app/canvas-lite 2.44 (JS + wasm) | 474 KB |
| pixi.js 8.22 + spine-pixi-v8 4.3.13 | 304 KB |
| lottie-web 5.13 light | 46 KB |

## 2. Pedagogy: motion that teaches

The evidence in one paragraph:
- Animation beats static pictures only modestly overall (Berney & Bétrancourt 2016, g≈0.23). The gain comes from animation that **depicts the content itself**; decorative animation adds little (Höffler & Leutner 2007).
- Extraneous "interesting" material reliably hurts learning (the seductive-details meta-analyses: Rey 2012; Sundararajan & Adesope 2020, g≈−0.33).
- Signaling helps moderately (Schneider et al. 2018), and so does learner-paced segmenting (Rey et al. 2019).
- For L2 specifically:
  - Pictures plus text beat text alone for vocabulary (Chun & Plass 1996; Plass et al. 1998).
  - Gestures and facial cues help **low-proficiency** listeners understand (Sueyoshi & Hardison 2005).
  - Congruent iconic gestures help L2 word learning, and incongruent ones hurt (Kelly et al. 2009).
  - *Performing* gestures helps more than watching them (Macedonia & Knösche 2011), which is why the stage now lets the learner act (section 5).
- Pedagogical agents have small positive effects (Schroeder et al. 2013), and so do human-like gestures and gaze (Mayer & DaPra 2012).

| Behaviour | What the learner sees | Turkish A1–B1 point (Persian bridge) | Evidence |
|---|---|---|---|
| **Who is speaking** | A two-shot of speaker and addressee, a slight lean, the mouth moving with the voice (or the text when muted), listeners looking at the speaker; over the learner's shoulder when someone speaks to Nima | every line | Signaling: moderate. Cartoon mouths are a speaker cue only, not pronunciation teaching (that needs real faces, Hardison 2003) |
| **Deixis** | *bu*: the speaker holds or touches the thing. *şu*: points, and the **addressee's gaze follows** (*şu* directs attention, Küntay & Özyürek 2006). *o*: points far, out of the window, or at a third person | `1_bu_su_o`, `burası/şurası/orası`. Persian has only two (این/آن) | Congruent gesture: moderate. Gaze cues steer attention, but gains are unproven (Ouwehand et al. 2015) |
| **var / yok** | The prop appears, or its place shows a dashed empty outline | `2_var_yok` (هست/نیست) | Dual coding with concrete nouns: moderate to strong |
| **-DA / -DAn / -(y)A** | A ring on the location; an arc leaving the source; an arc arriving at the goal. In spots, Kerim flies the path | `2_bulunma`, `3_yonelme`, `3_uzaklasma`. Persian در / از / به are prepositions | Image-schema teaching (Tyler 2012): small studies; extrapolated for Turkish, so weak |
| **-(I)yor vs -DI** | *-(I)yor*: the action loops while the line is on screen. *-DI*: the result state. Told memories get the old-photo `past` frame | `3_simdiki`, `5_gecmis` | Weak to moderate |
| **Telling the time** | Every clock and watch on stage shows the time that is said; *buçuk* and *çeyrek* move the hands | Ünite 5 (*Saat kaç?*) | Dual coding: moderate |
| **Plural and numbers** | *-lAr*: items multiply. *iki ekmek*: two loaves with the singular noun; hands count on fingers | `1_cogul`, `2_sayilar`. Persian also keeps the noun singular after a number (دو نان) | Dual coding: moderate |
| **Possessive** | An owner tag in the owner's colour on the object | `4_iyelik`, `6_belirtili_tamlama` | Signaling: moderate |
| **Body parts** | The part lights up on the speaker as it is named (s1e34) | *baş, göz, burun, kulak…* | Picture glosses: moderate to strong |
| **Imperative** | The addressee carries out the command; on act turns, the learner does | Zafer Hoca's *Kitabı açın* | TPR (Asher 1969); doing beats watching |
| **daha / en** | Two items side by side with tags; the *-DAn* standard glows; *en* gets a highlight | `6_daha`, `6_en`. Persian *-tar az* uses از as Turkish uses *-DAn* | Signaling, extrapolated |
| **Tone and emotion** | Faces and posture make the intent guessable without the translation | every line | Sueyoshi & Hardison 2005: moderate. Emotional design: small (Um et al. 2012; Brom et al. 2018) |
| **Word ↔ object** | Tapping a word rings the thing it names; tapping a thing shows its word | every concrete noun | Picture glosses: moderate to strong |
| **Sound words** | Sounds come with their Turkish words: *tık tık*, *hav hav*, *düüüt* | onomatopoeia, a living part of Turkish | Dual coding; no direct studies |
| **Choices** | Listeners react: a warm nod and hand on heart for *lütfen*/*siz*, a raised brow and a pause for a blunt *ver* or a misplaced *sen*. **No confetti** | sen/siz, politeness | Instructed pragmatics works (Taguchi 2015). Reactions as implicit feedback are an extrapolation |
| **Culture shown** | Hand on heart for thanks; the *cık* "no" (head up, brows up), which Iranians share | — | — |

**Anti-gimmick rules**, which the validator and the engine enforce:
1. **Every motion answers who, to whom, which thing, what happens, or how they feel.** Anything else is ambient: at most one small loop per place, which stops after 20 s without input and never runs during a gloss popup or a spot.
2. **One gesture and one move per speaker per line**, plus at most two listener reactions. A gesture needs a word to motivate it (lint).
3. **Teaching overlays** (case arcs, owner tags, *daha/en* tags) show **in Kerim's spots or when a suffix is tapped**, never on every line.
4. **Reading pace belongs to the learner.** Nothing auto-advances. *Devam* is never blocked: tapping it mid-animation jumps to the end pose. Tapping a line in the log replays its staging.
5. **Nothing needs sound.** Mouth timing runs from the text, and every sound has its written sound word. Sound is off until the learner turns it on.
6. **Motion settings: Full, Calm, Still,** with `prefers-reduced-motion` meaning Still. Every gesture has a static key pose that reads without motion.
7. **No celebration inside the story.** Stars and confetti come only at the end.
8. **Music never plays under speech.** It plays only at scene changes and at the end.

## 3. From a story to a script

Kumru's story adapter, `adaptStory` in `sahne/packages/sahne-story`, turns a story document into a Sahne script (`sahne/packages/sahne/DESIGN.md` §5.6), with a card for each turn and the translations beside each cue, never in it. Kumru imports it in M8 (`ROADMAP.md`); today the gallery's Stories (`#/stories/<id>`) plays the bakkal scene (`sahne/packages/sahne-story/test/fixtures/bakkal.json`) and the s1e01 draft (`?story=s1e01`) through it:

| Story step (`STORIES_SCHEMA.md` §4) | Script cue |
|---|---|
| `scene` | `scene` (the place id is the set id) |
| line | `line` with `text` = `tr` after `personalizeStr`, staging fields passed through unchanged |
| Kerim's narration (`who:"kerim"`, `narr:true`) | `line` for Kerim's narrator inset, `to:"viewer"` |
| a stand-in line | the reply card (section 7), then a `line` for `nima` |
| `beat` (new) | `beat`: a staging moment with no speech |
| `act` (new) | `act`, whose result goes back to the story like a choice; its `react` for the result becomes a `beat` |
| `spot` | `overlay`, with Kerim acting the grammar out |
| `choice` | the reply card with its options; the picked line and its reactions become cues |

- **Cast.** `nima` is the learner's avatar (Nima's own `look` when the learner has none yet). Every other id is the avatar document in `data/characters/<id>.json` (`STORIES_SCHEMA.md` §5).
- **Translations** (`en`, `fa`) never reach the stage. They stay in the log and the reply card.
- **Personalisation** runs on every text that reaches the stage: lines, labels and phone screens. The host passes its own function (`personalizeStr`); the adapter also runs it on `link` keys, sound words, an act's prompt, a spot's example and the display names.
- **Branches.** `perform(picks)` gives the script for the learner's picks (a choice's option index, the target an act ended on); the page replaces the cues from the card on with `setCues`, and the other branches go to `load.extra` so their art is built up front.
- **Callbacks.** `if` / `unless` lines follow the flags the host passes.
- **Props.** Each place the story visits gets its own props plus the story's props that stand there (`storyProps` in `src/props.ts`), marked `keep`, so the engine carries their count, showing and parameters from place to place (`STORIES_SCHEMA.md` §3).
- **Looks.** The adapter works out what everyone wears at each step (`STORIES_SCHEMA.md` §5.2): `load.cast` is what they wear when the story opens, every other set of clothes goes to `load.wardrobe` (keyed by outfit name, or `look1`, `look2` … for inline looks), and a scene, line or beat that changes clothes carries the script's `costume`. The learner rule (only `outer` and `wear.hat`) is applied here.

## 4. Staging in story files

Story lines carry the script's staging fields as they are (`sahne/packages/sahne/DESIGN.md` §5.6). Writers stage while writing, so the text fits the scene (option A of the 2026-10-08 decision, closed on 2026-10-09: section 11).

The 2026-10-09 review found staging the old vocabulary could not express. Each gap now has a field:

| Gap in the briefs | Solved by |
|---|---|
| Phone and video calls (s1e08 split frame, s1e19, s1e24, s1e35, s1e37, s1e40) | `via: "phone"` or `"video"`; `cam: "split"` |
| The clock tick (s1e39, s1e47), the radio's "Gol!" (s1e13) | `sfx` with its sound word |
| Nima's freeze and the "…" card (s1e08, s1e24, s1e39, s1e47) | `emo: "nervous"`, `voice: "silent"`, and a `beat` for the tick and the silence |
| The learner's face acting (every arc beat) | The face texture on the learner's avatar (`DESIGN.md` §6.4) |
| The Tehran-time watch, "Saat… on?", the hands moving back (week 5, s1e25, s1e41) | Clock and watch props with `time`; `obj` `set` |
| Body parts named on a person (s1e34) | `at` / `link` to `ch:<id>.<part>` |
| Kerim flying through a story (s1e24, s1e35, s1e44) | `move` with `how: "fly"`; `cam: "follow"` |
| Golden hour, lights on, night, a cold dawn (s1e35, s1e37, s1e46) | Scene `time`; `env: "lights_on"`, `env: "fireworks"` |
| The group photo, the photo sent home with a heart (s1e35, s1e46) | `cam: "photo"`; the phone prop's `screen` |
| Small pictures of past weeks (s1e41) | `frame: "past_inset"` |
| Silent laughter, whispering, mouthing (s1e34, s1e38, s1e46) | `voice: "silent"`, `"whisper"`, `"mouthing"` |
| Crowds: 11 figures on the ferry (s1e48), the kindergarten row (s1e46) | Simplified puppets for silent extras (`DESIGN.md` §12) |

The table is the spec. What the engine does with each row today (`sahne/packages/sahne/src`, 2026-10-10):
- **Built:** `sfx` with its sound word (B3); the freeze, with the `nervous` face, `voice: "silent"` and a `beat` (the bakkal scene's cue 6); faces on every avatar (B2, B4); `voice: "whisper"` and `"mouthing"`; body-part targets `ch:<id>.<part>` (B5's hit tests); the `obj` `set` op, and the kit's clock set piece takes a `time`; scene `time`, and `env: "time:…"` to change it mid-scene.
- **In the script format only:** `via` (the lint checks that the speaker is off stage); `cam: "split"` and `"photo"`, which are framed like an ordinary shot for now; `frame: "past_inset"`. (`cam: "follow"` is built: `sahne/packages/sahne/DESIGN.md` §6.6.)
- **Built in M1:** Kerim's bird puppet (`sahne-kit/kerim`): she perches, flies (`move` with `how: "fly"`) and hovers at `air` marks; nobody on stage turns to her narration, and a shot leaves her out unless it is `single`, `close` or `follow`.
- **Not built:** `env: "lights_on"` and `"fireworks"`; the simplified puppets for silent extras.

**Story lints** (`lintStory` in `sahne/packages/sahne-story`, reading the Turkish with `sahne/packages/sahne-tr`; `sahne/packages/sahne-story/stories.ts --check` runs them over every draft in `pnpm sahne check`). Each problem names its step (and option), and most carry the staging that fixes them:
- **Deixis.** *bu/şu/o* + noun needs a deixis gesture with `at`, and they must agree: *bu* is near, *o* is far.
- ***var/yok*.** A *var/yok* line about a linked prop needs the prop shown or hidden by then.
- **Numbers.** A number before a linked prop must match `n`.
- **Budget.** One gesture per speaker per line, and a word must motivate it.
- **`via`** needs the speaker to be off stage.
- **`voice: "silent"`** goes only on a stand-in line whose text is "…".
- **Time.** Every clock time said aloud matches a clock on stage, when one is linked.
- **Link.** Every `link` key is a word of its line, and every `obj:` target (`at`, `link`, `obj`) is a prop on stage at that point.
- **Props.** A story prop stands only in places the story visits, on marks they have, and its id shadows no prop of those places.
- **Stand-in.** No two stand-in lines in a row; the learner's first turn within the first four lines (section 7).
- **Mechanics.** An `act` only in a week whose `arc.mechanics` has `act`.
- **Route.** With the places' solid lines (`LintOptions.solids`, from `placeSolids`), a walk that goes round a wall, a railing or a closed gate is a warning (how much longer it is), and one with no way through an error: the stage walks the same way (`sahne/packages/sahne/DESIGN.md` §7). Move a mark, add a `via`, or stage an `enter`/`exit` through the gate's door mark.
- **Look.** Every look names a character of the story (not Kerim) and an outfit they have, or only clothing slots; it never takes off `top`, `bottom` or `shoes`, and it sits only on a top-level scene, line or beat. With the kit, every look and outfit composes with no part refused, out of its slot, wrong for the build, or dropped for size. Warnings: a look for the learner beyond `outer` and `wear.hat`, and a look that changes nothing.
- **`--suggest`** (`suggest()`) proposes `link`, `do`/`at` and `obj` show/hide from these same patterns, so staging stays quick to write.

The walk keeps who stands where (scene `at`, `move`), which props are shown and who holds them (`obj`), and plays scene changes as the engine does (a scene in the same place keeps the props; a new place brings kept props as they were), so *bu* is near (≤ 1.5 m on the floor plan) and *o* is far (≥ 3 m) when the gesture is a plain `point`; a word names a prop through `link`, or through the prop's id or card term (`süt` → `sut`, `a1-w-sut`). *bir* before a noun is the article unless a count says otherwise. A choice's options are each checked from the same state; the story goes on from the first.

## 5. Mechanics per week

The engine supports every mechanic (`DESIGN.md` §9). Each weekly arc names the ones its stories use, in `arc.mechanics` (`STORIES_SCHEMA.md` §3). A story uses only those its week names.

| Mechanic | Good for | A1 default *(proposed; decided week by week)* |
|---|---|---|
| `say` (the reply card) | every stand-in turn | always on |
| `explore` (tap a person or thing for its word) | concrete nouns, places | from week 1 |
| `act` (tap, drag, go, choose on stage) | *bu/şu/o*, *var/yok*, *ver/al*, *-(y)A* and *-DAn*, numbers | from week 2, at most 2 per story |
| `aloud` (say it aloud) | short fixed phrases | from week 2, only where the learner turned it on |
| `unlocks` (avatar items) | the album and the season's end | from week 4 |

An act turn's result counts like a choice: characters react, the warmth may move, and the plot never branches.

## 6. The reader's layout

- **Log mode** (phones held upright):
  - The stage is on top at 16:10, sticky and collapsible. The log is below it, and the footer holds *Devam* or the reply card.
  - On screens under 700 px tall, during a choice with three options, the stage shrinks to 16:6 and the line being answered shows as a bubble on stage, so the learner can always see what they are answering.
- **Theatre mode** (phones held sideways, tablets, or a toggle): the stage fills the screen, lines show as bubbles, the reply card floats over the stage, and the log is a drawer.
- **Taps on the stage** explore when the week turns `explore` on. Otherwise a tap does nothing; only *Devam* advances.
- **Words in the bubbles** are tap-to-translate when the learner's glosses setting is on: dotted underlines on the words that have a gloss, one tap for the popup, as in the log (`DESIGN.md` §6.8). The page passes its own lookup (cards and the story's `gl`) and its own popup.

## 7. The learner says their own lines

**Every line of the stand-in is chosen by the learner, even when there is only one option** (decided 2026-10-08).
- **The card.** When it is the learner's turn, the footer's *Devam* button is replaced by a reply card, in thumb reach. It shows:
  - the Turkish line, with every word tappable for its gloss, as in the log;
  - its translation, following the level's translation fade;
  - a *Söyle* (say) button.
- **Söyle.** Tapping it says the line: the learner's character speaks and gestures, the voice plays if sound is on, and the line enters the log.
- **Say it aloud.** When the week and the learner turn `aloud` on, the card also has a microphone. Speaking the line counts like tapping *Söyle*, and a tap always works too.
- **The "…" card** (`voice: "silent"`) has no words, and its button reads *…* rather than *Söyle*. The character freezes: no voice, no mouth, the `nervous` face.
- **A real choice** uses the **same card in the same place** with 2–3 options. Only the number of options differs.

Why:
- **Training.** The learner has picked their own line on every turn, so a real choice is never a surprise and is never skipped by habit.
- **Reading.** They read their line before saying it, a small act of attention a passive line never gets.
- **Role.** The learner plays the newcomer instead of watching one.

The validator checks that each stand-in turn is one card (no two stand-in lines in a row), and that a story gives the learner a turn within its first four lines.

*Proposed for later:* from A2, some single-option cards become *build the line* (word tiles, as on the Path).

## 8. Kerim on stage

- **A paper bird.** Kerim is a puppet on the `bird` skeleton, generated from the mascot's own paths (`K_HEAD`, `K_BIRD` in `sahne/packages/sahne-kit/src/kerim/art.ts`, which Kumru imports too; converted by `sahne/packages/sahne-kit/kerim/build.ts`), so the app's Kerim and the stage's Kerim stay one drawing. The puppet is `sahne/packages/sahne-kit/src/kerim/` (exported as `sahne-kit/kerim`, about 45 cm on stage); a story casts her through her character document's `puppet: "bird"`. The narrator inset is drawn by the host (`narratorEl`; the gallery uses `sahne/packages/sahne-gallery/src/kerim.ts`). Kerim is a cute three-quarter kumru with İznik accents, whose eyes change with the mood.
- **Two presences:**
  - The **narrator inset** is a small round window in a corner, for narration, asides to the learner and spots. It shows the head crop, which carries every mood's eyes.
  - **In the world** Kerim sits on the place's `perch` mark, flies between marks and places (`move` with `how: "fly"`), and acts out grammar in spots: case paths, counting with wing feathers, pointing with a wing.
- **Emotions** map onto the moods (`EMO` in `sahne-kit/kerim`): happy/proud/surprised → happy, laugh → cheer, sad/sorry/moved → sad, curious/confused/shy → think, tired → sleepy, nervous → a hunch, neutral/annoyed → idle.
- **Weather moods.** The briefs ask for weather on the feathers: shivering, dripping, fluffed. These are kit poses on the skeleton.
- **Sound.** Kerim's coo is a synthesized patch, and the motif opens and closes the stories.
- **Pisi and the gulls** are kit puppets too (`sahne-kit/puppets`, beside Kerim's `sahne-kit/kerim`): a cast entry `{ "puppet": "cat" }` is Pisi, a black street cat on the cat rig, and `{ "puppet": "gull" }` a gull on the bird rig. Both are side-on: they turn by mirroring and never take a seat. Pisi's posture follows its emotion (neutral sits, happy loafs, tired sleeps, surprised stands, nervous crouches); walking it strides, with silent paws. Its gestures are `look` (at a target), `meow` (cue the kit's `meow` sound beside it), `yawn`, `eat` (it gets up to the bowl) and `paw`. A gull perches, flies and hovers like Kerim, with `look` and `flap`. Gallery: `#/kit/animals`.

## 9. The A1 art list

- **Characters:**
  - 19 humans (`STORIES_CAST.md` §4, without Kerim and Nima), built as avatar documents from the kit plus at most two custom parts each;
  - Kerim, the street cat Pisi, gulls;
  - **generic extras** (classmates of other classes, the clerk, the *çaycı*, the *usta*, the librarian, crowds, the kindergarten children), generated from the kit with fixed seeds.
- **Places:** the 28 in `STORIES_WORLD.md` §2, including four vehicle interiors (the metro, the bus, the taxi, the ferry deck).
- **Props:** a script lists every prop the briefs name (bread, simit, milk, tea glasses and tray, phone screens, clocks and the watch, suitcase, contract, appointment slip, keys, flash cards, yarn and needles, flowers, flags, cake and candles, honey, the Farsça jar, books and the red book, old photos, the ticket machine and number slips, the boiler and toolbox, the guide frame, Alex's sign, and more).

## 10. The first scenes

The engine's build steps (B0–B5) are recorded in `DESIGN.md` §15, and what is next is in `ROADMAP.md`. The stories' test scene is İsmail's `bakkal` (shelf, counter, fridge, bread, simit, milk), with İsmail, the stand-in (a random learner avatar), and Kerim on the awning.

| # | Cue | Staging |
|---|---|---|
| 1 | İsmail → Nima: *Hoş geldiniz! Buyrun.* | `move` nima door → counter; `do: "welcome"`, `emo: "happy"`; the shop doorbell |
| 2 | Nima: *Ekmek var mı? Süt var mı?* | A one-option reply card; after *Söyle*: `emo: "curious"`, `do: "look"`, `at: "mark:shelf"` |
| 3 | İsmail: *Ekmek var. Şu ekmek çok taze.* | `do: "point"`, `at: "obj:ekmek"`, `react: {nima: {do: "look", at: "obj:ekmek"}}`, `link` ekmek |
| 4 | İsmail: *Ama süt yok.* | `obj: [{id: "sut", op: "hide"}]` (dashed outline), `do: "shrug"`, `emo: "sorry"` |
| 5 | Choice for Nima: *İki ekmek, lütfen.* / *İki ekmek ver.* | The same card with two options. Polite: İsmail `happy` and `nod`, `give` with `n: 2` (*Buyrun!*). Blunt: a raised brow, a beat, then he gives (*…Buyrun.*). No confetti |
| 6 | İsmail, quickly: *Başka bir şey?* Then Nima's "…" card | İsmail `tempo` up, `do: "explain"`; Nima's card is "…" (`voice: "silent"`, `emo: "nervous"`); the shop clock ticks (`sfx`); Kerim, kindly, from the inset: *Yavaş yavaş…* |

The scene is built in the gallery (B2, `sahne/packages/sahne-gallery/src/bakkal.ts`): cue 1's Nima enters through the shop door to a `customer` mark at the counter, and cue 6 is three cues (İsmail's line; Nima's "…" with the clock's *tik tak*; Kerim's line). Since B3 it also plays with sound: Kerim's theme on *Başla*, the shop's street and fridge ambience, the doorbell, steps and the door as Nima comes in, the lines in the browser's Turkish voice with each character's pitch and rate, the clock's tick in Nima's silence, Kerim's coo before she speaks, and the stinger after the last line. With sound off, the sound words show as bubbles instead.

**Pass criteria (all must hold):**
1. **Understanding without translation or sound.** 3–5 Persian-speaking A1 learners from the owner's circle, with the translation off and the sound muted, say who speaks, to whom, what is meant or happens, and which loaf "şu ekmek" is, for cues 2–6.
   - At least 80% correct, and at least 20 points above the same lines on today's busts.
   - Both choice reactions read as polite or blunt, and cue 6 reads as "Nima is stuck".
   - This is a hallway test, not an experiment.
2. **Speaker at a glance.** From a 1-second screenshot of each line, the speaker is named correctly at least 90% of the time.
3. **Performance.** On one real low-end Android (or Chrome with a 6× CPU throttle):
   - a median of at least 50 fps during transitions;
   - no long task over 50 ms after the first open;
   - the stage visible within 500 ms of opening, with a warm cache;
   - no frames drawn at rest.
4. **Size.** Engine, Turkish plugin and the kit parts used here stay within `DESIGN.md` §12.
5. **Still mode.** With reduced motion, cues 3–6 still pass criterion 1 from end poses alone.
6. **Avatars.** 20 random learner avatars, covering every build, shape, hair, headwear and outfit, render without clipping and act every emotion.
7. **Small screens.** At 375 × 667, the stage, the line being answered and a three-option card fit without scrolling.
8. **Authoring.** A fresh agent session, given only the kit's notes and `STYLE.md`, adds Farzad and his flat, and the owner judges them consistent in style.

**Kill criteria.** If criterion 1 shows no clear gain over the busts, keep the paper look for the avatars and the builder, but cut the gesture set and spend the effort on text features. If criterion 3 fails, ship with Calm as the default and simplify the shaders.

## 11. Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Direction | **Sahne**, paper theatre in 2.5D, drawn by Claude in code, in its own package (2026-10-09, `DESIGN.md` §1). It replaces the SVG rig of 2026-10-08 |
| 2 | Busts or full bodies | **Full bodies with big heads** (adults about 1:3, children about 1:2.4, toddlers about 1:2). Arms and hands point, hold and give. Legs enter, leave, walk and sit, which carry *-(y)A*, *-DAn*, *gel*, *git* and *otur*. The camera brings faces close enough to read (2026-10-08) |
| 3 | Stage on phones | **Yes:** 16:10, sticky and collapsible, plus theatre mode (section 6) |
| 4 | Line format before writing | **Option A, closed 2026-10-09:** stories are written with their staging. The fields are `DESIGN.md` §5.6 and `STORIES_SCHEMA.md` §4.2. The briefs already stage in prose |
| 5 | Art delivery | The kit ships with the engine; places are small place documents (`DESIGN.md` §5.5); characters are avatar documents (§5.2) |
| 6 | Defaults | Motion is Calm on low-end phones; the word-by-word highlight is on only while a voice plays; sound is off until turned on |
| 7 | Learner body | **The full avatar kit** (`DESIGN.md` §10): any build, shape, face, hair and clothes. Old avatars are dropped and learners design new ones (2026-10-09) |
| 8 | The open characters | Kırlangıç's, Farzad's and Rayan's open details are decided, and Nani's before A2; then they are drawn |

## Sources

- Asher, J. J. (1969). The total physical response approach to second language learning. *Modern Language Journal* 53(1).
- Berney, S., & Bétrancourt, M. (2016). Does animation enhance learning? A meta-analysis. *Computers & Education* 101.
- Brom, C., Stárková, T., & D'Mello, S. (2018). How effective is emotional design? A meta-analysis. *Educational Research Review* 25.
- Chang, A. C.-S. (2009). Gains to L2 listeners from reading while listening vs. listening only. *System* 37(4).
- Chun, D. M., & Plass, J. L. (1996). Effects of multimedia annotations on vocabulary acquisition. *Modern Language Journal* 80(2).
- Clark, J. M., & Paivio, A. (1991). Dual coding theory and education. *Educational Psychology Review* 3(3).
- Gerbier, E., Bailly, G., & Bosse, M.-L. (2018). Audio–visual synchronization in reading while listening to texts. *Computer Speech & Language* 47.
- Hardison, D. M. (2003). Acquisition of second-language speech: effects of visual cues… *Applied Psycholinguistics* 24(4).
- Höffler, T. N., & Leutner, D. (2007). Instructional animation versus static pictures: a meta-analysis. *Learning and Instruction* 17(6).
- Kelly, S. D., McDevitt, T., & Esch, M. (2009). Brief training with co-speech gesture lends a hand to word learning in a foreign language. *Language and Cognitive Processes* 24(2).
- Küntay, A. C., & Özyürek, A. (2006). Learning to use demonstratives in conversation: what do language-specific strategies in Turkish reveal? *Journal of Child Language* 33(2).
- Macedonia, M., & Knösche, T. R. (2011). Body in mind: how gestures empower foreign language learning. *Mind, Brain, and Education* 5(4).
- Mayer, R. E. (2021). *Multimedia Learning* (3rd ed.). Cambridge University Press.
- Mayer, R. E., & DaPra, C. S. (2012). An embodiment effect in computer-based learning with animated pedagogical agents. *Journal of Experimental Psychology: Applied* 18(3).
- Ouwehand, K., van Gog, T., & Paas, F. (2015). Designing effective video-based modeling examples using gaze and gesture cues. *Educational Technology & Society* 18(4).
- Plass, J. L., Chun, D. M., Mayer, R. E., & Leutner, D. (1998). Supporting visual and verbal learning preferences in a second-language multimedia learning environment. *Journal of Educational Psychology* 90(1).
- Rey, G. D. (2012). A review of research and a meta-analysis of the seductive detail effect. *Educational Research Review* 7(3).
- Rey, G. D., et al. (2019). A meta-analysis of the segmenting effect. *Educational Psychology Review* 31.
- Schneider, S., Beege, M., Nebel, S., & Rey, G. D. (2018). A meta-analysis of how signaling affects learning with media. *Educational Research Review* 23.
- Schroeder, N. L., Adesope, O. O., & Gilbert, R. B. (2013). How effective are pedagogical agents for learning? *Journal of Educational Computing Research* 49(1).
- Sueyoshi, A., & Hardison, D. M. (2005). The role of gestures and facial cues in second language listening comprehension. *Language Learning* 55(4).
- Sundararajan, N., & Adesope, O. (2020). Keep it coherent: a meta-analysis of the seductive details effect. *Educational Psychology Review* 32.
- Taguchi, N. (2015). Instructed pragmatics at a glance. *Language Teaching* 48(1).
- Tyler, A. (2012). *Cognitive Linguistics and Second Language Learning*. Routledge.
- Um, E., Plass, J. L., Hayward, E. O., & Homer, B. D. (2012). Emotional design in multimedia learning. *Journal of Educational Psychology* 104(2).
- van Gog, T., Paas, F., Marcus, N., Ayres, P., & Sweller, J. (2009). The mirror neuron system and observational learning. *Educational Psychology Review* 21.
- W3C WCAG 2.2: SC 2.2.2 Pause, Stop, Hide; SC 2.3.1 Three Flashes or Below Threshold; SC 2.3.3 Animation from Interactions.
