# Kumru grammar lessons — authoring brief

You write grammar lessons for the Kumru Turkish notebook (a study app for Persian-speaking adults learning Turkish with a course's books). Each lesson mirrors one grammar point of the books. Lessons are JSON files, one per lesson, in `data/grammar/<id>.json`, each one document of the `grammar` collection. There are 86 (A1 34, A2 27, B1 25).

## Where the sources are
- The book transcripts: `content/<a1|a2|b1>/ders/0N_*.md`. Each unit opener lists its *DİL BİLGİSİ* points; the grammar sections that teach them are in the same file. Read the section yourself: the book is the authority for rules, terminology and examples.
- Shape examples: any existing lesson, e.g. `data/grammar/g_a1_3_simdiki.json` (suffix lesson with chain and verb widget) or `g_a1_4_iyelik.json` (noun widget). Print one compactly with `uv run tools/grammar_lessons.py --show <id>`.
- Ids: `g_<lv>_<unit>_<slug>`. If one book section is too dense for one page, add a sibling id and say so in your report. Never rename an existing id: learners' progress, the stories' `lessons` and spots, the path's skills and the page's `DT` drills point at it.

## Document
```
{
  "title": "Bulunma durumu: -DA",     // book's Turkish term first; optional short English/clarifying gloss after a colon or " · "
  "en": "1–2 sentences: what it does, with the Persian equivalent where useful.",
  "fa": "the same in natural Persian",
  "level": "A1", "ref": "A1_2", "sectionNo": 2, "section": "Nerede?",   // section = the unit's title exactly as in the validator
  "topic": "unit theme in English, e.g. 'Places and school'",
  "blocks": [ ... ],
  "ex": [["Turkish sentence", "Persian", "English"], ...],   // ≥4; ≥3 of them 2–9 words with no comma
  "practice": {"target": "short name of the point", "task_tr": "...", "task_en": "...", "task_fa": "..."},
  "tip": {"en": "...", "fa": "..."},   // optional "Remember" box
  "lite": [ ... ]                      // 2–3 short cards for the path (see Lite version)
}
```
`order` (position across A1→B1, 1…86) is set when lessons are added or reordered; keep existing values. No `id` field.

## Blocks (the only types the page renders)
- `{"t":"table","head":[...],"rows":[[...]...],"fa":[indices of Persian columns],"cap":"optional"}` — non-Persian cells may use suffix markup. Every cell is a string; rows have as many cells as head.
- `{"t":"compare","tr":"Turkish","fa":"Persian","en":"English","note":"one line on the structural difference, or \"\""}`
- `{"t":"chain","cap":"word = gloss","parts":[["text","role","en gloss","fa gloss"],...]}` — role is `stem` or a markup kind; a leading space in text (" mı") marks a separate word.
- `{"t":"slots","labels":[...],"tr":[...],"fa":[...]}` — equal lengths; word order.
- `{"t":"tip","en":"...","fa":"..."}`
- `{"t":"widget","w":"...","o":{...}}`:
  - `harmony` `{}` — type-a-word vowel harmony tool
  - `noun` `{}` — stem + plural + possessive + case builder
  - `cases` `{"focus":"loc|dat|abl|acc|gen"}` or `{}`
  - `verb` `{"tense":T,"lv":"A1|A2|B1","person":"1sg|2sg|3sg|1pl|2pl|3pl"?, "form":"pos|neg|q"?}` — conjugation tool over 11 verbs (gelmek gitmek okumak içmek görmek yazmak istemek oturmak bilmek söylemek almak). T ∈ iyor di (A1) · ecek imp mis r abil (A2) · iyordu mali sa sart (B1). `lv` = the lesson's level. `imp` covers both emir and istek (ben geleyim, sen gel, o gelsin, biz gelelim, siz gelin, onlar gelsinler).
  - `clock` `{}`, `place` `{}` (cat on/under/next to/in front of/behind the table)
  - `quiz` `{"title":"optional","items":[{"q":"Öğrenciler sınıf___.","opts":["ta","da","de"],"a":0,"fa":"دانش‌آموزان در کلاس هستند.","en":"The students are in the classroom.","why":"f is a hard consonant, so -DA becomes -ta."}, ...]}` — 3–8 items, 2–4 distinct options, `a` = index of the right option, `fa` = Persian of the completed sentence, `why` = one-line reason. Use `___` for the gap. Options may be suffixes, whole words or whole phrases. Model the items on the book exercises for this grammar point (same kind of task, same vocabulary of the unit); write your own sentences rather than copying the exercise verbatim.
- Every lesson needs: ≥1 `table`, ≥1 `compare`, one `quiz` widget, the widget(s) that fit the point (a `verb` widget for a tense, `cases` for a case ending, `noun` for possessives), and a `chain` for every suffix lesson.

## Lite version (the path)
The path teaches a lesson as `lite` cards, not the full page. Learners read them on a phone, often on a metro or bus: one hand, no sound, a few minutes at a time. Each card is one screen and is followed by its check question. The full lesson stays available from a "Full lesson" link and the unit sheet.
```
"lite": [                         // 2–3 cards, in teaching order
  {"en": "one idea, ≤120 chars",  // plain English, the rule itself; markup allowed but counted without brackets
   "fa": "the same in Persian, ≤150 chars",
   "show": {block},               // optional: one chain | compare | slots | table (≤4 rows, ≤3 cols); never a widget
   "ex": [["tr","fa","en"]],      // 1–2 examples, plain text, 2–7 words, no comma
   "q": {quiz item}}              // optional but expected: the quiz item shape above, testing this card's idea
]
```
- **One idea per card.** Card 1 is what the point means and when to use it, card 2 the form (how the suffix changes), card 3 the persons or the main exception. Two cards are enough for a simple point.
- **Only what the checks need.** Long tables, rare exceptions, NOT boxes and extra usages stay in the full lesson. Cut a table down to the 3–4 rows that matter.
- **Reuse, don't invent.** Take examples from the lesson's own `ex` and blocks, and questions from its `quiz` items (adapt freely). No grammar the full lesson doesn't teach.
- **Persian is not a word-for-word copy.** Say it naturally; mention the Persian parallel when it helps in a few words.

Worked example: `g_a1_3_simdiki` (`uv run tools/grammar_lessons.py --show g_a1_3_simdiki`, the `LITE` lines).

## Suffix markup
Inside any Turkish string except `ex`: `gel[iyor:tense][um:pers]`, `masa[da:case]`, `kitap[lar:pl]`, `ev[im:poss]`, `araba[y:buf][a:case]`, `gel[me:neg][di:tense]`, `kitap [mı:q]`, `İran[lı:der]`. Kinds: case pers tense poss buf der q pl neg. Mark the suffix being taught; don't over-mark. Plain text in `ex` (examples are spoken aloud and rebuilt as word tiles).

## Content rules
- Follow the book: its Turkish term in the title, its rules, its NOT boxes, its notation (-DA, -(y)A, -(I)yor, -mIş …). Explain in plain English for adults; keep each prose field short (the page is read on phones).
- Examples: draw ≥3 from the book's Örnek lines for this section (short single sentences; you may adapt names or a word), the rest your own in the unit's vocabulary. Never copy reading texts or long passages.
- Persian: natural Iranian Persian with ZWNJ (می‌روم, نمی‌دانم, کتاب‌ها). Point out where Persian works the same way and where it differs (ezafe vs Turkish compounds, را vs -(y)I, به/از/در vs case endings, می‌ for continuous/habitual, باید + subjunctive, کاش, اگر…).
- Turkish: check ı/i, İ, ş, ğ, ç, ö, ü; apostrophe before suffixes on proper names (İstanbul'da). Don't copy the book's printed typos (marked `<!-- sic -->` in the transcripts).
- Practice task: one short writing task in the unit's theme that needs the point (task_tr in simple Turkish, task_en, task_fa).
- Level discipline: an A1 lesson's examples use only A1 grammar taught up to that unit (plus the point itself); same idea for A2/B1.

## Check
Run `uv run tools/grammar_lessons.py --check` until it prints 0 problems (pass your own files to check only those). It also catches dangling grammar ids in the other collections and the page. Then re-read each of your lessons against its book section once more. Writers and reviewers do not commit; the parent session commits the files, and they ship with the next deploy (see *Changing content* in `AGENTS.md`).

## Report
List your ids, any sibling ids added, any place where the book was unclear or wrong and what you did, and anything you were unsure about in Persian or Turkish.
