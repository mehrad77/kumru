# Season 1 drafts awaiting the owner's review (ROADMAP.md M5)

s1e02–s1e48 are written as drafts in `data/stories/<id>.json`, beside the s1e01 model. Each week had a writer, an independent second pass against its brief, and a language pass over its Turkish, Persian and English. They are committed once the gates are green, and your review comes after (your decision of 2026-10-23).

**How to review.** Run `pnpm sahne dev` and open `#/stories/<id>` in the gallery (for example `#/stories/s1e02`). Play each story to the end and try every option of each choice. Then read the open points and the Persian listed under the story below. Say what to change for any story; a week is done when you have reviewed it, and this file keeps what is still open.

## Season

**Gates (2026-10-24).** `node sahne/packages/sahne-story/stories.ts --check`: 48 stories, 0 errors, 96 warnings (after the checker fixes below). `pnpm sahne check`: green.

**Choice kinds.** polite 20, meaning 17, action 20 of 57 choices (35%, 30%, 35%). This is near a third each, so nothing was re-kinded.

**Callbacks.** All five flags in `STORIES_A1.md` (*Callbacks*) are set by the `ok` pick of an earlier story and read by an `if`/`unless` pair: `s1e14_seat` → s1e16, `s1e17_cake` → s1e31, `s1e28_secret` → s1e30, `s1e36_credit` → s1e45, `s1e43_song` → s1e46. No other flags exist, and none needed renaming.

**Warnings left (96).** Each kind is explained here once. The per-story lists below give only the counts.
- **Known words (39 stories under 95%; median 89%, lowest 83%).** These numbers are honest now. Until 2026-10-24 the checker matched words the wrong way round (`e811627`) and took any word that began like a known verb's stem as that verb (kaşık via kalmak, tavuzgo via takmak), so it read too high in places and too low in others. What is not known is real: names of places a story mentions but does not visit (Feriköy, Boğaz, Osmanbey), Kerim's *ku*, words whose cards are later units (komşu, kelime), forms the matcher does not know yet (*musun*, *naziksiniz*), and glossed words (a gloss is not a known word). No line was rewritten to raise the ratio.
- **Line counts (17 episodes over the proposed 10–14).** s1e01 15, s1e02 17, s1e03 15, s1e08 15, s1e09 15, s1e10 15, s1e11 15, s1e13 16, s1e14 15, s1e16 19, s1e17 15, s1e19 17, s1e22 16, s1e26 17, s1e45 17, s1e46 20, s1e47 26. Each extra line carries a beat of its brief.
- **Routes (39 walks in 12 stories).** Characters walk round desks and tables, at most 0.9 m longer than a straight line. This is harmless.
- **Recycling (s1e47).** Its target words should come back in two of the next stories, but only s1e48 follows in the season. bavul is in s1e48; the others carry into A2.
- **Target words above A1 (fixed).** The checker read only the unit digit of a card's `ref`, so A2 and B1 cards passed as A1 targets. Since `41c25da` they are refused, and su (s1e05), pilav and salata (s1e06), kaşık (s1e18) and mum (s1e30, B1) left the target words; they stay in the lines and on their props. The glosses the passes added for mutfakta (s1e09) and telefonum, telefonun (s1e19) were a symptom of the same matcher bug; they stay, as they give the meaning of that form. The stricter check also found words that had resolved only by accident; they got glosses in the stories that use them (çatı, ku, buraya, tam, kart, balon, buyrun, gürültülü, tank, damlaya, İstanbullu). s1e30's quiz *word* item still asks about *mum*, no longer a target word; its answer is *pasta*, which is.

