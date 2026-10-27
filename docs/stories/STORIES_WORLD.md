# Stories: world

Where the story series happens: the districts each level uses, and every place a story is set in, with the id it has as `place`. The index of all story docs is `README.md`. The people are in `STORIES_CAST.md`; the place document's fields are in `STORIES_SCHEMA.md` §6.

## 1. Setting
- **A1:** Beyoğlu, Beşiktaş and Şişli. Farzad's flat and later Nima's own, Beykent TÖMER (Taksim campus), the bakkal, Berfin's café, the streets and the transport between them.
  - Şişli includes Kurtuluş and Feriköy, with their Rum and Armenian history.
  - Beşiktaş has its çarşı, the pier and the football club.
  - Beyoğlu has İstiklal, the tram, the Tünel funicular and the cafés.
- **A2:** Üsküdar, Fatih and other districts join, along with day trips.
- **B1:** places for work, university and health, and trips to other cities.
- **Art:** every place is a Sahne place document built from the kit's set pieces (`sahne/packages/sahne/DESIGN.md` §5.5), drawn by Claude in code. The old series' flat backdrops are gone from the app (commit 4e707ec).

## 2. Places

Every place a story uses, with the id it will have as `place`, in the order A1 first uses them (checked against the 48 briefs, 2026-10-09). Each one needs a Sahne place document (`sahne/packages/sahne/DESIGN.md` §5.5) before its first story, drawn with good details: the set pieces, marks, props, times of day, sound and Kerim's perch its stories ask for. That work is M2 in `ROADMAP.md`. The documents live in `data/places/`. Which are built, and how far each meets the standard, is on the gallery's Places board (`#/places`; `node sahne/packages/sahne-story/places.ts --check`). The ids below are **sites**. A site with several separate spaces is split into places that share it: each place's id is `<site>_<sub>` and it carries `site: "<site>"` (the metro's `metro_m11` and `metro_osmanbey`, `flat_nima`'s `flat_nima_stairs`). A site with one space is a single place with the site's id. The places of each site are listed in `sahne/packages/sahne-story/places/needs.json`. Smaller spots inside one space are marks, not places (`STORIES_SCHEMA.md` §2, §6).

| id *(proposed)* | Place | District | First used · also | Notes |
|---|---|---|---|---|
| `ist` | IST airport (İstanbul Havalimanı): the roof, arrivals | Arnavutköy | s1e01 | The arrival. *havalimanı* is not a card yet; it gets a gloss (*havaalanı* is a B1 card) |
| `metro` | Metro: the M11 from IST, the M2 Şişli–Taksim (carriage, platform, entrances) | — | s1e01 · s1e14, s1e24, s1e25 | *metro* is an A1_1 card. Marks for the Osmanbey platform and the Şişhane entrance |
| `flat_farzad` | Farzad's flat, and the street outside | Mecidiyeköy, Şişli | s1e01 · s1e06, s1e10, s1e13 | Nima lives here until moving day (s1e13) |
| `tomer` | Beykent Üniversitesi TÖMER, Taksim campus: the door and steps, the corridor with its notice board | Beyoğlu | s1e02 · s1e07, s1e08, s1e15, s1e22, s1e24, s1e39, s1e44, s1e47 | Marks: `door`, `steps`, `board` (the flat ads, s1e07), `corridor`, `office_window` (Zafer Hoca's office from outside, s1e44) |
| `office` | Reza Bey's international office | Beyoğlu | s1e02 | On the Taksim campus: a ticket machine, a queue, his folder |
| `class504` | Class 504 | Beyoğlu | s1e03 · 15 more stories | The A1 classroom; "beş yüz dört" doubles as a numbers joke. The Farsça jar on Parvaneh's desk from s1e16 |
| `istiklal` | İstiklal Caddesi, from Taksim square to the Şişhane metro entrance, with Galata in the distance | Beyoğlu | s1e04 · s1e14, s1e15, s1e24 | The red tram; *tramvay* is an A2 list word, glossed in A1 |
| `bakkal` | İsmail's bakkal | Taksim, Beyoğlu | s1e05 · s1e34, s1e44 | Round the corner from the TÖMER campus, so Nima drops in before and after class (moved from Mecidiyeköy, 2026-10-09). *bakkal* is بقال in Persian too |
| `office_emlak` | Tolga Bey's estate agency | Şişli | s1e08 (in a split frame) · s1e11, s1e40 | A shopfront with an EMLAK sign; listings in the window |
| `flat_nima` | Nima's flat and its stairway (street door, landings, the empty rooms, later Nima's room and desk) | Feriköy, Şişli | s1e08 · 16 more stories | Elif, Serkan and Ömer on the second floor, Nima on the fourth, Maria Teyze on the fifth |
| `pazar_ferikoy` | The Saturday organic market | Feriköy, Şişli | s1e12 | Stalls, price tags, *Gel abla gel!* (the antiques market is on Sundays) |
| `rooftop` | The rooftop over Nima's flat | Feriköy, Şişli | s1e09 · 9 more stories | The building's shared roof (parties in s1e18, s1e30). Mark `tank`: Kerim's own perch on the old water tank above it, up a short iron ladder, where the Bosphorus shows between the buildings. Only Kerim and (from s1e35) Nima go there |
| `taxi` | Serkan's yellow taxi, from inside, with the city going by | — | s1e13 · s1e46 | The radio ("Gol!"); a parallax city layer. *taksi* has no list entry |
| `ferikoy` | Feriköy's streets: Nima's street to Osmanbey, the side streets, the park from outside | Feriköy / Kurtuluş, Şişli | s1e14 · s1e17, s1e31, s1e33, s1e36, s1e46 | Cats on walls, a church gate, a tree, a Rum patisserie, the fırın, the eczane, a bench between the two bakeries |
| `library_bu` | Beykent library | Beyoğlu | s1e24 | The treasure hunt's red book; *kütüphane* is an A1_1 card |
| `bus` | İETT bus, in traffic | — | s1e25 | *otobüs* is an A1_1 card |
| `flat_maria` | Maria Teyze's flat, fifth floor | Feriköy, Şişli | s1e27 · s1e41 | Lace, old photos of Feriköy, a wall calendar, geraniums in the window box |
| `flat_elif` | Elif's flat, second floor | Feriköy, Şişli | s1e28 | The doorway, the kitchen, the living-room floor |
| `flat_kirlangic` | Kırlangıç's flat | **Open** (the owner decides, or kept generic) | s1e29 | Yarn everywhere; a balcony |
| `cafe_berfin` | Berfin's café: tiny, between the fırın and the eczane | Feriköy, Şişli | s1e31 · s1e36, s1e42, s1e45 | "Feriköy'ün en küçük kafesi"; the guide pinned on the wall from s1e36 |
| `cicekci` | Gülten Hanım's flower shop | Feriköy, Şişli (on the corner) | s1e32 | Buckets of roses, tulips, geraniums |
| `firin` | The bakery on the corner | Feriköy, Şişli | s1e33 | A queue at 4 p.m.; the second bakery by the park is shown from outside, in `ferikoy` |
| `goc` | The Göç İdaresi (immigration office): a numbered queue, counters, a clerk behind glass | **Open** (branch) | s1e35 | The residence-permit thread (*ikamet*). Shown plainly, never as a villain |
| `library_ibb` | An İBB library | **Open** (branch) | s1e38 | A free city library with long opening hours |
| `park_ferikoy` | The park in Feriköy, with the belediye's small stage | Feriköy, Şişli | s1e46 | The 29 Ekim celebration where Ömer's kindergarten sings (schools are closed on the day itself) |
| `ortakoy` | The Bosphorus shore at Ortaköy, under the bridge | Beşiktaş | s1e46 | Crowds, the lit bridge, a *çaycı*: Nima's Bosphorus tea at last |
| `vapur` | The ferry from Beşiktaş to Kadıköy: the pier, then the deck | Beşiktaş → Kadıköy | s1e48 | Tea glasses, a *çaycı* with a tray, gulls, the city sliding by, Kız Kulesi. *vapur* is an A1_3 card, *iskele* an A1_6 card |
| `kadikoy` | Kadıköy: the pier with its lamp posts, the market streets beyond | Kadıköy | s1e48 | Alex's sign at the pier ("HOŞ GELDİNİZ, 504!"); his hostel is only pointed at. The first Asian-side place, ahead of A2 |

