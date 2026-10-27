// The verb forms: every tense, person and form of the sample verbs, the Persian and English glosses, the unused forms,
// and that all of them build. Ported from tools/kumru_verbs.test.js, which cut the engine out of the built page; the
// assertions are the same.
import assert from "node:assert/strict";
import { test } from "node:test";
import { TENSES, VERBS, buildVerb, plainParts, verbEn, verbFa } from "./morphology.ts";

test("the verb engine", () => {
  let pass = 0;
  const failures: string[] = [];
  const bad = (m: string) => { failures.push(m); };
  const V=s=>VERBS.find(v=>v.s===s);const P=["1sg","2sg","3sg","1pl","2pl","3pl"];
  const tr=(v,t,p,f)=>{const ps=buildVerb(V(v),t,p,f);return ps?plainParts(ps):null};
  /* rows: verb tense form [six persons 1sg..3pl] (null = not checked / not used) */
  const T=[
   ["gel","iyor","pos",["geliyorum",null,null,null,null,"geliyorlar"]],["gel","iyor","neg",[null,null,null,"gelmiyoruz",null,null]],["gel","iyor","q",[null,null,null,null,null,"geliyorlar mı"]],
   ["gel","di","pos",["geldim",null,null,null,null,null]],["gel","di","neg",[null,null,null,null,"gelmediniz",null]],["gel","di","q",[null,null,"geldi mi",null,null,null]],
   ["gel","ecek","pos",["geleceğim",null,null,null,null,null]],["gel","ecek","neg",[null,null,"gelmeyecek",null,null,null]],["gel","ecek","q",[null,null,null,"gelecek miyiz",null,null]],
   ["gel","r","pos",["gelirim","gelirsin","gelir","geliriz","gelirsiniz","gelirler"]],
   ["gel","r","neg",["gelmem","gelmezsin","gelmez","gelmeyiz","gelmezsiniz","gelmezler"]],
   ["gel","r","q",["gelir miyim","gelir misin","gelir mi","gelir miyiz","gelir misiniz","gelirler mi"]],
   ["gel","mis","pos",["gelmişim","gelmişsin","gelmiş","gelmişiz","gelmişsiniz","gelmişler"]],["gel","mis","neg",[null,"gelmemişsin",null,null,null,null]],["gel","mis","q",["gelmiş miyim",null,null,null,null,"gelmişler mi"]],
   ["gel","abil","pos",["gelebilirim","gelebilirsin","gelebilir","gelebiliriz","gelebilirsiniz","gelebilirler"]],
   ["gel","abil","neg",["gelemem","gelemezsin","gelemez","gelemeyiz","gelemezsiniz","gelemezler"]],["gel","abil","q",["gelebilir miyim",null,null,null,null,"gelebilirler mi"]],
   ["gel","imp","pos",["geleyim","gel","gelsin","gelelim","gelin","gelsinler"]],
   ["gel","imp","neg",["gelmeyeyim","gelme","gelmesin","gelmeyelim","gelmeyin","gelmesinler"]],
   ["gel","imp","q",["geleyim mi",null,"gelsin mi","gelelim mi",null,"gelsinler mi"]],
   ["gel","iyordu","pos",["geliyordum","geliyordun","geliyordu","geliyorduk","geliyordunuz","geliyorlardı"]],["gel","iyordu","neg",["gelmiyordum",null,null,null,null,null]],
   ["gel","iyordu","q",["geliyor muydum",null,"geliyor muydu",null,"geliyor muydunuz","geliyorlar mıydı"]],
   ["gel","mali","pos",["gelmeliyim","gelmelisin","gelmeli","gelmeliyiz","gelmelisiniz","gelmeliler"]],["gel","mali","neg",["gelmemeliyim",null,null,null,null,null]],["gel","mali","q",["gelmeli miyim",null,null,null,null,"gelmeliler mi"]],
   ["gel","sa","pos",["gelsem","gelsen","gelse","gelsek","gelseniz","gelseler"]],["gel","sa","neg",["gelmesem",null,null,null,null,null]],["gel","sa","q",["gelsem mi",null,null,null,null,"gelseler mi"]],
   ["gel","sart","pos",["gelirsem","gelirsen","gelirse","gelirsek","gelirseniz","gelirlerse"]],["gel","sart","neg",["gelmezsem",null,null,null,null,"gelmezlerse"]],
   ["git","iyor","pos",["gidiyorum",null,null,null,null,null]],["git","di","pos",["gittim",null,null,null,null,null]],["git","ecek","pos",["gideceğim",null,"gidecek",null,null,null]],
   ["git","r","pos",["giderim",null,"gider",null,null,null]],["git","r","neg",["gitmem",null,"gitmez",null,null,null]],["git","mis","pos",["gitmişim",null,"gitmiş",null,null,null]],
   ["git","abil","pos",["gidebilirim",null,"gidebilir",null,null,null]],["git","abil","neg",["gidemem",null,"gidemez",null,null,null]],
   ["git","imp","pos",["gideyim","git","gitsin","gidelim","gidin","gitsinler"]],["git","imp","neg",["gitmeyeyim","gitme",null,null,null,null]],
   ["git","iyordu","pos",["gidiyordum",null,null,null,null,null]],["git","mali","pos",["gitmeliyim",null,"gitmeli",null,null,null]],["git","sa","pos",["gitsem",null,"gitse",null,null,null]],
   ["git","sart","pos",["gidersem",null,"giderse",null,null,null]],["git","sart","neg",[null,null,"gitmezse",null,null,null]],
   ["oku","iyor","pos",["okuyorum",null,null,null,null,null]],["oku","di","pos",["okudum",null,null,null,null,null]],["oku","ecek","pos",["okuyacağım",null,"okuyacak",null,null,null]],
   ["oku","r","pos",["okurum",null,"okur","okuruz",null,"okurlar"]],["oku","r","neg",["okumam",null,"okumaz","okumayız","okumazsınız",null]],["oku","r","q",[null,"okur musun",null,null,null,null]],
   ["oku","mis","pos",["okumuşum",null,"okumuş",null,null,null]],["oku","mis","neg",[null,null,"okumamış",null,null,null]],
   ["oku","abil","pos",["okuyabilirim",null,"okuyabilir",null,null,null]],["oku","abil","neg",["okuyamam",null,"okuyamaz","okuyamayız",null,null]],
   ["oku","imp","pos",["okuyayım","oku","okusun","okuyalım","okuyun","okusunlar"]],["oku","imp","neg",["okumayayım","okuma","okumasın","okumayalım","okumayın","okumasınlar"]],
   ["oku","imp","q",[null,null,null,"okuyalım mı",null,null]],["oku","iyordu","pos",["okuyordum",null,null,null,null,"okuyorlardı"]],
   ["oku","mali","pos",["okumalıyım",null,"okumalı","okumalıyız",null,null]],["oku","sa","pos",["okusam",null,null,"okusak","okusanız",null]],
   ["oku","sart","pos",["okursam",null,null,null,null,"okurlarsa"]],["oku","sart","neg",["okumazsam",null,null,null,null,null]],
   ["söyle","iyor","pos",["söylüyorum",null,null,null,null,null]],["söyle","r","pos",["söylerim",null,"söyler",null,null,null]],["söyle","r","neg",["söylemem",null,null,"söylemeyiz",null,null]],
   ["söyle","imp","pos",["söyleyeyim","söyle","söylesin","söyleyelim","söyleyin",null]],["söyle","abil","pos",[null,null,"söyleyebilir",null,null,null]],["söyle","abil","neg",["söyleyemem",null,null,null,null,null]],
   ["söyle","mis","pos",[null,null,"söylemiş",null,null,null]],["söyle","mali","pos",[null,null,"söylemeli",null,null,null]],["söyle","sart","pos",["söylersem",null,null,null,null,null]],
   ["söyle","iyordu","pos",[null,null,"söylüyordu",null,null,null]],["söyle","sa","pos",["söylesem",null,null,null,null,null]],
   ["al","r","pos",["alırım",null,"alır",null,null,"alırlar"]],["al","r","neg",["almam",null,"almaz","almayız",null,null]],
   ["al","imp","pos",["alayım","al","alsın","alalım","alın","alsınlar"]],["al","abil","pos",[null,null,"alabilir",null,null,null]],["al","abil","neg",["alamam",null,null,null,null,null]],
   ["al","mis","pos",[null,null,"almış",null,null,null]],["al","mali","pos",["almalıyım",null,null,null,null,null]],["al","sa","pos",["alsam",null,null,null,null,null]],
   ["al","sart","pos",["alırsam",null,null,null,null,null]],["al","sart","neg",[null,null,"almazsa",null,null,null]],["al","iyordu","pos",["alıyordum",null,null,null,null,null]],
   ["al","di","pos",["aldım",null,null,null,null,null]],["al","di","neg",["almadım",null,null,null,null,null]],
   ["iste","r","pos",["isterim",null,"ister",null,null,null]],["iste","iyor","pos",["istiyorum",null,null,null,null,null]],["iste","iyordu","pos",["istiyordum",null,null,null,null,null]],
   ["iste","imp","pos",["isteyeyim",null,null,null,"isteyin",null]],["iste","abil","pos",[null,null,"isteyebilir",null,null,null]],["iste","abil","neg",["isteyemem",null,null,null,null,null]],
   ["iste","mis","pos",[null,null,"istemiş",null,null,null]],["iste","mali","pos",[null,null,"istemeli",null,null,null]],["iste","sart","pos",["istersem",null,null,null,null,null]],["iste","sa","pos",["istesem",null,null,null,null,null]]];
  for(const [v,t,f,row] of T)row.forEach((exp,i)=>{if(exp==null)return;const got=tr(v,t,P[i],f);if(got===exp)pass++;else bad(`${v} ${t} ${P[i]} ${f}: expected ${exp}, got ${got}`)});
  /* not-used forms */
  for(const [v,t,p] of [["gel","imp","2sg"],["gel","imp","2pl"],["oku","imp","2pl"],...P.map(p=>["gel","sart",p])]){
    if(buildVerb(V(v),t,p,"q")===null&&verbFa(V(v),t,p,"q")===""&&verbEn(V(v),t,p,"q")==="")pass++;else bad(`${v} ${t} ${p} q should be unused`)}
  /* Persian and English samples */
  const FA=[["gel","r","1sg","pos","می‌آیم"],["gel","abil","1sg","pos","می‌توانم بیایم"],["gel","abil","1sg","neg","نمی‌توانم بیایم"],["gel","imp","2sg","pos","بیا"],["gel","imp","2sg","neg","نیا"],
   ["git","imp","2sg","neg","نرو"],["gel","imp","1pl","pos","بیاییم"],["gel","mis","1sg","pos","گویا آمده‌ام"],["git","mis","3sg","neg","گویا نرفته است"],["gel","iyordu","1sg","pos","می‌آمدم"],["gel","iyordu","3sg","neg","نمی‌آمد"],
   ["gel","mali","1sg","pos","باید بیایم"],["oku","mali","3sg","pos","باید بخواند"],["gel","sa","1sg","neg","کاش نیایم"],["gel","sart","1sg","pos","اگر بیایم"],["söyle","imp","1sg","pos","بگویم"],["git","r","3pl","q","می‌روند؟"]];
  for(const [v,t,p,f,exp] of FA){const got=verbFa(V(v),t,p,f);if(got===exp)pass++;else bad(`fa ${v} ${t} ${p} ${f}: expected ${exp}, got ${got}`)}
  const EN=[["git","r","3sg","pos","He / she goes"],["gel","r","3sg","neg","He / she doesn't come"],["gel","r","3sg","q","Does he / she come?"],["gel","abil","1sg","pos","I can come"],["gel","abil","1sg","neg","I can't come"],
   ["gel","imp","1pl","pos","Let's come"],["gel","imp","2sg","pos","Come!"],["gel","imp","1sg","q","Shall I come?"],["gel","iyordu","1sg","pos","I was coming"],["gel","iyordu","2sg","q","Were you coming?"],
   ["gel","mali","1sg","neg","I mustn't come"],["gel","sart","1sg","pos","If I come"],["git","sart","3sg","pos","If he / she goes"],["gel","sa","1sg","pos","I wish I came"],["gel","mis","1sg","pos","Apparently I came"]];
  for(const [v,t,p,f,exp] of EN){const got=verbEn(V(v),t,p,f);if(got===exp)pass++;else bad(`en ${v} ${t} ${p} ${f}: expected ${exp}, got ${got}`)}
  /* every verb × tense × person × form builds, uses known roles, and has Persian and English */
  const ROLES=new Set(["stem","neg","tense","pers","buf","q"]);let combos=0;
  for(const v of VERBS)for(const [t] of TENSES)for(const p of P)for(const f of ["pos","neg","q"]){const ps=buildVerb(v,t,p,f);if(ps===null)continue;combos++;
    if(ps.some(x=>!ROLES.has(x[1])||typeof x[0]!=="string"))bad(`roles ${v.s} ${t} ${p} ${f}`);else if(!verbFa(v,t,p,f)||!verbEn(v,t,p,f))bad(`fa/en empty ${v.s} ${t} ${p} ${f}`);else pass++}
  if(TENSES.length===11&&TENSES.every(x=>x.length===3&&["A1","A2","B1"].includes(x[2])))pass++;else bad("TENSES shape");
  assert.deepEqual(failures, []);
  assert.ok(combos > 1000, `only ${combos} forms built`);
  assert.ok(pass > 2000, `only ${pass} checks ran`);
});