**Changes made across weeks in this pass.**
- **Album.** Every character in three or more stories now has captions: `album.s1` in `cast/<id>.json`, keyed `"s1"` as the ids are. That is 18 characters. The Turkish is `STORIES_CAST.md` §8's. The English and Persian are new, and each band has a photo, a `{story, step}` where the character and Nima share the stage. Farzad's, Kırlangıç's and Rayan's captions are still open. The photos are step numbers: check them again after any edit that adds or removes steps.
- **Album check.** It no longer asks for an album for Nima (the stand-in) or for Kerim, since the album is hers. The change is in `check/rules.ts` and `STORIES_SCHEMA.md` §5 and §10.
- **Persian names.**
  - In the drafts, nothing was left to change after the language passes. A season-wide grep for every name and title found no other form.
  - Outside the drafts: the place names `office_emlak` (بنگاهِ املاکِ آقای تولگا), `tomer_office` (پنجرهٔ دفترِ استاد ظفر) and `flat_kirlangic` (خانه‌ی پرستو).
  - Feriköy is now فری‌کؤی, as in its place file, in the bios of Berfin, Hatice, Gülten and Maria, and in three extras. The extras were changed in `cast/extras.ts` and regenerated.

**Left inconsistent across weeks (pick one form, and the drafts follow).**
- *Hoş bulduk*: «خوشحالم که این‌جام!» (s1e01), «خوشحالیم که اومدیم!» (s1e06), «ممنون، خوشحالم که اومدم.» (s1e09).
- *Yavaş, lütfen*: «آروم‌تر، لطفاً» (s1e08, s1e39), «آروم، لطفاً» (s1e47).
- Kerim's coo:
  - the `ku` gloss reads صدای کبوتر, صدای قمری or صدای کریم;
  - the Turkish sound word is "gu guu gu" in the place file and "Ku-kuu" in s1e18.
- Persian spelling:
  - the plural imperative is بیاید in s1e15, s1e22 and s1e40, and بیاین elsewhere;
  - the ZWNJ in می‌رم and میرم;
  - kardeş and yeğen are written with a slash (خواهر/برادر).
- *maç* is مسابقه in s1e13 and فوتبال in s1e18.
- The cat: s1e23 stages the place's cat prop, set to a black coat so it reads as Pisi (s1e36, s1e43 cast Pisi).
- *Buyurun* and *Buyrun* are both used. The lint's give timing knows only "buyr".

**Cast needs the second pass reported.** None of them is a missing character with a defined look, so nothing was added to `cast/`.
- In s1e14 the speaker label said "Maria" before s1e16 reveals her name; fixed 2026-10-27 with the story field `names` (she is *Teyze* there).
- Maria has no free neck slot for her cross; it holds her glasses chain.
- No pâtisserie clerk extra exists (s1e17).
- Places are short of marks:
  - Rayan at the market (s1e12) and in the park (s1e46);
  - the two old men at the café (s1e17);
  - two people under one umbrella (s1e15);
  - a second customer at the flower shop (s1e32);
  - the cake table and the tank on the roof (s1e30, s1e35);
  - Kerim overtaking the bus (s1e25);
  - the ferry and Kadıköy crowds (s1e48).
- Clocks that cannot show a story's time: class504 is fixed at 9:10 (s1e25, s1e26), and cafe_berfin's has no time (s1e42).
- In s1e27 the calendar mark puts Nima in front of the calendar.
- Engine:
  - a Nima line inside a reply plays as a plain line, not a card (s1e43);
  - Kerim cannot hold a prop (s1e11);
  - `hide` on a held prop still draws it (s1e36);
  - there is no hang-up sound (s1e40).

**Open decisions (yours).**
1. **A native Turkish reviewer.** None yet. Every line is checked only by Claude's passes. The per-story notes list the lines a native speaker should hear first.
2. **Briefs marked "to be confirmed"**:
   - s1e06: Farzad cooking, and Rayan's red ball.
   - s1e16 → s1e18: the Saturday tea at Maria Teyze's.
   - s1e37: Kırlangıç leading the study group.
   - s1e40: Farzad on the phone in one option.
   - s1e44: Farzad's silent visit with food.
   - s1e48: Farzad's and Kırlangıç's lines.
   - s1e41 and s1e42 are Claude's picks.
   - The weekly arcs for weeks 2–8 were written by the writers, since only week 1's is in a brief: s1w02 *Ev nerede?*, s1w03 *Yeni ev, yeni yol*, s1w04 *Yeni bir aile*, s1w05 *Saat kaç?*, s1w06 *Feriköy'ün en iyi yerleri*, s1w07 *Sınavdan önce*, s1w08 *Sınav ve bayram*.
