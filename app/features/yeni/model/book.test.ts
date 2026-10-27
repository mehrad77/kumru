// The book bridge's pure half: the reader's notebook as a model, the shared summary and the checkpoint offers. Ported from
// tools/kumru_book.test.js, which cut them out of the built page; the assertions are the same. 
import assert from "node:assert/strict";
import { test } from "node:test";
import * as A from "./book.ts";

const eq = (got, want, msg) => assert.equal(JSON.stringify(got), JSON.stringify(want), msg);
const ok = (c, m) => eq(!!c, true, m);

test("the book bridge", () => {
  /* unit ids -> refs; the alphabet, listening scripts and answer key are none */
  eq(A.bkParse("a1/ders/03_Unite_3_Ne_Yapiyorsun"),{lv:"A1",book:"ders",n:3,ref:"A1_3"},"ders stem");
  eq(A.bkParse("b1/calisma/06_Unite_6_Bir_Dunya_Kultur"),{lv:"B1",book:"calisma",n:6,ref:"B1_6"},"calisma stem");
  eq(A.bkParse("a2/ders/01_Unite_1"),{lv:"A2",book:"ders",n:1,ref:"A2_1"},"stem with no title");
  for(const bad of ["a1/ders/00_Baslangic","a1/ders/07_Dinleme_Metinleri","a2/calisma/07_Cevap_Anahtari","a1/ders/07_Unite_7_x","c1/ders/01_Unite_1_x","a1/kitap/01_Unite_1_x","","a1/ders/01_Unite_1x"])eq(A.bkParse(bad),null,"not a unit: "+bad);

  /* a notebook: A1 Ünite 3 done in both books, Ünite 4 only the main book, Ünite 5 begun, junk ignored */
  const T0=Date.UTC(2026,9,1),DAY=864e5;
  const rec=(o)=>({v:1,updated:0,pages:{},ex:{},write:{},sa:{},...o});
  const pages=(n,at)=>Object.fromEntries(Array.from({length:n},(_,i)=>[String(40+i),at]));
  const file={app:"yeni-defter",v:1,exported:0,gw:{v:1,updated:0,items:{}},meta:{v:1,created:0,days:[],last:{unit:"a1/ders/04_Unite_4_Benim_Dunyam",at:T0+5*DAY}},units:{
    "a1/ders/03_Unite_3_Ne_Yapiyorsun":rec({pages:pages(18,T0),done:{v:true,at:T0+DAY},pos:{page:55,at:T0+DAY},ex:{"A.1":{at:T0,v:["x"],ok:2,n:2},"A.2":{at:T0,v:["x"],ok:1,n:2},"B.1":{at:T0,v:[null],shown:true},"B.2":{at:T0,v:[null]}}}),
    "a1/calisma/03_Unite_3_Ne_Yapiyorsun":rec({pages:pages(9,T0),done:{v:true,at:T0+2*DAY}}),
    "a1/ders/04_Unite_4_Benim_Dunyam":rec({pages:pages(10,T0),done:{v:true,at:T0+3*DAY},pos:{page:78,at:T0+5*DAY}}),
    "a1/ders/05_Unite_5_Zaman_Zaman":rec({pages:pages(4,T0+6*DAY),pos:{page:90,at:T0+6*DAY}}),
    "a1/ders/00_Baslangic":rec({pages:pages(3,T0+9*DAY),done:{v:true,at:T0}}),
    "a1/ders/07_Dinleme_Metinleri":rec({pages:pages(2,T0)}),
    "a2/calisma/07_Cevap_Anahtari":rec({pages:pages(2,T0)}),
    "a2/ders/02_Unite_2_x":rec({done:{v:false,at:T0}}),
    "a1/ders/06_Unite_6_x":null}};
  const M=A.bookModel(file);
  eq(Object.keys(M.units).sort(),["A1_3","A1_4","A1_5","A2_2"],"only numbered units are modelled");
  eq(M.units.A1_3.d,1,"both books done -> done");
  eq(M.units.A1_4.d,0,"the main book alone is not done (a missing workbook record is not done)");
  eq(M.units.A1_5.d,0,"unfinished");eq(M.units.A2_2.d,0,"done.v false is not done");
  eq(M.doneRefs,["A1_3"],"doneRefs");eq(M.done,1,"done count");
  eq(M.units.A1_3.p,1,"pages: 27 of 18 + 9, capped at 1");
  eq(Math.round(M.units.A1_4.p*100)/100,.37,"pages: 10 of 20 + 7");
  eq(M.units.A1_3.s,[3,1,3],"exercises: tried = checked or revealed (3), solved = all right (1), seen = those with activity (3); the empty entry is not counted");
  eq(M.units.A1_4.s,[0,0,0],"no exercises");
  eq(M.last,{ref:"A1_4",lv:"A1",n:4,book:"ders",page:78,at:T0+5*DAY},"last = meta.last, with the page from that unit's pos");
  eq(A.bookModel({units:{"a1/ders/05_Unite_5_x":rec({pos:{page:90,at:T0}}),"a1/ders/06_Unite_6_x":rec({pos:{page:100,at:T0+DAY}})}}).last,{ref:"A1_6",lv:"A1",n:6,book:"ders",page:100,at:T0+DAY},"no meta.last: the newest page seen");
  eq(A.bookModel({meta:{last:{unit:"a1/ders/00_Baslangic",at:T0}},units:{"a1/ders/05_Unite_5_x":rec({pos:{page:90,at:T0}})}}).last.ref,"A1_5","meta.last on the alphabet falls back to a numbered unit");
  eq([A.bookModel(null),A.bookModel({}),A.bookModel({units:5}),A.bookModel("x")],[null,null,null,null],"not a notebook");
  eq(A.bookModel({units:{}}).done,0,"an empty notebook has no units done");

  /* "In the book" shows for 30 days */
  eq(A.bookLast(M,T0+5*DAY+29*DAY)!==null,true,"29 days after: shown");
  eq(A.bookLast(M,T0+5*DAY+31*DAY),null,"31 days after: hidden");
  eq(A.bookLast(null,T0),null,"no model");
  eq(A.bkReaderUrl("https://yeni.shab.boo","A1","ders",4,78),"https://yeni.shab.boo/a1/ders/4/#p-78","reader link with page");
  eq(A.bkReaderUrl("https://yeni.shab.boo","B1","calisma",2,null),"https://yeni.shab.boo/b1/calisma/2/","reader link without page");

  /* the shared summary: per unit d/p/s, last, never answers; small */
  const S1=A.bookSummary(M,T0+9*DAY);
  eq(S1,{v:1,at:T0+9*DAY,units:{A1_3:{d:1,p:1,s:[3,1,3]},A1_4:{d:0,p:.37,s:[0,0,0]},A1_5:{d:0,p:.17,s:[0,0,0]}},last:{ref:"A1_4",at:T0+5*DAY}},"summary shape (a unit with no activity is left out)");
  eq(A.bookSummary(null,5),{v:1,at:5,units:{},last:null},"no notebook");
  eq(A.bookSig(S1)===A.bookSig({...S1,at:1}),true,"the signature ignores the time");
  eq(A.bookSig(S1)===A.bookSig({...S1,units:{...S1.units,A1_5:{d:0,p:.2,s:[0,0,0]}}}),false,"and notices a change");
  {const big={units:{}};for(const lv of ["a1","a2","b1"])for(let n=1;n<=6;n++)for(const b of ["ders","calisma"])big.units[`${lv}/${b}/0${n}_Unite_${n}_x`]=rec({pages:pages(12,T0),done:{v:true,at:T0},ex:Object.fromEntries(Array.from({length:60},(_,i)=>["E."+i,{at:T0,v:["a"],ok:1,n:1}]))});
    const doc=A.bookSummary(A.bookModel(big),T0);ok(JSON.stringify(doc).length<=4096,"all 18 units, busy: under 4 KB ("+JSON.stringify(doc).length+")");eq(Object.keys(doc.units).length,18,"all 18 listed");
    const tiny=A.bookSummary({units:Object.fromEntries(Array.from({length:400},(_,i)=>["A1_"+i,{d:i%2,p:.5,s:[1,1,1]}])),last:null},T0);ok(JSON.stringify(tiny).length<=4096,"a model over the cap is trimmed to 4 KB")}

  /* offers. st.refs says where Kumru has each unit */
  const done=refs=>({doneRefs:refs,units:{}});
  const st=(refs)=>({refs});
  const R=(where,cp)=>({where,cp:!!cp});
  eq(A.bookOffer(done(["A1_3"]),st({A1_3:R("cur",true)})),{kind:"checkpoint",ref:"A1_3"},"current unit, checkpoint open: offer it");
  eq(A.bookOffer(done(["A1_3"]),st({A1_3:R("cur",false)})),null,"current unit, checkpoint still locked: no offer (never past a lock)");
  eq(A.bookOffer(done(["A1_3"]),st({A1_3:R("done")})),null,"already done in Kumru: nothing");
  eq(A.bookOffer(done(["A1_3"]),st({A1_3:R("later")})),{kind:"jump",ref:"A1_3"},"ahead of the learner: the tested jump");
  eq(A.bookOffer(done(["A1_2"]),st({A1_2:R("past",true)})),{kind:"checkpoint",ref:"A1_2"},"placed past: its checkpoint is open");
  eq(A.bookOffer(done(["A1_3"]),st({})),null,"a unit the path doesn't show");
  eq(A.bookOffer(done(["A1_3"]),st({A1_3:R("cur",true)}),{A1_3:T0}),null,"dismissed for that unit");
  eq(A.bookOffer(done(["A1_3","A1_4"]),st({A1_3:R("cur",true),A1_4:R("later")}),{A1_3:T0}),{kind:"jump",ref:"A1_4"},"one dismissed, the next unit still offers");
  eq(A.bookOffer(done(["A1_2","A1_3","A1_5"]),st({A1_2:R("past",true),A1_3:R("cur",true),A1_5:R("later")})),{kind:"checkpoint",ref:"A1_3"},"one offer at a time: the current unit first");
  eq(A.bookOffer(done(["A1_2","A1_5"]),st({A1_2:R("past",true),A1_5:R("later")})),{kind:"checkpoint",ref:"A1_2"},"then a placed-past unit, then a jump");
  eq(A.bookOffer(done(["A1_4","A1_6"]),st({A1_4:R("later"),A1_6:R("later")})),{kind:"jump",ref:"A1_6"},"several ahead: the furthest (the test covers the ones between)");
  eq(A.bookOffer(done(["A1_3"]),st({A1_3:R("cur",true)}),null),{kind:"checkpoint",ref:"A1_3"},"no dismissals map");
  eq(A.bookOffer(null,st({})),null,"no model");eq(A.bookOffer(done([]),st({A1_3:R("cur",true)})),null,"nothing finished in the book");
  /* the offer only ever names a unit the model finished: a unit mid-way in the book gets none */
  eq(A.bookOffer(M,st({A1_3:R("cur",true),A1_4:R("later"),A1_5:R("later")})),{kind:"checkpoint",ref:"A1_3"},"with the model above only A1_3 is book-done");


  /* the page counts come from AGENTS.md's ranges */
  eq(A.BK_PAGES.A1.ders[0],18,"A1 ders Ünite 1 has 18 pages");eq(A.BK_PAGES.B1.calisma.reduce((a,b)=>a+b,0),40,"B1 workbook, units 4-43");
  eq(A.BK_PAGES.A2.calisma.reduce((a,b)=>a+b,0),42,"A2 workbook, units 4-45");eq(A.BK_PAGES.A1.calisma.reduce((a,b)=>a+b,0),40,"A1 workbook, units 2-41");
});
