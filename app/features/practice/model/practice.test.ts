// What a learner types and the steps they get: which cards clash, the steps of a words lesson, accepted forms and built
// sentences, word hints, forgiving slips, the question side of a built sentence and the reading sentences of a lesson.
import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptForms, checkBuilt, checkTyped, compileAccept, diffSlip, editOps, slipReason } from "./answers.ts";
import { buildGlossIndex, glossSegments, glossToken, lessonSentences, meaningClash, promptSegments } from "./gloss.ts";
import { wordLessonSteps } from "./lessons.ts";

const eq = (got, want, msg) => assert.equal(JSON.stringify(got), JSON.stringify(want), msg);

test("practice logic", () => {
  const card=(id,tr,en,fa)=>({id,tr,en,fa});

  /* meaningClash: a learner could not tell the two apart */
  eq(meaningClash(card("a","bay","Mr.","آقا"),card("b","bey","mister","آقا")),true,"bay and bey share a Persian sense");
  eq(meaningClash(card("a","erkek","man; male","مرد"),card("b","adam","man","مرد")),true,"shared English sense after a split on ;");
  eq(meaningClash(card("a","yemek","to eat","خوردن"),card("b","yiyecek","eat","خوراک")),true,"to-infinitive matches the bare verb");
  eq(meaningClash(card("a","elma","apple","سیب"),card("b","su","water","آب")),false,"unrelated words");
  eq(meaningClash(card("a","dış","outside (of sth)","بیرون"),card("b","dışarı","outside, exterior","بیرون")),true,"a parenthetical note is ignored");
  eq(meaningClash(card("a","iyi","good","خوب"),card("b","İyi","well","خوب")),true,"same Turkish word, any case");
  eq(meaningClash(card("a","kar","snow","برف"),card("b","kâr","profit","سود")),false,"different words with near spellings");
  eq(meaningClash(card("a","x","","" ),card("b","y","","")),false,"empty meanings do not clash");
  eq(meaningClash(null,card("b","y","a","ب")),false,"missing card");
  eq(meaningClash(card("a","gün","day; sun","روز"),card("b","güneş","sun","خورشید")),true,"one shared sense is enough");

  /* wordLessonSteps: teach, check the one before, match round, write-it per word; every word asked three times */
  const W=n=>Array.from({length:n},(_,i)=>card("w"+i,"t"+i,"e"+i,"ف"+i));
  const asked=(q,c)=>q.filter(s=>s.k!=="learn"&&(s.c===c||(s.cards||[]).includes(c))).length;
  for(const n of [1,2,3,4,5]){const ws=W(n),q=wordLessonSteps(ws,"New words",true);
    eq(ws.every(c=>asked(q,c)>=(n>1?3:2)),true,"n="+n+": every word is asked "+(n>1?3:2)+" times");
    eq(q.filter(s=>s.k==="learn").map(s=>s.c.id),ws.map(c=>c.id),"n="+n+": words are taught in order");
    eq(q.filter(s=>s.k==="learn").every((s,i)=>s.n===i+1&&s.of===n),true,"n="+n+": 'n of N' numbering");
    eq(q.length,n>1?3*n+1:3*n-1+1,"n="+n+": step count")}
  {const ws=W(5),q=wordLessonSteps(ws,"New words",false),at=c=>q.findIndex(s=>s.k==="learn"&&s.c===c);
    /* a check never comes before its word was taught, and the first word is checked after the second is taught */
    eq(q.every((s,i)=>s.k==="learn"||!s.c||at(s.c)<i),true,"checks come after the teach card");
    eq(q.findIndex(s=>s.k==="choice"&&s.c===ws[0])>at(ws[1]),true,"w0 is checked after w1 is taught");
    eq(q.filter(s=>s.k==="choice"&&s.dir==="m").every(s=>!s.dpool.some(d=>at(d)>=q.indexOf(s))),true,"early checks offer only words taught so far");
    eq(q.some(s=>s.k==="listen"),false,"no listen step without a Turkish voice");
    eq(q.filter(s=>s.k==="type").map(s=>s.c.id),["w2","w3","w4","w0","w1"],"write-it order is rotated");
    eq(q.filter(s=>s.k==="match").map(s=>s.cards.length),[5],"one match round with all five")}
  eq(wordLessonSteps(W(5),"x",true).filter(s=>s.k==="listen").map(s=>s.c.id),["w4"],"a voice turns every third write-it step into a listen step");
  eq(wordLessonSteps([],"x",true),[],"no words, no steps");
  /* a warm-up: earlier words are asked first, as meaning-to-pick questions that offer only each other */
  {const ws=W(5),rv=[card("r0","u0","f0","ر0"),card("r1","u1","f1","ر1")],q=wordLessonSteps(ws,"New words",false,rv);
    eq(q.slice(0,2).map(s=>[s.k,s.c.id,s.label]),[["choice","r0","Review"],["choice","r1","Review"]],"the warm-up comes first");
    eq(q[0].dpool.map(c=>c.id),["r0","r1"],"warm-up options come from the reviewed words");
    eq(q.length,wordLessonSteps(ws,"New words",false).length+3,"a warm-up adds one step per reviewed word and a last mixed match round");
    eq(q.filter(s=>s.k==="learn").length,5,"review words are not taught again")}
  /* a big lesson matches in rounds of at most five */
  eq(wordLessonSteps(W(8),"x",false).filter(s=>s.k==="match").map(s=>s.cards.length),[4,4,3],"eight words: two match rounds, then a mixed one");
  eq(wordLessonSteps(W(6),"x",false).filter(s=>s.k==="match").map(s=>s.cards.length),[3,3,3],"six words: two match rounds, then a mixed one");
  /* acceptForms / compileAccept / checkBuilt: optional words, alternatives, free order, and the verdicts */
  eq(acceptForms("[Sen] kaç yaşındasın").sort(),["kaç yaşındasın","sen kaç yaşındasın"],"an optional word gives both forms");
  eq(acceptForms("(Teşekkür ederim|Teşekkürler.) Ali").sort(),["teşekkür ederim ali","teşekkürler ali"],"alternatives, with punctuation ignored");
  eq(acceptForms("<dün|bu akşam> geldim").sort(),["bu akşam dün geldim","dün bu akşam geldim"],"a group's parts come in any order");
  eq(acceptForms("[ben] <a|b|c>").length,12,"an optional word times the six orders of three parts");
  eq(acceptForms("(a|b) (c|d) (e|f) (g|h) (i|j) (k|l) (m|n) (o|p) (q|r)",50).length,50,"expansion is capped");
  eq(Array.isArray(acceptForms("a ) b")),true,"a stray bracket does not hang the parser");
  {const A=compileAccept("Sen kaç yaşındasın?",["[Sen] kaç yaşındasın"]);eq([...A.forms].sort(),["kaç yaşındasın","sen kaç yaşındasın"],"the card's own text is always accepted");eq([...A.toks].sort(),["kaç","sen","yaşındasın"],"tokens of every accepted form");}
  const cb=(p,tr,acc)=>{const r=checkBuilt(p,tr,acc);return [r.ok,r.kind]};
  eq(cb(["Sen","kaç","yaşındasın"],"Sen kaç yaşındasın?"),[true,"exact"],"exact, any case");
  eq(cb(["kaç","yaşındasın"],"Sen kaç yaşındasın?",["[Sen] kaç yaşındasın"]),[true,"variant"],"a variant without the optional word");
  eq(cb(["kaç","yaşındasın"],"Sen kaç yaşındasın?"),[false,"wrong"],"without a pattern the shorter form is wrong");
  eq(cb(["Ben","bu","akşam","dün","geldim"].slice(1),"Ben dün bu akşam geldim.",["<dün|bu akşam> geldim"]),[true,"variant"],"free order of the group");
  eq(cb(["ne","Bu"],"Bu ne?"),[false,"order"],"two words in the wrong order are not forgiven");
  eq(cb(["Ben","çok","iyiyim","de"],"Ben de çok iyiyim."),[false,"order"],"the right words in another order");
  eq(cb(["Ben","çok","iyiyim","Siz"],"Ben de çok iyiyim."),[false,"wrong"],"a wrong word");
  eq(cb(["ben","çok","de","iyiyim"],"Ben de çok iyiyim."),[true,"swap"],"one swap of neighbours in a four-word sentence is almost right");
  eq(cb(["çok","ben","de","iyiyim"],"Ben de çok iyiyim."),[false,"order"],"a longer shuffle is only the right words");
  eq(checkBuilt(["ne","Bu"],"Bu ne?").bad,[0,1],"bad lists the positions that differ");
  eq(checkBuilt(["Bu","ne","ne"],"Bu ne?").bad,[2],"an extra word is bad");
  /* word hints: buildGlossIndex, glossToken (exact, apostrophe, stripped endings) and glossSegments (phrases first) */
  {const w=(tr,en)=>({kind:"word",tr,en,fa:"ف"}),idx=buildGlossIndex([w("arkadaş","friend"),w("kitap","book"),w("ev","house"),w("hoş geldin","welcome"),w("gelmek","to come"),w("ağabey (abi)","older brother"),w("İstanbul","Istanbul"),w("Merhaba.","hello")]);
    eq(glossToken("Merhaba!",idx).card.en,"hello","an exact word, case and punctuation ignored");
    eq(glossToken("İstanbul'da",idx).note,"form of «İstanbul»","before an apostrophe");
    eq(glossToken("arkadaşlarımla",idx).card.en,"friend","three endings stripped");
    eq(glossToken("kitabı",idx).card.en,"book","a softened final consonant is restored (kitab to kitap)");
    eq(glossToken("evde",idx).card.en,"house","a two-letter stem takes a two-letter ending");
    eq(glossToken("geliyorum",idx).card.en,"to come","a verb stem from the infinitive");
    eq(glossToken("abi",idx).card.en,"older brother","the word in parentheses is a key too");
    eq(glossToken("xyzabc",idx),null,"an unknown word has no hint");
    eq(glossToken("zzz",idx,{zzz:"a made-up word"}).en,"a made-up word","a card's own gloss wins");
    eq(glossSegments("Hoş geldin Ali!",idx).map(s=>[s.text,!!s.hit]),[["Hoş geldin",true],[" ",false],["Ali!",false]],"a phrase card is matched before single words");
    eq(glossSegments("Ben evde kitap okuyorum.",idx).map(s=>s.text).join(""),"Ben evde kitap okuyorum.","segments rebuild the sentence exactly");
    eq(glossSegments("Ben evde kitap okuyorum.",idx).filter(s=>s.hit).map(s=>s.text),["evde","kitap"],"only known words are hinted")}
  /* forgiving slips: diffSlip (per word: diacritic, swap, one letter), its limits, the reasons, and checkTyped with them */
  const ds=(x,y)=>{const r=diffSlip(x,y);return r?[r.kind,slipReason(r)]:null};
  eq(ds("gunaydin","günaydın"),["diacritic","ü, not u; ı, not i"],"missing Turkish letters are forgiven at any length");
  eq(ds("ev","ev"),["exact",""],"equal text is exact");
  eq(ds("kitap","kıtap"),["diacritic","ı, not i"],"a dotted i for a dotless one is a diacritic slip");
  eq(ds("teşekkür ederm","teşekkür ederim"),["typo","one letter missing"],"one letter missing in a long answer");
  eq(ds("teşekkür ederim","teşekkür ederim")[0],"exact","the same answer is exact");
  eq(ds("kitpa","kitap"),["swap","two letters swapped"],"two letters swapped");
  eq(ds("kitapp","kitap"),["typo","one letter too many"],"an extra letter");
  eq(ds("kitip","kitap"),["typo","one letter wrong"],"one wrong letter");
  eq(ds("evl","ev"),null,"a word of 3 letters or fewer is never forgiven for a typo");
  eq(ds("kdi","kedi"),["typo","one letter missing"],"four letters are enough for one edit");
  eq(ds("kitapxx","kitap"),null,"two edits in a five-letter word are too many");
  eq(ds("arkadaşlrım","arkadaşlarım"),["typo","one letter missing"],"one edit in a twelve-letter word");
  eq(ds("arkadaşlrım ve","arkadaşlarım ve"),["typo","one letter missing"],"one slipped word among exact ones");
  eq(ds("arkadşlrım","arkadaşlarım"),["typo","a couple of letters off"],"two edits are allowed from nine letters");
  eq(ds("iyi akşamlr","iyi akşamlar")[0],"typo","a slip in the second word");
  eq(ds("iyi","iyi akşamlar"),null,"a different number of words is not a slip");
  eq(editOps("kitpa","kitap",1),[{op:"swap",i:3,j:3}],"editOps marks a swap");
  eq(editOps("kdi","kedi",1),[{op:"missing",i:1,j:1}],"editOps marks the missing letter of the answer");
  eq(editOps("kitapp","kitap",1),[{op:"extra",i:4,j:4}],"editOps marks the extra typed letter (one of the two p)");
  eq([checkTyped("Gunaydin.","Günaydın").ok,checkTyped("Gunaydin.","Günaydın").near],[true,true],"checkTyped forgives and flags a slip");
  eq(checkTyped("günaydın","Günaydın."),{ok:true,exact:true},"punctuation and case never matter");
  eq(checkTyped("selam","merhaba").ok,false,"a different word is wrong");
  eq(checkTyped("evl","ev").ok,false,"a short word with an extra letter stays wrong");
  eq(checkTyped("teşekkür ederm","Teşekkür ederim (kısaltma)").ok,true,"the parenthesis-free form is checked too");
  /* the question side: Persian or English prompt words that stand for a Turkish word */
  {const w=(tr,en,fa)=>({kind:"word",tr,en,fa}),idx=buildGlossIndex([w("ben","I","من"),w("çok","very","خیلی"),w("iyiyim","I'm fine","خوبم."),w("hoş geldin","welcome","خوش آمدی"),w("nasılsın","how are you","چطور")]);
    const hits=(p,tr,l)=>promptSegments(p,tr,idx,null,l).filter(s=>s.hit).map(s=>[s.text,s.hit.word]);
    eq(hits("من خیلی خوبم.","Ben çok iyiyim.","fa"),[["من","Ben"],["خیلی","çok"],["خوبم.","iyiyim."]].map(([a,b])=>[a,b.replace(".","")]),"each Persian word points at its Turkish word");
    eq(promptSegments("من خیلی خوبم.","Ben çok iyiyim.",idx,null,"fa").map(s=>s.text).join(""),"من خیلی خوبم.","segments rebuild the prompt exactly");
    eq(hits("I'm very well.","Ben çok iyiyim.","en"),[["very","çok"]],"the English line hints only the words it can match");
    eq(hits("خوش آمدی علی","Hoş geldin Ali!","fa"),[["خوش آمدی","Hoş geldin"]],"a two-word meaning is one hint");
    eq(hits("تو چطوری؟","Sen nasılsın?","fa"),[["چطوری؟","nasılsın"]],"a stem plus a few letters matches");
    eq(hits("خوبم خوبم","Ben çok iyiyim.","fa").length,1,"a prompt word is used once")}
  /* the last match round mixes the lesson's last words with earlier ones; sentences come before it */
  {const rv=[card("r0","u0","f0","ر0"),card("r1","u1","f1","ر1")],sn=[{id:"s1",tr:"t0 t1",fa:"ف",en:"e"},{id:"s2",tr:"t2 t3",fa:"ف",en:"e"}],q=wordLessonSteps(W(4),"x",false,rv,sn),last=q[q.length-1];
    eq([last.k,last.label,last.cards.map(c=>c.id)],["match","Review",["w1","w2","w3","r0","r1"]],"the last step is a mixed match round");
    eq(q.filter(s=>s.k==="build").map(s=>s.sent.id),["s1","s2"],"one build step per sentence");
    eq(q.findIndex(s=>s.k==="build")>q.map(s=>s.k).lastIndexOf("type"),true,"sentences come after the write-it steps");
    eq(wordLessonSteps(W(4),"x",false,[],[]).filter(s=>s.k==="build").length,0,"no sentences, no build steps")}
  /* lessonSentences: sentences that use the lesson's words, most words first; stems for long words, exact for short ones */
  {const ws=[card("a","elma","","" ),card("b","su","",""),card("c","ekmek","","")],pool=[{id:"1",tr:"Elmayı yiyorum."},{id:"2",tr:"Su içiyorum."},{id:"3",tr:"Elma ve ekmek var."},{id:"4",tr:"Sular çok soğuk."},{id:"5",tr:"Kitap okuyorum."}];
    eq(lessonSentences(ws,pool,3).map(s=>s.id),["3","2"],"most matching words first, then shorter; a word of 4 letters or fewer matches only exactly (elma is not Elmayı)");
    eq(lessonSentences(ws,pool,1).map(s=>s.id),["3"],"max limits the list");
    eq(lessonSentences(ws,[{id:"5",tr:"Kitap okuyorum."}]),[],"nothing matches, nothing returned")}
  eq(wordLessonSteps(W(2),"x",false).some(s=>s.k==="match"),true,"two words still match");
  eq(wordLessonSteps(W(1),"x",false).some(s=>s.k==="match"),false,"a single word has no match round");

  /* checkTyped with other words of the same meaning */
  eq(checkTyped("bey","bay",["bey"]),{ok:true,exact:true,alt:"bey"},"another card's Turkish word for the same meaning is accepted");
  eq(checkTyped("bey","bay").ok,false,"without synonyms it is wrong");
  eq(checkTyped("Teşekkürler.","Teşekkür ederim.",["Teşekkürler."]).alt,"Teşekkürler.","a typed synonym names itself");
});