3. **Weeks 7–8 class content.** What the class does in the review weeks is still to be confirmed (`STORIES_A1.md`).
   - The drafts use `ref` A1_6 and lean on one unit a day, as the threads say.
   - The week-7 briefs still say A1_1–A1_5, and a few brief lines differ from the drafts (s1e32 "çiçekleri", s1e37 "Ve sözleşme?", s1e39 "benim için B2 lazım"). Update the briefs once you accept the drafts.
4. **Kırlangıç's, Farzad's and Rayan's lines** wait for M3 step 5, postponed on 2026-10-23.
   - Kırlangıç, Farzad and Rayan say only generic things, nothing private, in s1e02, s1e06, s1e12, s1e13, s1e18, s1e19, s1e25, s1e29, s1e30, s1e36, s1e37, s1e38, s1e40, s1e44 and s1e48.
   - Their album captions wait too.

**Persian to check across the season.** The album captions in each `cast/<id>.json` (`album.s1`, 54 short lines).

## Week 1 · Hoş geldin!

s1e01 is the model draft, unchanged in this pass.

### s1e02 · Kayıt günü (Registration day)
Registration at TÖMER: Kırlangıç at the door, the queue with Dilnoza, Reza Bey's spelling slip and papers.
- **Open:**
  - The brief's targets *ad* and *Türkçe* were dropped, because their cards are Unit 4.
  - Kırlangıç's one turn is five short sentences.
- **Warnings:** 17 lines.
- **Persian:** «…سلامتی. بفرمایید.» for "İyilik. Buyurun."; «یک، دو، سه، چهار. درسته!»; «بگو «شما»!».

### s1e03 · Bunlar ne? (What are these?)
Nima is late to the first lesson. In Zafer Hoca's plural game Dilnoza says "kalemlar", and Nima names the windows.
- **Open:**
  - *kapı*, *tahta* and *sözlük* appear only in the spot and the follow-up.
  - Zafer stands at the window desk and says "bunlar"; would "şunlar" be better?
- **Warnings:** 15 lines; routes ×3.
- **Persian:** none flagged.

### s1e04 · Burası neresi? (Where is this?)
Down İstiklal from Taksim to Şişhane with Parvaneh and Dilnoza: the tram, Galata far off, two goodbyes.
- **Open:**
  - Departures from the brief: Dilnoza says "Hoşça kalın!" because she leaves two people; Parvaneh corrects with "Hayır, hayır! Sen: güle güle!"; quiz 1 asks "Who says it?".
  - İstiklal is called *sokak* (the target word), though it is a *cadde*.
- **Warnings:** none of its own.
- **Persian:** «تو می‌ری مترو، من می‌رم مغازه‌ها!».

### s1e05 · Bakkalda (At the corner shop)
Nima shops alone at İsmail's bakkal with Farzad's list and is given Rize tea.
- **Open:**
  - *yumurta* and *para* were dropped as targets (Unit 5 cards).
  - "Okul? Öğrenci mi?" stands in for "Öğrenci misiniz?".
  - İsmail's "Sağ ol!" (sen) to a customer he calls siz comes from the brief.
- **Warnings:** none of its own.
- **Persian:** «اینم… چای! از ریزه! دانشگاه؟ دانشجویید؟»; summaryFa «… یک بسته چای هم هدیه می‌دهد.».

### s1e06 · Hoş geldin yemeği (The welcome dinner) · special
Dinner at Farzad's: Kırlangıç and Rayan bring flowers, Nima hands out the gifts from home, pilav and chicken.
- **Open:**
  - Confirm Farzad cooking and Rayan's ball.
  - "Yemek nasıl?" is present tense over empty plates, because the past is Unit 5.
  - The gifts have no "for you", because *için* comes later; the gesture carries it.
