# Story cast

This doc has every character of the story series: the roster, one full sheet per character, who says *sen* or *siz* to whom, and what each one owns. The rules for making characters (names, balance, mistakes, growth) are in section 1. A `characters` document holds the short version of each sheet in the fields of `STORIES_SCHEMA.md` §5. The stories' characters are the roster in `data/characters/<id>.json` (one file each, read by every story that names them; moved there from `sahne/packages/sahne-story/cast/` in M8, when the old series' 10 characters were deleted).

Status: **A1 cast complete except for a few open details** (2026-10-09; Farzad's look and personality decided on 2026-10-10). The roster's documents are in `data/characters/<id>.json` (all of A1, 2026-10-23; Kırlangıç's and Rayan's are placeholder looks until theirs are decided), with the generic extras (`kind: "extra"`) in the same folder; the gallery shows them at `#/cast`. Where a sheet asks for a custom part, the document uses the kit's own value: İsmail's moustache is `moustache_thick`, Maria's grey bun `hair_bun_pinned`. Items marked *proposed* are drafts for review. An open detail is marked **open**. A2 and B1 storylines are decided in later weeks.

## 1. Rules for making characters

- **A full reset.** Every character is new, including the learner stand-in and the narrator. No old character id is reused.
- **Core cast:** 6–8 at A1. A2 and B1 each add 2–3 new voices, and the core keeps coming back.
- **Balance:** roughly even gender; mostly aged 18–30, a few elders and one kid. This is decided case by case.
- **Names:** real, common Turkish names (foreign classmates keep names from their own countries), with a mix of regions and backgrounds.
  - No two main names share a first letter or sound alike. Accepted exceptions: Kerim and Kırlangıç, Reza and Rayan, and Nima and Nani (learners see their own name in Nima's place).
  - No name is also a common Turkish word a story might use, because `personalizeStr` and tap-to-translate would collide. The current *Ada* also means "island", which clashes with *Adalar*. *Kırlangıç* and *Zafer* are words too, so they are always glossed as names.
- **Cast size per story:** 2–4 speakers in an episode and up to 6 in a special. Non-speaking extras, such as classmates in the background, don't count. Neither do Kerim's narration and spots. The story tile shows 3–4 avatars.
- ***sen* / *siz* is fixed per relationship.** It changes only on purpose, inside a story ("Bana *sen* diyebilirsin").
- **Dialect:** standard Istanbul Turkish at A1. From A2/B1, some characters show real written dialect features, with a note on the line.
- **Mistakes are rare.** Only foreign classmates make them, only common learner mistakes (vowel harmony, the wrong case, a missing buffer *y*), and someone always corrects them, usually the hoca, as a teaching moment. Native characters never speak incorrect Turkish.
- **Growth across levels:**
  - Characters speak more naturally as the learner levels up. In the story world, people simplify less because the newcomer understands more.
  - Every core character has a personal arc.
  - Classmates progress too: they pass, repeat a level or leave.
  - Relationships change: strangers become friends, and there are conflicts and reconciliations.

## 2. Decisions (2026-10-09)

- **Two new women join A1** to even the balance (*proposed*: Dilnoza and Gülten Hanım, section 7).
- **Nima keeps the name.** Nima and Nani share a first letter and sound alike. This is an accepted exception to the naming rule, because learners see their own name in Nima's place.
- **The A1 exam results** and the classmates' A2 storylines are decided in later weeks. The A1 sheets stop at week 8.
- **Name glosses.** *Kırlangıç* ("swallow") and *Zafer* ("victory") are also Turkish words. Every story that uses them glosses them as names in `gl`.
- **Parvaneh is written *Parvane*** in Turkish lines, as Turks would spell it, with the suffixes *Parvane'nin* and *Parvane'ye*. She is *Parvaneh* in English and پروانه in Persian (*proposed*).
- **Kırlangıç is پرستو in Persian lines.** *Kırlangıç* is the Turkish for پرستو (swallow).

## 3. Open details

Still to be decided: Kırlangıç's age, personality, catchphrase and look; Farzad's age and catchphrase; Rayan's favourite things and look; Nani's sheet, before A2 is written. More recurring guests may join in A2 and B1.

## 4. Roster (A1)

`order` is the gallery order. Counts come from the 48 decided A1 briefs after the season review and the Truby review (2026-10-09): stories where the character speaks, plus stories where they are a silent extra. **Core** is in 10 or more stories, **recurring** in 4–9, **occasional** in 1–3.

| # | id | Name | Persian | Tier | Circle | Who | First appears · stories (speaks + extra) |
|---|---|---|---|---|---|---|---|
| 1 | `kerim` | Kerim | کریم | core | narrator | The kumru on the rooftops | s1e01 · 48 |
| 2 | `nima` | Nima | نیما | core | stand-in | The learner | s1e01 · 48 |
| 3 | `farzad` | Farzad | فرزاد | core | old friends | Computer engineer, Nima's host | s1e01 · 13 (11 + 2; s1e40 is one option's phone call) |
| 4 | `kirlangic` | Kırlangıç | پرستو | core | old friends | A TÖMER student a few levels up; knits | s1e02 · 11 (10 + 1) |
| 5 | `rayan` | Rayan | رایان | recurring | guest | Kırlangıç's son, 3 | s1e06 · 7 (2 + 5) |
| 6 | `ismail` | İsmail (İsmail Abi) | اسماعیل | recurring | neighbourhood | Bakkal owner by the TÖMER campus, 50s, from Rize | s1e05 · 4 (3 + 1) |
| 7 | `berfin` | Berfin | برفین | recurring | neighbourhood | Runs a tiny café in Feriköy, 20s, from Diyarbakır | s1e31 · 4 |
| 8 | `elif` | Elif | الیف | recurring | neighbourhood | Nurse, 40s, from İzmir; lives downstairs | s1e14 · 8 (4 + 4) |
| 9 | `serkan` | Serkan | سرکان | recurring | neighbourhood | Elif's husband, 40s, taxi driver, Beşiktaş fan | s1e13 · 9 |
| 10 | `omer` | Ömer | عمر | recurring | neighbourhood | Their son, 5–6 | s1e13 · 9 |
| 11 | `maria` | Maria Teyze | ماریا | core | neighbourhood | Rum elder upstairs; turns 80 on 10 Oct | s1e14 · 11 (9 + 2) |
| 12 | `gulten` | Gülten Hanım | گولتن | occasional | neighbourhood | The florist on the corner in Feriköy, 60s, exact | s1e30 · 3 (1 + 2) |
| 13 | `zafer` | Zafer Hoca | ظفر | core | TÖMER | The A1 teacher | s1e03 · 17 |
| 14 | `parvaneh` | Parvane / Parvaneh | پروانه | core | TÖMER | Classmate from Isfahan, bold | s1e03 · 22 (15 + 7) |
| 15 | `yusuf` | Yusuf | یوسف | core | TÖMER | Classmate from Aleppo; needs B2 for medicine | s1e03 · 21 (10 + 11) |
| 16 | `alex` | Alex | الکس | core | TÖMER | Classmate from St Petersburg; works nights | s1e03 · 20 (6 + 14) |
| 17 | `dilnoza` | Dilnoza | دلنوزا | core | TÖMER | Classmate from Samarkand | s1e02 · 28 (17 + 11) |
| 18 | `reza` | Reza Bey | رضا | occasional | TÖMER | International office; the residence permit | s1e02 · 3 |
| 19 | `tolga` | Tolga Bey | تولگا | recurring | guest | Estate agent (emlakçı) in Şişli, 30s, talks too fast, says "yarın"; A1's comic opponent | s1e08 · 5 |
| 20 | `hatice` | Hatice Abla | خدیجه | occasional | guest | A stallholder at the Feriköy Saturday market, 50s | s1e12 · 2 |
| 21 | `newcomer` | (a new student, unnamed) | — | occasional | guest | Lost, with a suitcase, at Berfin's café; then at the library | s1e36 · 4 (2 + 2) |

**Balance.** Leaving out Nima (the learner) and Kerim (the narrator), A1 has 9 men or boys and 7 women. The classroom has Parvaneh, Dilnoza, Yusuf and Alex: 2 and 2. Alex speaks in only 6 stories; his thread (the night job) carries him. The A2 and B1 newcomers should still be mostly women. Nani is the first.

## 5. *sen* and *siz*

Each pair is listed once, as the A1 briefs have it. "→" switches happen inside a story, with the line marked (`STORIES_SCHEMA.md` §4.1, `note`). Children say *sen* to everyone.

| Pair | A says to B | B says to A | Note |
|---|---|---|---|
| Nima · Farzad | sen | sen | Old friends |
| Nima · Kırlangıç | sen | sen | |
| Nima · Rayan | sen | sen | |
| Nima · İsmail | siz | siz | A shopkeeper and a customer; warm but formal all through A1 |
| Nima · Berfin | siz → sen | siz → sen | "Bana *sen* diyebilirsin!" on the guide tour (s1e36) |
| Nima · Elif | siz (*Elif Hanım*) | sen | Motherly, from the first meeting (s1e14) |
| Nima · Serkan | siz → sen | sen | "Bana 'sen' de, komşu!" on the stairs, moving day (s1e13) |
| Nima · Ömer | sen | sen | |
| Nima · Maria Teyze | siz | siz | Her old-fashioned courtesy. She never switches |
| Nima · Gülten Hanım | siz | siz | |
| Nima · Zafer Hoca | siz | siz | He says *siz* to each student and to the class |
| Nima · Reza Bey | siz | siz | |
| Nima · Tolga Bey | siz | siz | |
| Nima · Hatice Abla | siz | sen, *canım* | The market voice |
| Nima · classmates, the newcomer | sen | sen | Parvaneh, Yusuf, Alex, Dilnoza. The newcomer's "hocam" to Nima is a joke (s1e38) |
| Farzad · Kırlangıç | sen | sen | |
| Elif · Serkan | sen | sen | |
| Elif · Maria Teyze | siz | sen | Neighbours for decades |
| Berfin · Serkan | sen | sen | A regular at the café (s1e42) |
| Zafer Hoca · İsmail | siz | siz, *hocam* | His morning tea (s1e44) |
| Zafer Hoca · classmates | siz | siz | |
| Classmates among themselves | sen | sen | |
| Kırlangıç · Parvaneh | sen | sen | |

## 6. Who owns what

| Domain | Owner |
|---|---|
| Food and shopping | İsmail |
| Transport and city | Kerim, Berfin, Serkan (taxi: *sağdan, soldan, burada durun*) |
| Study | Zafer Hoca, Kırlangıç |
| Bureaucracy | Reza Bey, Farzad |
| Home and renting | Tolga Bey, Farzad, Elif |
| Health | Elif → a B1 doctor |
| Work | Farzad, Berfin → a B1 manager |
| Tech | Farzad |
| Clothes and crafts | Kırlangıç, Maria Teyze (a retired seamstress) |
| Culture | Maria Teyze, Kerim |
| Sport | Serkan |
| Numbers, dates, prices | İsmail, Hatice Abla, Tolga Bey, Reza Bey |

| Language function | Owner |
|---|---|
| Slow, repetitive | Kerim, Rayan |
| Formal, classroom | Zafer Hoca |
| Formal, bureaucratic | Reza Bey, Gülten Hanım |
| Service politeness | İsmail, Berfin |
| Casual, young, slang (A2+) | Berfin |
| Child speech | Ömer (5–6), Rayan (3) |
| Proverbs, old courtesy | Maria Teyze |
| Learner mistakes | Yusuf (vowels Arabic lacks), Alex (cases, word order), Parvaneh (false friends, bold guesses), Dilnoza (vowel harmony) |
| Persian bridge | Parvaneh (beginner), Kırlangıç and Farzad (experienced), Dilnoza (Uzbek words shared with Persian) |
| Turkic cousin | Dilnoza (Uzbek: many shared words, different vowels) |
| Dialect (A2+) | İsmail (Black Sea), others later |

## 7. Character sheets

**Note (2026-10-09):** The *Arc (A1)* lines below are rewritten from the 47 A1 briefs after the season review, including the season threads (`STORIES_A1.md`, *Season threads*). Where a sheet and a brief disagree, the brief wins.

Sheet format:

```
Name           Turkish · Persian · suffixes
Age · origin · job
Circle · tier  first appears
Language role  the register or speech style they model
Topic domain   the vocabulary they own
Personality    strength · flaw · catchphrase (tr / en / fa)
Relationships  besides section 5
Arc (A1)       what happens to them in A1; A2/B1 later
Signature      3–5 structures they naturally use
Look           the avatar document, from the Sahne kit (STORIES_SCHEMA.md §5.1)
Motion         tempo · energy · signature gestures
Colour         a colour family; the hex is fixed in the /stage gallery pass
```

### Kerim, the narrator (decided)
```
Name           Kerim · کریم · Kerim'in, Kerim'e, Kerim'le
Kind           kumru: Eurasian collared dove (Streptopelia decaocto), lives on rooftops.
               "kumru" is an A2 card (also İzmir's toasted sandwich): a ready-made joke for A2.
               Kerim is "she" (the owner, 2026-10-09)
Circle         everywhere; spans A1–B1
Language role  slow, clear, repetitive Turkish (like a dove's coo): the A1 comfort voice.
               Breaks the fourth wall: talks to the learner directly for grammar spots,
               recaps and "Fark ettin mi…?" (Did you notice…?)
Topic domain   the city: districts, transport, weather and seasons; carries the culture
               the plot shows (never lectures)
Personality    gentle, wise, a patient city-watcher · knows every rooftop and likes to show
               it · "Ku-ku-ku… yavaş yavaş." / "Coo-coo-coo… slowly, slowly." /
               «کو-کو-کو… آهسته آهسته.»
Relationships  watches over the stand-in from the window ledge; nobody knows the name until
               Maria Teyze hears the coo, *yâ kerim* (s1e18); nobody knows Kerim's age
Arc (A1)       meets Nima eye to eye at the viewing (s1e09); named on the roof (s1e18); flies
               ahead in the treasure hunt (s1e24); leads Nima to the perch on the water
               tank, Kerim's secret, after the permit setback (s1e35); Kerim's own day, and the
               word "kumru" left on Nima's desk (s1e44)
Arc            at A1 Kerim repeats and simplifies; by B1 speaks normally and expects more
Signature      repetition with variation (Bu bir simit. Bir simit. Sıcak bir simit.);
               questions to the reader; -DI past for "when I was young" stories (from A1 unit 5)
Look           the app's mascot (K_HEAD, K_BIRD and KERIM_CAST in sahne/packages/sahne-kit/src/kerim/art.ts,
               pup() in app/ui/kerim/kerim.ts; AGENTS.md, Design → Kerim): a cute cut-paper kumru seen three-quarters,
               big head, both eyes on the learner, red eyes that change with the mood, the black
               half-collar, İznik cobalt, turquoise and a coral tulip in the wing. On stage: a paper
               bird puppet generated from the same paths, sitting on the place's perch mark and
               flying through stories and spots (STORIES_STAGE.md §8)
Colour         dove grey
```

### Nima, the stand-in (decided)
```
Name           Nima · نیما · Nima'nın, Nima'ya. Swapped for the learner's own name and
               hometown (personalizeStr). English never says he or she
Age · origin   a young adult, just arrived from Tehran (the default hometown) · new international student.
               Language-neutral: only the hometown token says where Nima is from; no line claims
               a country, a nationality or a language for Nima (STORIES_A1.md, *Season arc*)
Circle · tier  stand-in · core · s1e01
Language role  the learner's voice. Every Nima line is a reply card the learner picks (STORIES_STAGE.md §7)
Topic domain   whatever the week's lessons are
Personality    curious, game for anything · overthinks and freezes, and lets others do the
               talking (the A1 weakness) · no catchphrase: the learner speaks
Need (A1)      to speak before feeling ready, and to stop leaning on others. Self-revelation
               (s1e48): the old life is kept and the new one added: "Tahranlıyım. Ama…
               Feriköy'de oturuyorum." Every beat: STORIES_A1.md, *Season arc*
Arc (A1)       arrives at IST and registers (week 1); finds the Feriköy flat (2); moves in and
               meets the building (3); far from family, a new family (4); the Tehran-time
               watch and Maria Teyze's 80th (5); the Feriköy guide and the permit setback (6);
               the cold flat, the failed mock exam, and speaking up to Tolga Bey (7); the
               Bosphorus tea at last, the exam, and the ferry to Kadıköy (8). The season's
               spine: the Bosphorus wish (s1e15 → s1e46)
Signature      only the week's grammar, never beyond it
Look           the learner's saved avatar on the neutral body with their chosen outfit;
               without an avatar: short dark hair, light olive skin, shirt and trousers
Motion         tempo 1.0 · mid · nod, me, look
Colour         the learner's shirt colour
```

### Farzad
```
Name           Farzad · فرزاد · Farzad'ın, Farzad'a
Age · origin   [open] · Iranian · computer engineer, in Turkey for about ten years
Circle · tier  old friends · core · s1e01
Language role  fluent, practical, city-wise Turkish; the experienced side of the Persian bridge
Topic domain   technology, work, home and renting, bureaucracy
Personality    highly logical, sometimes too much · sometimes a perfectionist · driven by
               helping his family and friends (2026-10-10) · catchphrase:
               [open]
Relationships  Nima's host and oldest friend here; friends with Kırlangıç
Arc (A1)       picks Nima up at IST (s1e01); the welcome dinner (s1e06); the flat at home and
               the contract, which "matters for the ikamet" (s1e10, s1e11); the market and
               the roof (s1e12); moving day (s1e13) and the roof tea (s1e18); a Sunday-lunch
               call (s1e19); Maria Teyze's 80th (s1e30); tries the guide (s1e36, extra);
               on the phone in one s1e40 option: "Sen konuş, Nima!"; leaves food at Nima's
               door before the exam (s1e44, extra); the ferry to Kadıköy (s1e48)
Signature      directions with -(y)A / -DAn ("Metroya bin, Taksim'de in"), -mAk istemek, quick "Hadi!"
Look           (2026-10-10):
               dark-brown hair, a little receding, pulled back into a low bun; a full, neat
               dark-brown beard joined to a moustache, a few grey hairs; dark straight brows,
               brown eyes; light olive skin; adult, average build. Always a t-shirt (black)
               and blue jeans; outside, a light-wash denim jacket (2026-10-12), and in winter the dark long coat instead; indoors the t-shirt
               alone · prop: laptop
Motion         [after the description]
Colour         teal
```

### Kırlangıç
```
Name           Kırlangıç · پرستو · Kırlangıç'ın, Kırlangıç'a (the ç stays
               in writing). Always glossed as a name in gl
Age · origin   [open] · Iranian · TÖMER student a few levels above Nima; Rayan's mother
Circle · tier  old friends · core · s1e02
Language role  the experienced learner: explains, translates, shows where Nima is heading
Topic domain   clothes and colours (knitting), family and childcare, education
Personality    [open: strength, flaw (besides knitting at every chance), catchphrase]
Relationships  finds Nima lost at the TÖMER door; Rayan's mother
Arc (A1)       the first person Nima tries Turkish on, at the TÖMER door (s1e02); the welcome dinner
               (s1e06); the market (s1e12); the roof (s1e18); on the bus with the Tehran-time
               watch (s1e25); knits Maria Teyze's mauve shawl while Nima writes the card
               (s1e29, s1e30); the cold-morning call and the İBB study group (s1e37, s1e38);
               29 Ekim in the park (s1e46, extra); the ferry to Kadıköy, and "Nima, o ne?"
               (s1e48)
Signature      simple explanations with ... demek ("Zor demek: hard"), comparisons with Persian,
               -(I)yor about what she's making
Look           [open] · prop: yarn and needles
Motion         [after the description] · signature: knit
Colour         swallow blue
```

### Rayan
```
Name           Rayan · رایان · Rayan'ın, Rayan'a
Age            3 · Kırlangıç's son · at kindergarten (Nani's class from A2)
Circle · tier  guest · recurring · s1e06
Language role  toddler words: single words and repetition, a mirror of A1
Topic domain   everyday words, animals
Personality    [open: 2–3 things he loves, words he says]
Arc (A1)       "Pilav!" and the red ball at the welcome dinner (s1e06); in his pushchair at
               the market (s1e12); asleep on the roof (s1e18); "Top!" with a yarn ball
               (s1e29); the 80th (s1e30); held up to see Ömer sing (s1e46); points at Kerim
               far over the water, from the ferry (s1e48)
Signature      one-word questions and answers ("Bu?" "Kedi!"), repetition
Look           [open] · toddler build
Motion         tempo 1.3 · high · point, hold_up, run (move)
Colour         sunny orange
```

### İsmail (İsmail Abi)
```
Name           İsmail · اسماعیل · İsmail'in, İsmail'e · "İsmail Abi" to the young
Age · origin   50s · Rize (Black Sea) · owns the bakkal round the corner from the TÖMER campus,
               Taksim (moved from Mecidiyeköy on 2026-10-09, so Nima can drop in before and
               after class)
Circle · tier  neighbourhood · recurring · s1e05
Language role  service politeness: Buyrun, Başka bir şey?, prices; Black Sea dialect from A2
Topic domain   food and shopping, numbers and prices
Personality    generous, knows everyone's business · gossips a little · "Buyrun, buyrun! Taze taze!" /
               "Here you are! Fresh, fresh!" / «بفرمایید، بفرمایید! تازهٔ تازه!»
Relationships  Nima's bakkal by the campus; Zafer Hoca buys his morning tea there; tea from
               Rize behind the counter, always
Arc (A1)       Nima's first shopping alone: kolay gelsin, and a packet of Rize tea (s1e05);
               honey for the voiceless teacher (s1e34); sends Rize tea for the exam through
               Zafer Hoca (s1e44); tea on a tray for the class after the exam (s1e47, extra)
Signature      Buyrun; "... lira"; var/yok about stock; definite objects (Hangi ekmeği?);
               Başka bir şey?
Look           stocky adult · greying hair · moustache (custom part) · shopkeeper's apron · tea glass
Motion         tempo 0.9 · high · welcome, hand_heart, give
Colour         tea green
```

### Berfin
```
Name           Berfin · برفین · Berfin'in, Berfin'e · the name means "snowdrop"
Age · origin   20s · Diyarbakır, Kurdish · runs a tiny café in Feriköy, between the fırın and the
               eczane (moved from Beşiktaş on 2026-10-09); plays the bağlama
Circle · tier  neighbourhood · recurring · s1e31
Language role  fast casual young speech; colloquial forms from A2 (napıyosun)
Topic domain   free time, music, city tips, service work
Personality    quick, funny, knows every shortcut · impatient · "Bir çay daha?" / "One more tea?" /
               «یک چای دیگر؟»
Relationships  new in Feriköy herself (the café opened a month before s1e36); Serkan is a
               regular
Arc (A1)       found between the fırın and the eczane: "Çay mı, kahve mi?" (s1e31); tests the
               guide and switches to sen (s1e36); the quiz night, class against building
               (s1e42); tea for the last study session (s1e45)
Signature      directions and tips with -(y)A / -DAn; "Ne içiyorsun?"; -DAn beri (week 7)
Look           adult · dark curly hair tied up · silver earrings · rolled sleeves, café apron (not
               İsmail's colour) · prop: a tray
Motion         tempo 1.2 · high · wave, explain, give
Colour         berry
```

### Elif
```
Name           Elif · الیف · Elif'in, Elif'e
Age · origin   40s · İzmir · nurse at a public hospital in Şişli, shift work
Circle · tier  neighbourhood · recurring · s1e14
Language role  warm everyday Turkish, home talk
Topic domain   home, family, body and health (owns health at B1)
Personality    warm, practical, unflappable · always tired after nights · "Geçmiş olsun!" /
               "Get well soon!" / «بلا به دور!»
Relationships  Serkan's wife, Ömer's mother; looks out for Nima from downstairs; knows Maria Teyze
               for decades
Arc (A1)       meets Nima on the stairs and walks to Osmanbey (s1e14); asleep on the roof after
               a night shift (s1e18); plans the secret party (s1e28) and cuts the cake (s1e30);
               "Bizim ev sıcak", after Nima's win at the agency (s1e40); Ömer's bedtime and the
               permit news (s1e43); films the song (s1e46)
Signature      family possessives (oğlum, eşim); -DAn -(y)A kadar for shifts; health words
Look           adult · dark brown bob · scrubs on shift days, a cardigan at home · hospital lanyard
Motion         tempo 1.0 · mid · touch (a hand on a forehead), nod, hand_heart
Colour         terracotta
```

### Serkan
```
Name           Serkan · سرکان · Serkan'ın, Serkan'a
Age · origin   40s · Istanbul (Beşiktaş born) · drives a yellow taxi
Circle · tier  neighbourhood · recurring · s1e13
Language role  football talk, opinions, exaggeration; taxi directions
Topic domain   sport, transport, work
Personality    big-hearted and loud · can't lose an argument · "En büyük Beşiktaş!" /
               "Beşiktaş is the greatest!" / «بشیکتاش بزرگ‌ترین است!» (a chunk until en arrives
               in week 6)
Relationships  Elif's husband, Ömer's father; a regular at Berfin's café; asks Nima for sen on
               moving day (s1e13)
Arc (A1)       drives Nima to Feriköy and turns out to live downstairs (s1e13); the roof
               (s1e18); the cat's fourth name, Kara Kartal (s1e23); buys the 80th's cake and
               calls for a speech (s1e30); the bread debate (s1e33); fails to fix the boiler
               (s1e37); Team Building at the quiz (s1e42); drives everyone to Ortaköy (s1e46)
Signature      -(I)yor commentary; çok çok; -mAk istemek; en (week 6); sağdan, soldan, burada durun
Look           adult · receding hair, stubble · black-and-white Beşiktaş scarf (not blue) · taxi keys
Motion         tempo 1.1 · high · explain (big), shake_head (at the referee), stop
Colour         charcoal
```

### Ömer
```
Name           Ömer · عمر · Ömer'in, Ömer'e
Age            5–6 · kindergarten (Nani's class from A2)
Circle · tier  neighbourhood · recurring · s1e13
Language role  very simple child speech: short, blunt questions. The foil: says what adults won't
               ("Neden böyle konuşuyorsun?")
Topic domain   everyday actions, colours, animals, school
Personality    fearless, curious · no filter · "Neden?" / "Why?" / «چرا؟»
Relationships  Elif and Serkan's son; spends afternoons with Maria Teyze; Nima is his favourite
               new grown-up
Arc (A1)       meets Nima on moving day (s1e13); the roof (s1e18); touches everything in Nima's
               room: "Bu senin mi?" (s1e19); calls the cat Pamuk (s1e23); can't keep the
               secret (s1e28, s1e30); whispers an answer at the quiz (s1e42); rehearses his 29 Ekim song (s1e43)
               and sings it in the park, the loudest of all (s1e46)
Signature      Neden? Bu ne? Bu senin ... mı? -(I)yor about himself
Look           child build · messy hair · small backpack
Motion         tempo 1.3 · high · point, hold_up, beckon
Colour         sunflower yellow
```

### Maria Teyze
```
Name           Maria Teyze · ماریا · Maria'nın, Maria'ya
Age · origin   turns 80 on 10 Oct (s1e30) · Feriköy, Rum (Istanbul Greek), born on this street ·
               retired seamstress
Circle · tier  neighbourhood · core · s1e14
Language role  proverbs, old-fashioned courtesy, long sentences
Topic domain   culture, family, the city's past, clothes (sewing)
Personality    gracious, sharp memory · stubborn about how things were done · "Damlaya damlaya göl
               olur." / "Drop by drop, a lake forms." / «قطره قطره جمع گردد، وانگهی دریا شود.»
               (the same proverb exists in Persian)
Relationships  upstairs from Nima; looks after Ömer; Elif's neighbour for decades; says siz to
               Nima always
Arc (A1)       the lady with the trolley on the M2 (s1e14); upstairs, with Nima's lost notebook
               (s1e16); tea on the roof, and she names Kerim (s1e18); calls the cat Kiki
               (s1e23); her childhood in -DI and the secret birthday (s1e27); the surprise
               80th and the Eleni story (s1e30); the season retold, as speaking practice
               (s1e41); every 29 Ekim by the Bosphorus (s1e46)
Signature      siz forms; -DI and "eskiden"; -DAn beri; proverbs as chunks
Look           elder build · grey bun (custom part) · cardigan · reading glasses on a chain
Motion         tempo 0.7 · low · hand_heart, beckon, explain (slow)
Colour         mauve
```

### Gülten Hanım (new; the florist)
```
Name           Gülten Hanım · گولتن · Gülten Hanım'ın, Gülten Hanım'a
Age · origin   60s · Istanbul · has run the flower shop on the corner of Nima's street for 40 years
Circle · tier  neighbourhood · occasional · s1e30 (an extra at the 80th); speaks in s1e32
Language role  precise, opinionated Turkish: colours, prices, freshness, and comparisons
               (daha, en): she always knows which is the freshest
Topic domain   flowers and colours, shopping, the neighbourhood's people (she remembers
               every customer and what they buy)
Personality    exact, proud, secretly sentimental · corrects everyone · "Bu en tazesi!" /
               "This one is the freshest!" / «این از همه تازه‌تر است!»
Relationships  siz with everyone; has sold Maria Teyze geraniums for forty years
Arc (A1)       sells Nima the geraniums (s1e29, off stage); brings a pot to the 80th (s1e30);
               "İstanbul'un en taze çiçekleri!" (s1e32); waves through her window on the
               guide tour (s1e36)
Signature      en / daha; noun compounds (Feriköy'ün en taze çiçekleri); -lI adjectives
Look           adult · short auburn hair with glasses pushed up into it · a green apron ·
               prop: florist's scissors
Motion         tempo 0.9 · mid · point, stop, hold_up (a flower)
Colour         amber
```

### Zafer Hoca
```
Name           Zafer Hoca · ظفر · Zafer Hoca'nın, Zafer Hoca'ya. Zafer is also a word
               ("victory"; ظفر in Persian too): glossed as a name
Age · origin   35 (s1e32) · Eskişehir · teaches A1 at Beykent TÖMER, class 504
Circle · tier  TÖMER · core · s1e03
Language role  formal, clear, slow; siz; imperatives and classroom language; corrects the
               classmates' mistakes
Topic domain   education
Personality    patient, precise · a stickler for pronunciation · "Bir daha, lütfen!" /
               "Once more, please!" / «یک بار دیگر، لطفاً!»
Relationships  siz with every student; quietly proud of Parvaneh's courage; a daughter of three
               (s1e20); his morning tea from İsmail's bakkal
Arc (A1)       Nima late on the first day (s1e03); -DA, numbers and the job hats (s1e07,
               s1e08, s1e10); wishes (s1e15); the map, and "Türkçe, lütfen!" (s1e16); the
               family-tree project (s1e20–s1e22); the treasure hunt (s1e24); clocks (s1e25,
               s1e26); describing people (s1e32); no voice (s1e34); the mock exam (s1e39);
               İsmail's tea and the last lesson (s1e44); the A1 exam (s1e47)
Signature      classroom imperatives as chunks (Açın, Dinleyin, Tekrar edin); mI questions;
               "Hayır, ... değil; ..." corrections; kaçıncı
Look           adult · neat beard · glasses · shirt and sweater · prop: board marker
Motion         tempo 0.9 · mid · count, write, point
Colour         navy
```

### Parvaneh (Parvane)
```
Name           Parvane in Turkish lines · Parvaneh in English · پروانه · Parvane'nin, Parvane'ye.
               "Pervane" is a Turkish word ("moth, propeller"): a ready false-friend joke
Age · origin   20s · Isfahan · wants a master's in design
Circle · tier  TÖMER · core · s1e03
Language role  the Persian–Turkish bridge from the beginner side: shared words and false friends
               (zor is "hard", not زور "force"; rüzgâr is "wind", not روزگار "times")
Topic domain   countries and languages, feelings
Personality    brave, talks first · guesses wildly · "Kolay! …Değil mi?" / "Easy! …Isn't it?" /
               «آسان است! …نه؟»
Relationships  Nima's first classmate friend; friends with Kırlangıç
Arc (A1)       sits next to Nima on the first day (s1e03); İstiklal (s1e04); wants to go
               everywhere (s1e15); slips into Persian and starts the Farsça jar, one lira a
               word, with Nima as its keeper (s1e16); her huge family tree (s1e20); afraid before the exam, in Persian
               first, and a coin in the jar (s1e45); whispers in the exam (s1e47); hands
               Nima the full jar on the ferry (s1e48); A1 exam result decided later
Signature      -mAk istiyorum; false friends; long sentences with one mistake, corrected; the
               Farsça jar (prop, on her desk from s1e16)
Look           adult · dark hair in a high ponytail · bold-coloured jacket · big earrings
Motion         tempo 1.2 · high · hold_up, explain, me
Colour         butterfly pink (parvaneh means butterfly)
```

### Yusuf
```
Name           Yusuf · یوسف · Yusuf'un, Yusuf'a
Age · origin   20s · Aleppo, Syria (Arabic); family in Aleppo and Gaziantep · wants to study
               medicine, which needs B2
Circle · tier  TÖMER · core · s1e03 (extra); first line in s1e07
Language role  learner mistakes, corrected: the vowels Arabic lacks (e/i, o/u, ö/ü, ı)
Topic domain   countries and languages
Personality    kind, organised, the class's helper · takes the wrong train · "Bu kelime Arapçada
               da var!" / "This word exists in Arabic too!" / «این کلمه در عربی هم هست!»
Relationships  Alex's study partner
Arc (A1)       plays the estate agent for Nima's call rehearsal (s1e08); "Yeğen!" and the
               Arabic words (s1e21); the doctor game: "Önce B2!" (s1e34); "benim için B2
               lazım" after the mock (s1e39); "B2 çok uzak" (s1e45); quietly afraid all
               through. A2: B2 and medicine
Signature      shared Arabic words (kitap, saat, ders); "Ben ... istiyorum"; vowel slips, corrected
Look           adult · short curly black hair, trimmed beard · hoodie · prop: phone dictionary
Motion         tempo 1.0 · mid · me, think, nod
Colour         olive
```

### Alex
```
Name           Alex · الکس · Alex'in, Alex'e (said "Aleks")
Age · origin   20s · St Petersburg, Russia · wants to study architecture · works nights at a
               hostel in Kadıköy, 11 p.m. to 7 a.m., and comes to class by ferry
Circle · tier  TÖMER · core · s1e03 (extra); first line in s1e07
Language role  learner mistakes, corrected: cases and word order
Topic domain   countries and languages
Personality    careful, dry humour · slow to answer · "Bir dakika… düşünüyorum." /
               "One minute… I'm thinking." / «یک دقیقه… دارم فکر می‌کنم.»
Relationships  studies with Yusuf; sleeps in class, because he works nights
Arc (A1)       "Saat… duvar" and the flat ads (s1e07); the panting "no" vote (s1e10); yawns
               through the wishes (s1e15); from Kadıköy by ferry (s1e16); his sister Olga
               (s1e20); says why he's tired: night shifts, "saat on birden yediye kadar"
               (s1e26); the hostel or A2, and the Kadıköy invitation (s1e45); waits at
               Kadıköy pier with a sign, "HOŞ GELDİNİZ, 504!" (s1e48). Whether he stays: A2's
               first week
Signature      careful questions; case slips (nerede/nereye/nereden); word-order slips, corrected
Look           tall adult · light brown hair · parka · prop: a thick notebook
Motion         tempo 0.9 · low · think, read, shrug
Colour         steel blue
```

### Dilnoza (new, proposed)
```
Name           Dilnoza · دلنوزا · Dilnoza'nın, Dilnoza'ya
Age · origin   19 · Samarkand, Uzbekistan (Uzbek, some Tajik) · wants to study economics; her
               visa came late
Circle · tier  TÖMER · core · s1e02 (the registration queue)
Language role  the Turkic cousin: guesses many words (kitob → kitap, suv → su) but Uzbek has no
               vowel harmony, so her suffixes slip (evlar → evler), corrected. Shares Persian words
               with Parvaneh (dil, gül, nur)
Topic domain   countries and languages, family
Personality    precise, a great memory, laughs easily · too shy to speak first · "Bizde de aynı!" /
               "It's the same where I'm from!" / «پیش ما هم همین‌طور است!»
Relationships  Nima's commute friend from s1e15 (she lives in Osmanbey); Nima's co-writer on
               the guide
Arc (A1)       late to registration, number six (s1e02); "Kalemlar!" (s1e03); İstiklal
               (s1e04); the umbrella, her first sentence and her first laugh (s1e15); the
               Feriköy walk (s1e17); the Tajik grandmother (s1e21); asks the stranger first
               when Nima freezes (s1e24); the guide (s1e31–s1e36);
               picks Nima up after the mock: "Beraber çalışıyoruz!" (s1e39); runs the
               speaking round (s1e45); on the ferry, plays the registration queue again:
               "Nerelisin?" (s1e48); A1 exam result decided later
Signature      Uzbek–Turkish cognates; vowel-harmony slips, corrected; "Bizde de ..."
Look           adult · light-blue headscarf, pinned · long coat (the outfit learners can pick too) ·
               prop: a notebook with coloured tabs
Motion         tempo 0.9 · low, growing · nod, write, shy (emo)
Colour         turquoise (Samarkand's tiles)
```

### Tolga Bey (new)
```
Name           Tolga Bey · تولگا · Tolga Bey'in, Tolga Bey'e
Age · origin   30s · Istanbul · estate agent (emlakçı) in Şişli; on the phone all day
Circle · tier  guest · recurring · s1e08 (the call about the Feriköy flat). A1's opponent
               (STORIES_A1.md, *Season arc*): comic, never a villain
Language role  fast, salesy Turkish: numbers, floors, prices, all at speed. He slows down
               only when asked, so learners practise "Yavaş, lütfen."
Topic domain   renting, numbers, addresses
Personality    eager, never stops selling · glosses over problems ("Asansör? …Yok.") and
               promises "Yarın!" ·
               "Çok güzel ev, çok güzel!" / "A very nice flat, very nice!" /
               «خانهٔ خیلی خوبی است، خیلی خوب!»
Relationships  siz with clients; knows every landlord in Şişli
Arc (A1)       the too-fast call (s1e08); the viewing (s1e09); 21,000 on the contract (s1e11);
               the rent message (s1e22); the contract with no notary stamp (s1e35, off
               stage); "Yarın!" for the boiler and the stamp (s1e37); Nima comes to his
               counter and won't take "yarın": "Tamam. Bugün!" (s1e40); the stamped contract
               and the usta arrive on Friday (s1e41, off stage)
Signature      numbers and prices at speed; kaçıncı kat; var / yok
Look           adult · slick hair · a blazer · two phones · prop: a ring of keys
Motion         tempo 1.3 · high · explain, phone, count
Colour         lime
```

### Hatice Abla (new)
```
Name           Hatice Abla · خدیجه · Hatice Abla'nın, Hatice Abla'ya
Age · origin   50s · from a village near Bursa; sells vegetables at the Feriköy Saturday market
Circle · tier  guest · occasional · s1e12
Language role  the market voice: loud calls (Gel abla gel! Taze taze!), prices, kilos;
               sen and "canım" to every customer
Topic domain   food and shopping, numbers and weights
Personality    warm, quick, proud of her produce · hates "Çok pahalı!" · "Taze, taze!" /
               "Fresh, fresh!" / «تازه، تازه!»
Arc (A1)       the market haggle (s1e12); lost on Nima's street, and "Sen… domates!" (s1e31)
Signature      kaç lira / kaç kilo; numbers; -(y)Im ("Ben organiğim!" as a joke)
Look           adult · headscarf tied at the back · apron with pockets of change · prop: scales
Motion         tempo 1.2 · high · beckon, count, give
Colour         tomato red
```

### Reza Bey
```
Name           Reza Bey · رضا · Reza Bey'in, Reza Bey'e
Age · origin   50s · born in Iran, in Istanbul for 30 years (proposed)
               · international office, Taksim campus
Circle · tier  TÖMER · occasional · s1e02
Language role  bureaucratic formal Turkish: forms, ID numbers, ikamet, appointments. Never
               switches to Persian ("Burada Türkçe konuşuyoruz"), so he shows a newcomer who
               mastered formal Turkish
Topic domain   study and bureaucracy; work at B1
Personality    exact, secretly kind · loves a stamp · "Bir numara alın, lütfen." /
               "Take a number, please." / «لطفاً یک شماره بگیرید.»
Relationships  siz with everyone; Farzad knows how to talk to him
Arc (A1)       registration: "Bir numara alın" (s1e02); the student card (s1e05, off stage);
               the ikamet appointment and the list of documents (s1e22); the Göç İdaresi and
               the missing notary stamp (s1e35); the second appointment (s1e43, off stage);
               the approval SMS (s1e47)
Signature      formal -(y)InIz; Lütfen ...; numbers and dates; "Randevunuz saat kaçta?"
Look           adult · grey hair · jacket without a tie · lanyard · prop: a folder of forms
Motion         tempo 0.8 · low · stop (one moment), write, point (at the form)
Colour         burgundy
```

## 8. Album captions (A1, *proposed*)

Kerim's album closes the season (`STORIES_SCHEMA.md` §4.8): one caption per character the learner met in three or more stories, picked by the learner's warmth with them. No band is a punishment. The photo for each band is picked when the stories are written. Farzad's, Kırlangıç's and Rayan's captions are still open.

The captions are written into each `characters/<id>.json` as `album.s1`, with their English, Persian and photo (`data/characters/`); the table below is their Turkish.

| Character | `met` (≤ 0) | `close` (1–2) | `family` (≥ 3) |
|---|---|---|---|
| Farzad | "Nima… benim misafirim." | "Nima benim arkadaşım." | "Nima benim kardeşim gibi." |
| Kırlangıç | "Nima: kapıdaki yeni öğrenci." | "Nima iyi bir öğrenci… ve iyi bir arkadaş." | "Nima bizim ailemiz." |
| Rayan | "Nima!" | "Nima! Top!" | "Nima! Nima! Nima!" |
| İsmail | "Nima… çay müşterim." | "Nima her gün geliyor." | "Nima benim yeğenim gibi." |
| Berfin | "Nima: rehberin yazarı." | "Nima… bana “sen” diyor!" | "Nima'nın çayı benden. Her zaman." |
| Elif | "Komşumuz Nima." | "Nima… dördüncü katın en iyisi." | "Nima bizim evin çocuğu." |
| Serkan | "Komşu! Dördüncü kat." | "Nima… Beşiktaşlı mı? Değil… daha!" | "Nima bizim ailemiz. Ve Beşiktaşlı!" |
| Ömer | "Nima… o bir komşu." | "Nima benim arkadaşım!" | "Nima benim! Bizim Nima!" |
| Maria Teyze | "Komşum Nima." | "Nima… iyi bir komşu." | "Nima benim ailem." |
| Gülten Hanım | "Sardunya müşterim." | "Nima… taze bir müşteri!" | "Nima'ya en taze çiçekler." |
| Zafer Hoca | "Nima: beş yüz dört." | "Nima çok çalıştı." | "Nima… gurur duyuyorum." |
| Parvaneh | "Nima, sınıf arkadaşım." | "Nima ile sadece Türkçe!" | "Nima… benim kardeşim. Kumbara da bizim!" |
| Yusuf | "Nima, sınıf arkadaşım." | "Nima ve ben: beraber çalışıyoruz." | "Nima… benim kardeşim." |
| Alex | "Nima… uykum var." | "Nima, Kadıköy'e gel!" | "Nima benim en iyi arkadaşım." |
| Dilnoza | "Nima: yedi numara." | "Nima ve ben: rehber!" | "Nima… benim en iyi arkadaşım." |
| Reza Bey | "Nima. Bir numara alın." | "Nima'nın belgeleri tamam." | "Nima… çok iyi bir öğrenci." |
| Tolga Bey | "Kiracım Nima." | "Nima… “bugün” diyor!" | "Nima en iyi kiracım! Yarın… yeni bir ev?" |
| the newcomer | "Nima… rehber!" | "Nima hocam!" | "Nima arkadaşım." |

Kerim herself has no caption: the album is hers. Her own warmth (choices like s1e35's secret) changes her closing line: "Kerim'in çatısı… senin de çatın." at `family`, "Görüşürüz, Nima." at `met`.

## 9. Still to add

- **A2 newcomers** (2–3, mostly women; Üsküdar and Fatih): **Nani** (a kindergarten teacher; Rayan and Ömer are her students; never mentioned in A1), plus 1–2 more, decided with A2.
- **B1 newcomers** (2–3: e.g. a doctor, a manager, a professor), decided with B1.
- **More friends** as recurring guests, from you (section 3).
- **A2/B1 storylines** for every character, including the A1 exam results (s1e47).

## 10. Changes this makes elsewhere

*Superseded (2026-10-09):* the items below referred to the dropped A1 plan; the A1 briefs now place every character. Kept for history.

- `STORIES_A1.md`:
  - Dilnoza enters in s1e09, which keeps four speakers.
  - Gülten Hanım is the landlady in s1e13, s1e17 and s1e19.
  - Yusuf's mistakes are the vowels Arabic lacks, not vowel harmony (which is Dilnoza's).
- **Classroom scenes** (s1e04, s1e25, s1e47) list 5–6 people. Speakers stay within the episode limit of 4. The other classmates stand in the background as `extras` (`STORIES_SCHEMA.md` §3).
- **Continuity to fix in the briefs:**
  - ~~İsmail's bakkal location~~ Decided in s1e05, then moved on 2026-10-09: the bakkal is in Taksim, round the corner from the TÖMER campus.
  - Kırlangıç's flat (s1e30), the fırın (s1e45) and the Beşiktaş café of s1e18 (if it isn't Berfin's) are not in the places list yet.
