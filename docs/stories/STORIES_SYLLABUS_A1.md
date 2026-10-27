# A1 syllabus: what a learner meets, page by page

Generated on 2026-10-09 from the transcripts, the A1/A2/B1 vocabulary CSVs and the Kumru A1 grammar lessons. It is the planning reference for `STORIES_A1.md`: what each story may use. The data behind it is `sahne/packages/sahne-story/syllabus/a1.json` (every word's first unit, page and book, each lesson's pages, each unit's new-word count, the A1 words never met), built from the repo by `tools/syllabus.py` (`--check` fails when it is stale; `--report` prints the new-word counts per section and per unit). The rebuild follows the rules below; its counts differ slightly from the tables here, which came from the original, unpublished build.

**How the stories use it.** The owner's class skips Başlangıç and does one unit a week. A story in week N may use the words and grammar of Ünite 1–N, judged by the units of the books and workbook word lists. The page detail below shows where in a unit a word first comes up, and which words the books show earlier than their list unit.

**Study order.** Başlangıç (pp. 7–9), then for each unit: opener, books section A, workbook section A, books B, workbook B, books C, workbook C, then the books unit-end pages (İZLE - ÖĞREN … KELİME LİSTESİ). "New" means first met in that order. Workbook pages are the printed numbers (A1 workbook: PDF page = printed − 2 in units 1–4, printed − 4 in units 5–6).

**What counts as meeting a word.** Running text, exercise items, tables, dialogues, grammar boxes and section titles; exercise instructions (`####` lines) count but are flagged `via: instruction`; listening and video scripts (Dinleme Metinleri, pp. 125–128) count on the page their `(s. N)` label points to and are flagged `via: listening` / `video`. Not counted: KELİME LİSTESİ pages, skill headings (OKUMA, DİNLEME…), unit-opener topic lists, ÖZ DEĞERLENDİRME, English grammar notes, word-search grids, letters of gapped words, and image descriptions.

## Grammar → page

| # | Lesson | Book page(s) | Book block |
|---|---|---|---|
| 1 | `g_a1_1_alfabe` — Türk alfabesi: the Turkish alphabet | 16 | 1B DİL BİLGİSİ |
| 2 | `g_a1_1_unlu_uyumu` — Ünlü uyumu: the vowel lists behind every suffix | 16, 20, 21 | 1B DİL BİLGİSİ (vowel table) + 1C rules |
| 3 | `g_a1_1_bu_su_o` — Bu, şu, o · Kim? Ne? | 20 | 1C DİL BİLGİSİ |
| 4 | `g_a1_1_cogul` — Çoğul eki: -lAr | 20, 21 | 1C DİL BİLGİSİ |
| 5 | `g_a1_1_soru` — Soru eki: mI | 21 | 1C DİL BİLGİSİ |
| 6 | `g_a1_1_burasi` — Burası neresi? | 22 | 1C DİL BİLGİSİ |
| 7 | `g_a1_2_bulunma` — Bulunma durumu: -DA | 31 | 2A DİL BİLGİSİ |
| 8 | `g_a1_2_var_yok` — Var, yok | 32 | 2A DİL BİLGİSİ |
| 9 | `g_a1_2_sayilar` — Sayılar: numbers | 35, 36 | 2B DİL BİLGİSİ |
| 10 | `g_a1_2_kacinci` — Kaçıncı?: sıra sayıları -(I)ncI | 36 | 2B DİL BİLGİSİ |
| 11 | `g_a1_2_isim_cumleleri` — İsim cümleleri: -(y)Im, -sIn, -(y)Iz, -sInIz | 40 | 2C DİL BİLGİSİ |
| 12 | `g_a1_2_degil` — İsim cümleleri: değil ve soru · Ne iş yapıyorsun? | 40, 41 | 2C DİL BİLGİSİ |
| 13 | `g_a1_3_simdiki` — Şimdiki zaman: -(I)yor | 52, 53 | 3A DİL BİLGİSİ |
| 14 | `g_a1_3_simdiki_olumsuz` — Şimdiki zaman: olumsuz ve soru | 52, 53 | 3A DİL BİLGİSİ |
| 15 | `g_a1_3_yonelme` — Yönelme durumu: -(y)A | 57 | 3B DİL BİLGİSİ |
| 16 | `g_a1_3_unsuz` — Ünsüz yumuşaması ve sertleşme: kitap → kitaba, sınıf → sınıfta | 57 | 3B DİL BİLGİSİ, 1. NOT |
| 17 | `g_a1_3_uzaklasma` — Uzaklaşma durumu: -DAn | 57 | 3B DİL BİLGİSİ |
| 18 | `g_a1_3_mak_istemek` — -mAk istemek: want to | 60 | 3C DİL BİLGİSİ |
| 19 | `g_a1_4_iyelik` — İyelik ekleri: my, your, his/her… | 69 | 4A DİL BİLGİSİ |
| 20 | `g_a1_4_ulke_milliyet_dil` — Ülke – milliyet – dil adları: countries, nationalities, languages | 73 | 4B DİL BİLGİSİ |
| 21 | `g_a1_4_kendi_hep` — Kendi, hep · hepimiz, hepsi, bütün, herkes | 85 ⚠ order | Ünite 4 BİR ADIM ÖTESİ |
| 22 | `g_a1_4_belirtme` — Belirtme durumu: -(y)I | 78 | 4C DİL BİLGİSİ |
| 23 | `g_a1_4_ad_durumlari` — Ad durum ekleri: -DA, -(y)A, -DAn, -(y)I | 79 | 4C DİL BİLGİSİ exercises |
| 24 | `g_a1_5_saatler` — Saatler: Saat kaç? Saat kaçta? | 89, 90 | 5A DİL BİLGİSİ |
| 25 | `g_a1_5_dan_a_kadar` — -DAn -(y)A kadar: from … to / until | 90 | 5A DİL BİLGİSİ |
| 26 | `g_a1_5_gecmis` — Belirli geçmiş zaman: -DI | 94 | 5B DİL BİLGİSİ |
| 27 | `g_a1_5_once_sonra` — -DAn önce / sonra · -mAdAn önce / -DIktAn sonra | 97 | 5C DİL BİLGİSİ |
| 28 | `g_a1_5_dan_beri` — -DAn beri, -DIr: since, for | 98 | 5C DİL BİLGİSİ |
| 29 | `g_a1_6_belirtili_tamlama` — Belirtili isim tamlaması: -(n)In … -(s)I | 107 | 6A DİL BİLGİSİ |
| 30 | `g_a1_6_belirtisiz_tamlama` — Belirtisiz isim tamlaması: isim + isim-(s)I | 108 | 6A DİL BİLGİSİ |
| 31 | `g_a1_6_yer_yon` — Yer-yön: üstünde, altında, yanında, karşısında, arasında | 110 | 6B HAZIRLIK ÇALIŞMASI (word box), not DİL BİLGİSİ |
| 32 | `g_a1_6_ki` — -ki eki | 111, 112 | 6B DİL BİLGİSİ |
| 33 | `g_a1_6_daha` — Karşılaştırma: -DAn daha | 117 | 6C DİL BİLGİSİ |
| 34 | `g_a1_6_en` — Karşılaştırma: en | 117 | 6C DİL BİLGİSİ |

Lessons whose `order` differs from the book's page order: `g_a1_4_kendi_hep` (order 21, book position 23, p. 85).

## Sections in study order

| Pages | Section | Grammar taught | New | First new words | Chunks first met |
|---|---|---|---|---|---|
| 7 | Başlangıç — ALFABE |  | 57 | araba, aramak, arkadaş, aç, ağaç, bahçe, bakmak, bebek, bulmak, ceket, dağ, defter, deniz, dinlemek, elma … |  |
| 8 | Başlangıç — SAYILAR / GÜNLER / AYLAR, MEVSİMLER |  | 66 | altmış, altı, aralık, ay, ağustos, aşağı, beş, bin, bir, cuma, cumartesi, doksan, dokuz, doldurmak, domates … | Saat kaç?, Kaç lira?, Hesap ne kadar?, Ne kadar? |
| 9 | Başlangıç — GÜNLÜK İFADELER / TANIŞMA / NEREDESİN? / NE İŞ YAPIYORSUN? |  | 50 | ad, Adın ne?, Afiyet olsun., akşam, avukat, banka, ben, Ben de., ders, doktor, eczacı, eczane, ev, garson, gelmek … | Selam!, Benim adım …, Senin adın ne?, Ben de memnun oldum., Ne iş yapıyorsun?, Neredesin?, Afiyet olsun., Görüşmek üzere., Görüşürüz., Güle güle., Günaydın., Hoşça kal. … |
| 11 | Ü1 opener |  | 0 |  |  |
| 12–15 | Ü1 A. TANIŞMA, SELAMLAŞMA, DİLEKLER |  | 93 | Almanya, dilek, İyi günler., İyiyim., Japonya, nasıl, Nasılsın?, Nerelisin?, Nijerya, Teşekkür ederim., bey, değil, eşleştirmek, fena, hanım … | Nasılsınız?, Sen nasılsın?, Ben de iyiyim., Sen nerelisin?, Teşekkür ederim, iyiyim., İyiyim, teşekkür ederim., İyiyim., İyi günler., Nasılsın?, Nerelisin?, Teşekkür ederim., Ne haber? … |
| WB 4–5 | Ü1 A. TANIŞMA, SELAMLAŞMA, DİLEKLER |  | 28 | Avusturya, Fransa, ne zaman, Peru, söylemek, Tanıştığımıza memnun oldum., Türkmenistan, zaman, Ürdün, ABD, Arjantin, bayrak, bekâr, biz, emekli … | Tanıştığımıza memnun oldum. |
| 16–18 | Ü1 B. ALFABE | `1_alfabe`, `1_unlu_uyumu` | 33 | baba, bunlar, ceviz, harf, karışık, lale, saç, sıra, tahta, Türkçe, vazo, yeni, çocuk, ızgara, düzenlemek (A2) … |  |
| WB 6 | Ü1 B. ALFABE |  | 0 |  |  |
| 19–23 | Ü1 C. BU NE? O KİM? | `1_unlu_uyumu`, `1_bu_su_o`, `1_cogul`, `1_soru`, `1_burasi` | 111 | bilgisayar, bu, burası, evet, eşya, fincan, hayır, kim, kulaklık, neresi, şu, klima (A2), makine (A2), hesap makinesi (B1), bardak … | Bu ne?, O kim?, Burası neresi?, Bu kim?, Bunlar ne? |
| WB 7–9 | Ü1 C. BU NE? O KİM? |  | 11 | anahtar, askı, bisiklet, gemi, pasta, basketbolcu, cevaplamak, futbolcu, perde, şapka, işaretlemek |  |
| 24–28 | Ü1 unit end (İZLE - ÖĞREN, GÜNLÜK İFADELER, KENDİNİ ÇEK, MİKROFON SENDE, KÜLTÜRDEN KÜLTÜRE, BİR ADIM ÖTESİ, EĞLENELİM ÖĞRENELİM, NELER ÖĞRENDİK?, ÖZ DEĞERLENDİRME, KELİME LİSTESİ) |  | 21 | Affedersiniz., izlemek, rezervasyon, cevap vermek, Kendine iyi bak., liste, saniye, vedalaşmak, vermek, ısmarlamak, hayırlı (A2), paylaşmak (A2), çekmek (A2), açmak, demek … | Affedersiniz., Selamünaleyküm!, Aleykümselam!, Allah'a ısmarladık!, Hayırlı günler!, Kendine iyi bak., … ne demek?, Tahtaya bak!, Kitabı aç!, Tekrar et!, Cevap ver!, Buraya gel! … |
| 29 | Ü2 opener |  | 0 |  |  |
| 30–33 | Ü2 A. OKULDA | `2_bulunma`, `2_var_yok` | 36 | alt, bütün, düzeltmek, içecek, kantin, kimde, lamba, sekreter, teneffüs, yazı tahtası, yiyecek, çünkü, üst, şimdi, diğer … |  |
| WB 10–11 | Ü2 A. OKULDA |  | 6 | bugün, herkes, ya da, yol, cüzdan, sinema | Saat kaçta? |
| 34–37 | Ü2 B. SAYILAR | `2_sayilar`, `2_kacinci` | 30 | fotoğraf, litre, süt, telefon numarası, çöp kutusu, merkez (A2), çöp (A2), Buyurun., acil (A2), servis (A2), acil servis (B1), doğum tarihi, kaçıncı, lig, olimpiyat … | Kaç yaşındasın?, Telefon numaran kaç?, Kaç yaşındasınız?, Telefon numaranız kaç?, Bugünün tarihi nedir?, Buyurun., Alo., Tabii. |
| WB 12–13 | Ü2 B. SAYILAR |  | 17 | binmek, bir de, burada, büfe, efendim, fiyat, hepsi, müşteri, Peki., peynir, pil, sipariş, taze, yarım, ürün … | Hepsi ne kadar?, Peki. |
| 38–43 | Ü2 C. ŞEHİRDE | `2_isim_cumleleri`, `2_degil` | 87 | bankacı, fırın, kasap, kuyumcu, manav, pastane, postane, resepsiyonist, semt, tezgahtar, şehir, cadde, hasta, neden, orada … | Evli misin?, Mesleğin ne? |
| WB 14–15 | Ü2 C. ŞEHİRDE |  | 32 | biraz, deniz kenarı, e-posta, hava, internet kafe, kötü, lezzetli, meydan, restoran, sahil, Sevgiler., sevgili, sinirli, sıcakkanlı, çirkin … | Sevgiler. |
| 44–48 | Ü2 unit end (İZLE - ÖĞREN, GÜNLÜK İFADELER, KENDİNİ ÇEK, MİKROFON SENDE, KÜLTÜRDEN KÜLTÜRE, BİR ADIM ÖTESİ, EĞLENELİM ÖĞRENELİM, NELER ÖĞRENDİK?, ÖZ DEĞERLENDİRME, KELİME LİSTESİ) |  | 30 | anne, dağınık, şimdilik, lazım (A2), anlatmak, harika, kutlamak, alışveriş, alışveriş merkezi, açık, genellikle, gündüz, istasyon, nesne, sabah … | Çok güzel!, Neyse!, Aferin!, Müthiş!, Çok iyi!, Pekiyi!, Mükemmel!, Harika!, Tastamam!, On numara!, Kutlarım! |
| 49 | Ü3 opener |  | 0 |  | Ne yapıyorsun? |
| 50–54 | Ü3 A. BİR GÜNÜM | `3_simdiki`, `3_simdiki_olumsuz` | 68 | banyo yapmak, ders çalışmak, ilk, kahvaltı etmek, kalkmak, müzik, pişirmek, uyumak, önce, bazen, başlamak, bitmek, buluşmak, duş, duş almak … |  |
| WB 16–18 | Ü3 A. BİR GÜNÜM |  | 39 | anneanne, birinci sınıf, bol bol, bu yüzden, dede, defa, dikkat etmek, giyinmek, hepimiz, her şey, ilaç, kesinlikle, Merak etme., merak etmek, meyve … | Sık sık, Anneciğim, bol bol, Merak etme. |
| 55–58 | Ü3 B. BOŞ ZAMANLARIM | `3_yonelme`, `3_unsuz`, `3_uzaklasma` | 54 | bilgisayar oyunu, futbol, kimden, kime, bavul, bayılmak, beslenmek, dergi, değişik, dizi, fotoğraf çekmek, gezi, hoşlanmak, kulüp, nefret etmek … |  |
| WB 19–21 | Ü3 B. BOŞ ZAMANLARIM |  | 20 | döner, hazırlanmak, hemen, İtalya, kurs, selam söylemek, benzin, düşmek, havuz, oyun oynamak, patron, polisiye, tatil yapmak, yem, yem vermek … |  |
| 59–61 | Ü3 C. İSTANBUL'DA GEZİYORUM | `3_mak_istemek` | 40 | atmak, bale, dans, fikir, futbol maçı, gösteri, heyecanlı, opera, sanmak, sergi, stres atmak, geçirmek (A2), nefes (A2), nefes almak (A2), arka … | Hafta sonu ne yapıyorsun?, Bilmiyorum., Pardon., Tabii ki!, Kaç beden giyiyorsunuz?, Başka bir şey?, Hoş geldiniz. |
| WB 22–24 | Ü3 C. İSTANBUL'DA GEZİYORUM |  | 43 | beğenmek, Bir dakika., bozuk para vermek, dakika, indirim yapmak, kredi kartı, kredi kartı kullanmak, Maalesef., nakit, nakit para vermek, para üstü, para üstü vermek, pazarlık yapmak, peşin ödemek, taksit … | Bir dakika., Maalesef., Yardım edebilir misiniz? |
| 62–66 | Ü3 unit end (İZLE - ÖĞREN, GÜNLÜK İFADELER, KENDİNİ ÇEK, MİKROFON SENDE, KÜLTÜRDEN KÜLTÜRE, BİR ADIM ÖTESİ, EĞLENELİM ÖĞRENELİM, NELER ÖĞRENDİK?, ÖZ DEĞERLENDİRME, KELİME LİSTESİ) |  | 33 | maaş, matematik, orta, röportaj, yazar, acele (A2), acele etmek (A2), simit (A2), tost (A2), özellik (A2), görev (B1), oldukça (B1), seviye (B1), baş, bitirmek … | Öyle mi?, Ayda yılda bir, Ara sıra, Çoğu kez, Kimi zaman, İçeri girebilir miyim?, Bir soru sorabilir miyim?, Tekrar edebilir misiniz?, Dışarı çıkabilir miyim? |
| 67 | Ü4 opener |  | 1 | dünya |  |
| 68–71 | Ü4 A. AİLEM | `4_iyelik` | 30 | abla, amca, anaokulu, ağabey, babaanne, dayı, erkek kardeş, hala, ilkokul, karı, koca, kız kardeş, lise, oğul, teyze … | Doğru! |
| WB 25–26 | Ü4 A. AİLEM |  | 14 | diş doktoru, elbette, görünmek, hep beraber, kuzen, muhasebeci, şanslı, anlaşmak, eğlenmek, fakülte, mendil, tüy, yüksek lisans, yüksek (A2) |  |
| 72–75 | Ü4 B. ARKADAŞLARIM | `4_ulke_milliyet_dil` | 42 | Arapça, Arnavutça, Kazakistan, Kazakça, mektup, Rusça, yabancı dil, çeşitli, şirket, çocukluk arkadaşı (A2), arkadaşlık (B1), Almanca, Brezilya, Brezilyalı, Bulgarca … | Nerelisiniz? |
| WB 27–29 | Ü4 B. ARKADAŞLARIM |  | 14 | anadil, Bu ne demek?, iş bölümü, iş bölümü yapmak, İtalyalı, temizlik yapmak, Ermenice, Ermenistan, Fas, Hindistan, Hintçe, İtalyanca, Kırgızca, Kırgızistan | Bu ne demek? |
| 76–81 | Ü4 C. AİLEMDEN UZAKTA | `4_belirtme`, `4_ad_durumlari` | 19 | göndermek, mesaj, zaman geçirmek, bırakmak, kule, zamir, özel, akraba, apartman, düşünmek, el, hatırlamak, plan yapmak, unutmak, karşı … | Kendinize iyi bakın. |
| WB 30–31 | Ü4 C. AİLEMDEN UZAKTA |  | 13 | gelenek, hissetmek, rehberlik yapmak, saray, götürmek, kitapçı, meyve suyu, mont, sofra, toplamak, öğretmek, klasik (A2), yaka (A2) |  |
| 82–86 | Ü4 unit end (İZLE - ÖĞREN, GÜNLÜK İFADELER, MİKROFON SENDE, KENDİNİ ÇEK, KÜLTÜRDEN KÜLTÜRE, EĞLENELİM ÖĞRENELİM, BİR ADIM ÖTESİ, NELER ÖĞRENDİK?, ÖZ DEĞERLENDİRME, KELİME LİSTESİ) | `4_kendi_hep` | 26 | dış, enfes, geçen, karşılamak, sunum, toplantı, yurt dışı, yılbaşı, zeki, iş toplantısı (A2), karşılaşmak (A2), öncelik (A2), açıkçası (B1), minik (B1), Ne yazık ki. (B1) … | Ne yazık ki., Hocam, Canım, Dostum, Kanka, Üstadım |
| 87 | Ü5 opener |  | 0 |  |  |
| 88–91 | Ü5 A. SAATLER | `5_saatler`, `5_dan_a_kadar` | 17 | buçuk, devam etmek, mola, program, çeyrek, mola vermek (A2), süre (A2), randevu, ilan (A2), bitiş (B1), ajanda, basketbol, dişçi, iskele, güneşli (A2) … |  |
| WB 34 | Ü5 A. SAATLER |  | 6 | Alaska, Azerbaycan, Güney Kore, ileri, saat farkı, Uruguay |  |
| 92–95 | Ü5 B. BAYRAMLAR | `5_gecmis` | 44 | anma, baklava, bayram, bayramlık, egemenlik, el öpmek, gençlik, gösteri yapmak, harçlık, ikram etmek, kolonya dökmek, marş, ulusal, zafer, demokrasi (A2) … |  |
| WB 35–36 | Ü5 B. BAYRAMLAR |  | 18 | alışmak, deneyim, etkinlik, etkinlik yapmak, kaçırmak, lunapark, reçel, seyahat etmek, tecrübe, yerleşmek, şu an, ancak (B1), az önce, bakan, firma … |  |
| 96–99 | Ü5 C. ÖZEL GÜNLER | `5_once_sonra`, `5_dan_beri` | 35 | anneler günü, doğmak, düğün, hastalık, nice, para toplamak, pasta kesmek, üflemek, mutlu olmak (A2), sonsuz (A2), şaşırmak (A2), başlık (B1), mum (B1), diş fırçalamak, satın almak … | Bayramınız kutlu olsun, Doğum günün kutlu olsun, Nice senelere, Sonsuz mutluluklar, Ne zamandan beri?, Ne zamandır? |
| WB 37–38 | Ü5 C. ÖZEL GÜNLER |  | 13 | babalar günü, bir araya gelmek, değer, mesaj çekmek, mutluluk, sevgililer günü, takı, şık, kokmak, palto, sekreterlik yapmak, yolculuk etmek, alışverişe çıkmak (A2) |  |
| 100–104 | Ü5 unit end (İZLE - ÖĞREN, GÜNLÜK İFADELER, MİKROFON SENDE, KENDİNİ ÇEK, KÜLTÜRDEN KÜLTÜRE, BİR ADIM ÖTESİ, EĞLENELİM ÖĞRENELİM, NELER ÖĞRENDİK?, ÖZ DEĞERLENDİRME, KELİME LİSTESİ) |  | 37 | harcamak (A2), karar almak (A2), kızartmak (A2), sağlıksız (A2), düşük (B1), uygulamak (B1), kültür, meşhur, tasarlamak, ücret, afiş (A2), festival (A2), yöresel (A2), acı (B1), can (B1) … | Hayret!, Anladım., Hay hay!, Haydi canım!, Bana ne!, Yok artık!, Sana ne!, İlginç!, Olamaz!, Vay be! |
| 105 | Ü6 opener |  | 1 | çevre |  |
| 106–109 | Ü6 A. AİLEM | `6_belirtili_tamlama`, `6_belirtisiz_tamlama` | 26 | akıllı, bahçeli, enişte, ilgilenmek, terzi, yenge, çiftçi, meyve ağacı (A2), yetiştirmek (A2), başkent, kumanda (A2), alan, eksik, inanmak, patlıcan … |  |
| WB 39–40 | Ü6 A. AİLEM |  | 17 | becerikli, dürüst, güler yüzlü, mavi gözlü, sarı saçlı, son model, spor araba, tek katlı, model (B1), baldız, kayınbirader, kayınpeder, kayınvalide, sayfa çevirmek, top … |  |
| 110–114 | Ü6 B. NEREDE? | `6_yer_yon`, `6_ki` | 24 | köprü, spor salonu, gürültü, komşu, manzara, mümkün, sallanmak, salıncak, eklemek (A2), güleryüzlü (A2), ilişki (B1), sahip (B1), uyum (B1), bağlamak, dolaşmak … |  |
| WB 41–42 | Ü6 B. NEREDE? |  | 24 | batı, bölge, cennet, dağlık, doğu, endüstri, güneydoğu, hayvancılık, karlı, kuzeybatı, kuzeydoğu, kıta, nüfus, tarım, yağışlı … |  |
| 115–119 | Ü6 C. VÜCUDUMUZ | `6_daha`, `6_en` | 53 | akmak, alın, kaş, kaşınmak, kulak, kızarmak, parmak, vücut, yanak, çene, öksürmek, boğaz (A2), acımak (B1), ateş düşürücü, ağrı … | Şikâyetiniz nedir?, Kendimi iyi hissetmiyorum., Bir bakayım. |
| WB 43–45 | Ü6 C. VÜCUDUMUZ |  | 18 | ağız, bacak, bilek, cips, ciğer, dengeli, diz, göğüs, iyileşmek, kızmak, organ, orta boylu, terli, marka, kullanışlı … |  |
| 120–124 | Ü6 unit end (İZLE - ÖĞREN, GÜNLÜK İFADELER, MİKROFON SENDE, KENDİNİ ÇEK, KÜLTÜRDEN KÜLTÜRE, BİR ADIM ÖTESİ, EĞLENELİM ÖĞRENELİM, NELER ÖĞRENDİK?, ÖZ DEĞERLENDİRME, KELİME LİSTESİ) |  | 25 | klarnet, otantik, başrol (A2), dürüm (A2), eser (A2), Eyvah! (A2), izleyici (A2), kabul etmek (A2), kasaba (A2), olay (A2), usta (A2), ücretsiz (A2), uyarmak (B1), kemik, köşe … | Eyvah!, Bir deri bir kemik, Balık etli, Buğday tenli |

## New words per unit

| Unit | books | Workbook | Total | of which A1 / A2 / B1 | via instruction / listening / video |
|---|---|---|---|---|---|
| Başlangıç | 173 | 0 | 173 | 163 / 8 / 2 | 13 / 7 / 0 |
| 1 | 258 | 39 | 297 | 276 / 18 / 3 | 41 / 18 / 0 |
| 2 | 183 | 55 | 238 | 212 / 20 / 6 | 20 / 14 / 4 |
| 3 | 195 | 102 | 297 | 250 / 38 / 9 | 6 / 3 / 8 |
| 4 | 118 | 41 | 159 | 128 / 20 / 11 | 7 / 14 / 13 |
| 5 | 133 | 37 | 170 | 120 / 34 / 16 | 8 / 1 / 5 |
| 6 | 129 | 59 | 188 | 125 / 43 / 20 | 7 / 6 / 6 |

## A1 CSV words never met in A1 running text

49 of 1323 A1 CSV words. 

**Only in a KELİME LİSTESİ (or a heading, opener list, word grid or English grammar note)** (37): bay (u1), bayan (u1), diş fırçası (u1), fırça (u1), misal (u1), roman (u1), uçurtma (u1), Üzgünüm. (u1), artı (u2), dikkatsiz (u2), eksi (u2), güçsüz (u2), koridor (u2), çarpı (u2), önemsiz (u2), inşallah (u3), kanepe (u3), tur (u3), öğrenci işleri (u3), ortaokul (u4), biricik (u5), birliktelik (u5), coşku (u5), galeri (u5), heyecan (u5), kapanmak (u5), kurum (u5), saygıdeğer (u5), sosyal olmak (u5), tadı damağında kalmak (u5), yaşlanmak (u5), yenmek (u5), zorluk (u5), ömür (u5), akciğer (u6), mercimek çorbası (u6), midesi bulanmak (u6)

**Only in a form that is equally another word** (3): kutlama (ders:93), resmi (ders:32), tarihî (ders:35)

**Not found anywhere in the A1 books by the matcher** (9; mostly workbook-list words whose only use is inside a gapped picture word or a grid, or forms the matcher does not derive): dondurma (u1, çalışma), musluk (u1, çalışma), vişne (u1, çalışma), çatal (u1, çalışma), çaydanlık (u1, çalışma), çorap (u1, çalışma), araba sürmek (u3, çalışma), dirsek (u6, çalışma), sinema oyuncusu (u6, çalışma)

## A2 / B1 CSV words met in A1 running text

181 A2 and 67 B1 words. First 40 in study order:

anlam (A2, ders:7, instruction), başlangıç (B1, ders:7), dalmak (A2, ders:7), su (A2, ders:7), valiz (A2, ders:7), hesap (A2, ders:8), gece (A2, ders:9), günlük (A2, ders:9), havaalanı (B1, ders:9), İyi dersler. (A2, ders:9), Fena değil. (B1, ders:13), haber (A2, ders:13), iyilik (A2, ders:13), rica (A2, ders:13), bol (A2, ders:14), özür (A2, ders:14), özür dilemek (A2, ders:14), numaralandırmak (A2, ders:15, instruction), düzenlemek (A2, ders:16, instruction), hesap makinesi (B1, ders:19), klima (A2, ders:19), makine (A2, ders:19), oluşturmak (A2, ders:20, instruction), bildirmek (B1, ders:21), gol (A2, ders:21), miktar (A2, ders:21), not (A2, ders:21), hayırlı (A2, ders:25), paylaşmak (A2, ders:25, instruction), çekmek (A2, ders:25, instruction), seçenek (A2, ders:27, instruction), durum (A2, ders:31), tavan (A2, ders:31), tramvay (A2, ders:32), hayvan (A2, ders:33), merkez (A2, ders:34), çöp (A2, ders:34), acil (A2, ders:35), acil servis (B1, ders:35), servis (A2, ders:35)

## How matching works, and where it is unsure

- Word forms: every CSV word is matched on whole tokens with a Turkish suffix-chain check (noun: plural, possessive, case, -ki, copula; verb: one tense/mood/participle suffix, optionally after a passive or causative), consonant softening, vowel drop (şehir/şehri, ağız/ağzı) and vowel harmony. This replaces the reader's occurrence index's looser rule (any 0–7 letters after the stem), which put e.g. *almak* on p. 7 (ALFABE), *başlamak* on p. 7 (BAŞLANGIÇ), *atmak* on p. 16 (athta) and *pazar* inside *pazartesi*.
- When two CSV words claim one token the longer one wins (okul over okumak in *okulda*), except that a higher-level word that is itself an inflected lower-level word loses (*adım* B1 'step' vs ad+ım, *formda*, *dilim*, *birden*, *çıktı*, *yapma*). Real ties (noun vs verb on the same stem: *yaz*, *aç*, *iç*, *kız*) go to the noun unless the token carries a verbal suffix, ends an imperative (!), or is printed as a stem (*anla-*).
- Hits that stay ambiguous do not set the first page; they are listed under `ambiguousWords` on the page and as `ambiguousAt` in words.json.
- Names: Title-case words that are people's names in the books (Can, Dilek, Doğa, Demet, Pınar, Melek, Özlem, Ümit, Arzu, Özgür, Emre, Selin, Yüksel …) or that sit mid-sentence are not counted as the lowercase word.
- Homographs: *ünlü* 'vowel' is not counted as A2 *ünlü* 'famous' on grammar lines (first real use p. 46); *tarihi* (tarih+i vs tarihî) and *resmi* (resim+i vs resmî) stay ambiguous; a stem before a suffix blank (*et_____*, *kız_____*) stays ambiguous between noun and verb. Not handled: same spelling, no clue at all (yüz 'hundred/face', gelecek 'future/will come', yaz 'summer/write!' without '!').
- Common words the CSVs do not list (dil, adam, ek, cevap, doğum, kelime, için, üzere, asla, hatta …) are held back so their forms are not read as a listed word (dilimiz is not A2 *dilim*, ekleri is not *eklemek*).
- Başlangıç listening exercise 5 (minimal pairs kol/kul, yaz/yüz, buz/biz …) is not counted: sounds, not words taught. Gapped picture words (k___l___m) and word-search grids never count; most of the 9 'not found' words live only there.
- books p. 10 has no transcript (Başlangıç is pp. 7–9, Ünite 1 starts on p. 11); the A1 workbook scan lacks printed pp. 32–33, so workbook Ünite 5 starts mid-section A on p. 34.
- Chunks: CSV `kalıp ifade` entries (any level) plus a hand list of formulae from the GÜNLÜK İFADELER, BİR ADIM ÖTESİ and dialogue pages, matched as exact phrases.