- **Warnings:** routes ×6.
- **Persian:** titleFa «شامِ خوش‌آمدگویی»; «فرزاد، این کتاب برای توئه.» and «پرستو، این زعفرون برای توئه!».

## Week 2 · Ev nerede?

### s1e07 · Saat nerede? (Where's the clock?)
Zafer Hoca's -DA and var/yok game, Alex's "Saat… duvar", then the flat ads and the rent shock.
- **Open:**
  - The teacher's joke example "Ben öğretmen değilim!" might confuse; "Ben doktor değilim!" is plainer.
  - Alex's "Duvarda!" is a nod, not a line.
- **Warnings:** none of its own.
- **Persian:** none flagged.

### s1e08 · Alo? (Hello?)
The rehearsed call with Yusuf freezes, and Tolga Bey talks far too fast; the viewing is booked for Wednesday.
- **Open:**
  - *yüz* was dropped as a target (Unit 6).
  - "İstanbul sayıları" uses Unit 6's compound and is glossed.
  - The wrong option's English, "The rent is which in the row?", is clumsy on purpose.
- **Warnings:** 15 lines.
- **Persian:** «وِری… قشنگ! وِری… خونه!».

### s1e09 · Dördüncü kat (The fourth floor)
The viewing: four floors, no lift, no fridge, a "cheap" rent, and Kerim eye to eye with Nima.
- **Open:**
  - The place's "empty" state shows moving boxes before Nima has rented the flat.
  - "Burası oda" would be more exact as "yatak odası".
- **Warnings:** 15 lines.
- **Persian:** «ارزون… واقعاً؟»; «ممنون، خوشحالم که اومدم.» (see *Hoş bulduk* above).

### s1e10 · Ben öğrenciyim (I'm a student)
Job hats teach the personal endings; the sen/siz choice; the class votes and Nima says yes to the flat.
- **Open:**
  - *neden* was dropped (Unit 5), leaving 5 targets.
  - The hats are one prop that switches kind; check that each hat draws.
- **Warnings:** 15 lines.
- **Persian:** «مریض داریم؟»; «من دانشجوام» (spoken spelling, also in titleFa).

### s1e11 · Anahtarlar (The keys)
At Tolga Bey's agency Nima spots the wrong rent on the form, signs, and gets three keys.
- **Open:**
  - Kerim cannot hold the key tag (an engine gap).
  - "Burada, lütfen" stands in for "Buraya", which needs -(y)A.
  - The silent option has no signing gesture.
- **Warnings:** 15 lines.
- **Persian:** «بله، دانشجوام»; «… (بی‌هیچ حرفی امضا کن)».

### s1e12 · Feriköy pazarı (The Feriköy market) · special
The Saturday market, a polite bargain with Hatice Abla, four floors of stairs, tea on the roof.
- **Open:**
  - Nima's offer of help is now "Çantalar… bende!" (this week's -DA).
  - Rayan is off stage at the market, because the pushchair has no seat.
  - *biraz* was dropped (Unit 6).
  - "Kilo seksen lira": a seller would say "Kilosu seksen".