**Not used in A1, kept for A2:** `yildiz` (Yıldız Park, Beşiktaş: Kırlangıç knits, Rayan runs) and `dolmus` (Taksim–Beşiktaş; *dolmuş* gets a gloss). `cafe` (Berfin's café in Beşiktaş) was dropped on 2026-10-09 for `cafe_berfin`.

**Placeholders, not in a story yet** (added by the owner on 2026-10-10). These are places a later story can use. Each gets its id now, so a brief can name it.

| id *(proposed)* | Place | District | First used · also | Notes |
|---|---|---|---|---|
| `bufe_kazim` | Kazım Büfe, a büfe on Çırağan Caddesi by the Bosphorus ([map](https://maps.app.goo.gl/zSPusmfrjMR8b7jw6)) | Yıldız, Beşiktaş | — | A street counter: *tost*, *sandviç*, *ayran*, juice. A short walk from Ortaköy (s1e46) |
| `lokanta` | An *esnaf lokantası*: ready dishes behind glass, chosen by pointing and served on a tray | **Open** (generic until the owner picks one) | — | *hazır yemek*, *çorba*, *kuru fasulye*, *pilav*, *ayran*. Ordering by pointing practises *bu / şu / o* and *bir porsiyon, yarım porsiyon* |
| `sosyal_tesis` | İBB Cihangir Sosyal Tesisi: the city's own café-restaurant with a Bosphorus view ([map](https://maps.app.goo.gl/mMNEJJoRKdRUQ6Cm6)) | Cihangir (Kılıçalipaşa), Beyoğlu | — | Tea, breakfast and meals at city prices, downhill from the Taksim campus; *sosyal tesis* is İBB's name for these |
| `istanbulkart` | İBB's İstanbulkart centre at Taksim (*İstanbulkart Başvuru Merkezi*), where Nima gets a personal İstanbulkart ([map](https://www.google.com/maps/place/%C4%B0stanbulkart+Ba%C5%9Fvuru+Merkezi/@41.0368943,28.9857302,17z)) | Gümüşsuyu, Beyoğlu (Cumhuriyet Caddesi, entered from the Taksim metro) | — | A numbered queue, a counter, a form and a photo: *ad*, *soyad*, *doğum tarihi*, *fotoğraf*, *pasaport*, *bakiye*, *bilet*. The form's nationality line uses the hometown token or is left out, so Nima never claims a country (`STORIES_DESIGN.md` §1) |

## 3. Open items

1. Which **İBB library branch** `library_ibb` is (the backdrop can stay generic until then).
2. Which **Göç İdaresi** branch `goc` is (generic until then).
3. Where **Kırlangıç's flat** `flat_kirlangic` is: the owner decides, or it stays generic.
4. Which **lokanta** `lokanta` is (generic until the owner picks one).