- **Warnings:** none of its own.
- **Persian:** «… بیا آبجی، بیا!» (the seller's call); «کیسه‌ها… با من!».

## Week 3 · Yeni ev, yeni yol

### s1e13 · Feriköy'e! (To Feriköy!)
Moving day by taxi. The driver, Serkan, lives in the same building, with Ömer.
- **Open:**
  - *taşınmak* was dropped as a target (Unit 6) but stays in the lines.
  - The boxes are not shown in the taxi.
- **Warnings:** 16 lines.
- **Persian:** «از کجا میایید؟»; the note «سرکان عمداً «sen» (تو) را پیشنهاد می‌کند…»; summaryFa.

### s1e14 · Metro geliyor mu? (Is the metro coming?)
The first commute with Elif, and a seat for an older lady on the M2.
- **Open:**
  - *tren* was dropped (Unit 5).
  - The speaker label said "Maria" before she is named (fixed: `names`, *Teyze*).
  - The cross necklace is not staged.
- **Warnings:** 15 lines.
- **Persian:** summaryFa.

### s1e15 · Yağmur yağıyor! (It's raining!)
Everyone's wish in class (Nima: tea on the Bosphorus), then the first rain and Dilnoza's umbrella.
- **Open:**
  - Kerim's "Güneş görmüyorum." uses *güneş*, an A2 card.
  - Two people cannot stand under one umbrella (no marks).
- **Warnings:** none of its own.
- **Persian:** summaryFa.

### s1e16 · Nereden geliyorsunuz? (Where are you coming from?)
The class map, Parvaneh's Farsça jar, and the lady from the metro, who is Maria from the fifth floor.
- **Open:**
  - Confirm "Bu defter… Nima? Siz misiniz?" (the brief had "Nima mı?").
  - On the rude option Maria re-invites Nima instead of saying "başka bir gün".
  - Her callback line has four sentences.
- **Warnings:** 19 lines.
- **Persian:**
  - «این دفتر… نیما؟ شمایید؟»
  - «خب، از کجا به استانبول اومدید؟»
  - «من از شما ممنونم! شنبه… وقتِ چای!»
  - «از کجا میایید؟»

### s1e17 · Pasta istiyor musun? (Do you want some cake?)
Nima and Dilnoza set off for the Bosphorus and never get there: cats, a church bell, a Rum pâtisserie.
- **Open:**
  - Quiz 3 was rewritten, because the brief's answer differed by path.
  - There is no pâtisserie clerk.
  - "Pasta seviyor musun?": the natural *sever misin* is not taught yet.
- **Warnings:** 15 lines.
- **Persian:** «گربه‌ها «خوابیدن».»; summaryFa «شیرینی‌فروشیِ رومی» (read as "Roman").

### s1e18 · Çatıda çay (Tea on the roof) · special
Tea on the roof at sunset, and Maria Teyze names the bird: Kerim.
- **Open:**
  - Farzad's "Yeni ev… çatı da var!" reads like a second discovery after s1e12.
  - Rayan asleep is shown only as a reaction.
- **Warnings:** none of its own.
- **Persian:** «…«دستتون درد نکنه»!»; «ممنون، کافیه.»; «همش فوتبال!».

## Week 4 · Yeni bir aile

### s1e19 · Bu senin mi? (Is this yours?)
Ömer explores Nima's room, the family photo brings the promise of a Bosphorus photo, then Farzad calls.
- **Open:** Farzad's "Pazar günü bize gel" implies he shares a home; confirm it, or change it to "bana gel".
- **Warnings:** 17 lines; routes ×3.
- **Persian:** «این مامانمه، این بابامه. این هم خواهر/برادرمه.».

### s1e20 · Aile ağacı (The family tree)
Zafer Hoca's family-tree project; Parvaneh's huge tree; Alex's sister Olga.
- **Open:** Parvaneh's Turkish line carries Persian script (دایی, خاله), as the brief has it.
- **Warnings:** routes ×5.
- **Persian:** «… ولی چه درختی؟ درختِ خانوادگی!».

### s1e21 · Bu kelimeyi bilmiyorum (I don't know this word)
Dilnoza's Tajik grandmother, Nima's gap for *yeğen*, Yusuf's Arabic words.
- **Open:**
  - *Rusça* appears only in Kerim's closing list.
  - The spelling غازی‌عینتاب is not verified.
- **Warnings:** routes ×3.
- **Persian:** «این خواهرزاده/برادرزاده‌ی منه!».

### s1e22 · Herkes buraya! (Everyone over here!)
The case game on the trees, the first rent, Reza Bey's permit appointment, the class photo.
- **Open:**
  - Yusuf's "Kerim de var!": the class never heard the bird's name.
  - Reza Bey's Persian mixes formal and spoken registers.
- **Warnings:** 16 lines; routes ×7.
- **Persian:** «عکس! همه بیاین این‌جا!».

### s1e23 · Bizim kedimiz (Our cat)
One street cat with four names; the thermos for the Bosphorus stays at the door.
- **Open:**
  - The cat is the place's prop with a black coat, standing in for Pisi (see the season list).
  - *ad* replaces *isim* (Unit 6).
  - Serkan's "Balık veriyorum!" is a little marked.
- **Warnings:** none of its own.
- **Persian:** none flagged.

### s1e24 · Hazine avı (The treasure hunt) · special
Case-ending clues across Taksim and İstiklal. Nima freezes before a stranger, and Dilnoza asks first.
- **Open:**
  - *götürmek*, *beklemek* and *ilk* were swapped for *kutu*, *sözlük* and *kafe*, because the first three are Unit 5.
  - Dilnoza's thanks are staged to Nima, not to the passer-by.
- **Warnings:** routes ×1.
- **Persian:** «روی دستمال نوشته: «ایستگاه»!»; «مرسی، نیما! داریم می‌آییم!».

## Week 5 · Saat kaç?

### s1e25 · Tahran saati (Tehran time)
The watch is half an hour ahead; stuck on the bus with Kırlangıç; the clock game in class.
- **Open:**
  - Kırlangıç's class-time questions are folded into Kerim's narration.
  - The classroom clock shows 9:10 throughout.
- **Warnings:** none.
- **Persian:** «ربع نداره… درست ساعت نهه!»; «نخیر: ساعت نه و نیمه.».

### s1e26 · Saat kaçta? (At what time?)
Nima arrives at 8:30 to an empty room, talks days with Zafer Hoca, and Alex says why he is sleepy.
- **Open:** the clock shows 9:10 while Kerim says 8:30.
- **Warnings:** 17 lines.
- **Persian:** «هفت صبحونه می‌خورم. هشت دیگه مدرسه‌ام.».

### s1e27 · Bu sokakta doğdum (I was born on this street)
Maria Teyze's old photos in the past tense, and the date circled on her calendar.
- **Open:**
  - She says "Seksen yaşındayım" three days early; a native would say "seksen yaşına giriyorum".
  - "geçen yıl gibi" stands for the idiom "dün gibi".
- **Warnings:** none of its own.
- **Persian:** the habitual past «… همسایه‌ها باقلوا می‌آوردن… همه می‌اومدن».

### s1e28 · Sır! (It's a secret!)
On time at last, Nima plans Maria Teyze's surprise with Elif, and Ömer cannot keep quiet.
- **Open:**
  - The s1e30 `unless` branch also plays after the lie option.
  - "Bir aydan beri": everyday speech says "Bir aydır".
- **Warnings:** none of its own.
- **Persian:** «یه رازی هست! شنبه تولدِ خاله ماریاست.».

### s1e29 · Sevgili Maria Teyze (Dear Maria Teyze)
At Kırlangıç's flat: the shawl, Rayan's yarn ball, and the card written in the past tense.
- **Open:**
  - The follow-up has two -DI sentences; the brief asks for three.
  - The card check has no wrong option.
- **Warnings:** none of its own.
- **Persian:** none flagged.

### s1e30 · Seksen mum (Eighty candles) · special
The surprise 80th on the roof, and Maria's tenth birthday on the same roof seventy years ago.
- **Open:**
  - The first slice jumps about 3.5 m, because there is no mark by the cake.
  - "İlk pasta kimin?" uses *pasta* for a slice.
  - Farzad's "…Ve?": a native would say "Eee?".
- **Warnings:** none of its own.
- **Persian:**
  - «بفرمایید، خاله ماریا: این شال مالِ شماست. یه هدیه!»
  - The spot: «جمله‌ی سرکان، «pasta aldım»، هم -DI است…»

## Week 6 · Feriköy'ün en iyi yerleri

### s1e31 · Fırının yanında (Next to the bakery)
Nima and Dilnoza start a guide for new students and find Berfin's tiny café.
- **Open:**
  - *ön*, *iç* and *arka* appear only in the spot, the follow-up or one reply.
  - "bugün ben veriyorum": a native would say "Bugün benden!".
- **Warnings:** none of its own.
- **Persian:** «نونِ داغ… امروز مهمونِ منی!»; «مرسی عزیزم! …تو… گوجه!».

### s1e32 · Mavi gözlü, güler yüzlü (Blue-eyed, smiling)
Describing people in class, and Gülten Hanım's flower shop.
- **Open:**
  - No A1 lesson teaches -lI, so the spot hangs on *en*; please confirm.
  - Dilnoza waits at the door, 2.7 m from Nima.
- **Warnings:** routes ×1.
- **Persian:** none flagged.

### s1e33 · Köşedeki fırın (The bakery on the corner)
Two bakeries, one bench, and Serkan's opinion.
- **Open:**
  - The loaves have no labels, so every line links them.
  - Serkan answers the line before Nima's.
- **Warnings:** none of its own.
- **Persian:** none flagged.

### s1e34 · Hocanın sesi yok! (The teacher has no voice!)
The class runs the lesson. Yusuf plays the doctor, and Nima fetches honey from İsmail.
- **Open:**
  - *vücut*, *parmak* and *öksürmek* were dropped from the brief's 11 targets.
  - İsmail's "Ne istiyorsunuz?" is a little blunt.
- **Warnings:** routes ×2.
- **Persian:** «خدا بد نده» for every *Geçmiş olsun*.

### s1e35 · En güzel manzara (The most beautiful view)
The permit appointment fails (no notary stamp); Kerim shows Nima the Bosphorus from her tank.
- **Open:**
  - "Sözleşme… noter onayı yok.": the natural form fails the var/yok lint.
  - Confirm the warmth on "herkes gelsin" (Kerim −1).
- **Warnings:** routes ×1.
- **Persian:** «نوتر… یعنی چی؟»; «کجایی؟ نوبتِ اقامت چطور بود؟».

### s1e36 · Rehber (The guide) · special
Berfin tests the finished guide. Pinned on the café wall, it meets a lost new student.
- **Open:**
  - Confirm Nima's switch to sen with Berfin.
  - The bakery is "parktaki" but stands "parkın arkasında".
- **Warnings:** none of its own.
- **Persian:** none flagged.

## Week 7 · Sınavdan önce

### s1e37 · Kombi çalışmıyor! (The boiler's not working!)
The boiler fails: Tolga Bey promises "yarın", Serkan tries and fails, and Kırlangıç offers a warm place to study.
- **Open:** confirm Kırlangıç leading the study group.
- **Warnings:** none.
- **Persian:** «پکیج سرده… ولی همسایه‌ها خونگرمن.».

### s1e38 · Kütüphanede (At the library)
The study group at the İBB library, where Nima helps the newcomer.
- **Open:**
  - *değil* is taught through "Hocam değil… arkadaşım!".
  - "Ama çok yakın!": a native would say "çok yaklaştın".
- **Warnings:** none of its own.
- **Persian:** «استاد» نه… «رفیق»!; «مرسی، رفیق!».

### s1e39 · Prova sınavı (The mock exam)
Nima freezes on the long question; Dilnoza picks Nima up, and Nima decides to speak up.
- **Open:**
  - The standard term is "deneme sınavı"; "prova" is your title.
  - "herkesle" became "herkes".
- **Warnings:** none of its own.
- **Persian:** «اهلِ تهرانم.»; «این تازه A1 بود.».

### s1e40 · Bugün, lütfen! (Today, please!)
Nima goes to Tolga Bey and gets the notary today and the repairman for nine.
- **Open:**
  - Confirm Farzad on the phone in one option.
  - Farzad's hang-up uses the "message" sound.
- **Warnings:** none of its own.
- **Persian:** «باشه! قول می‌دم! این «فردا» دیگه واقعیه!».

### s1e41 · Yedi hafta (Seven weeks)
Nima retells the season to Maria Teyze. The radiator is warm, and the contract is stamped.
- **Open:**
  - The flashback insets point at step numbers in s1e01, s1e14 and s1e36, and will move if those drafts change.
  - "Yedi haftadan beri": everyday speech says "yedi haftadır".
- **Warnings:** none of its own.
- **Persian:** the proverb «قطره قطره جمع گردد، وانگهی دریا شود.»; «هفتهٔ اول سخت بود. ولی بعدش دوست‌ها پیدا شدن.».

### s1e42 · Bilgi yarışması (Quiz night) · special
Berfin's quiz night, the class against the building, one round per unit.
- **Open:**
  - Maria Teyze does not speak; the brief's lines would make 7 speakers.
  - The newcomer is not in the extras.
  - There is no scoreboard, and the café clock has no time.
- **Warnings:** none of its own.
- **Persian:** «ولی امشب… همه نفرِ اولن.»; titleFa «مسابقهٔ اطلاعات عمومی».

## Week 8 · Sınav ve bayram

### s1e43 · Prova (Rehearsal)
Ömer rehearses his 29 Ekim song on the stairs and forgets the second verse.
- **Open:**
  - The laugh option's "Özür dilerim, Ömer!" cannot be a card (an engine gap).
  - "Dosyam tamam!" replaces "Belgelerim tamam!".
- **Warnings:** none.
- **Persian:** «نیما! نوبتت چطور بود؟».

### s1e44 · Kerim'in günü (Kerim's day)
Exam week from Kerim's side: İsmail's tea through Zafer Hoca, Farzad's food at the door.
- **Open:**
  - Confirm Farzad's silent visit.
  - İsmail has a four-sentence turn.
  - Check where his paper bag is while Nima sleeps.
- **Warnings:** routes ×6.
- **Persian:**
  - «غروب امتحان رو دیدم، ولی نگفتم.»
  - «این از طرفِ آقای اسماعیله. برای شما.»
  - The quiz: «کریم کدام کلمه را به جا می‌گذارد؟»

### s1e45 · A1'den sonra (After A1)
The last speaking session at Berfin's; Alex invites everyone to Kadıköy. This is the six-speaker exception.
- **Open:**
  - "Konuşma!" can read as "Don't speak!".
  - Parvaneh's «من میترسم» has no ZWNJ, on purpose, for the gloss.
  - "herkes bir soru" and "Ya sen?" are naturalness changes from the brief.
- **Warnings:** 17 lines.
- **Persian:** «قطره‌قطره جمع گردد، وانگهی دریا شود!» (Persian says "sea" where Turkish says "lake").

### s1e46 · Cumhuriyet Bayramı (Republic Day)
Ömer's song in the park, then tea by the Bosphorus at Ortaköy at last.
- **Open:**
  - Rayan is not on stage, because the park has no free mark.
  - Ömer on Serkan's shoulders is not staged.
- **Warnings:** 20 lines.
- **Persian:** «شما هم همین‌طور! جشنتون مبارک!»; «عمر نفرِ سومِ ردیفه!».

### s1e47 · Sınav günü (Exam day)
The four-part exam: Nima freezes, asks again slowly, and gets through. The permit is approved.
- **Open:** "Bir daha, lütfen. Yavaş, lütfen." is the brief's line; a native would say "Daha yavaş, lütfen".
- **Warnings:** 26 lines; routes ×1; recycling (the season's end).
- **Persian:** «اقامتم درست شد!».

### s1e48 · Vapurda çay (Tea on the ferry) · special
The ferry to Kadıköy. Nima teaches bu/şu/o, answers the day-two questions, and spends the jar on tea for everyone. Kerim's album follows.
- **Open:**
  - Confirm Farzad's and Kırlangıç's lines.
  - "Ya biz?!" replaces the brief's "Ve biz?!".
  - The places lack marks, so Yusuf, Farzad (first deck scene) and Rayan (second) are missing.
- **Warnings:** none.
- **Persian:** «آقا! برای همه چای، لطفاً! چای مهمونِ ما!».
