/* eslint-disable @typescript-eslint/no-explicit-any -- the engine looks literal tables up by person, tense and case */
// The Turkish morphology engine behind the grammar widgets and the suffix drills: vowel harmony, the noun suffixes
// (plural, possessive, case) and the verb forms (eleven tenses, six persons, positive, negative, question), each built as
// parts [text, role] so the page can colour the suffixes, and glossed in Persian and English. Pure: no DOM. The 2,000 verb forms its test builds are the contract.

export type Parts = [string, string][];
export interface Noun { tr: string; fa: string; en: string; soft?: number; pl?: string }
export interface Verb { s: string; inf: string; past: string; pres: string; sub: string; pv?: number; soft?: number; ao: string; en: [string, string, string] }

export const FRONT_V="eiöü",ALL_V="aeıioöuü",HARD="fstkçşhp";
export const lastV=(s:string):string=>{for(let i=s.length-1;i>=0;i--)if(ALL_V.includes(s[i]))return s[i];return "e"};
export const H2=(s:string):string=>FRONT_V.includes(lastV(s))?"e":"a";
export const H4=(s:string):string=>({a:"ı",ı:"ı",e:"i",i:"i",o:"u",u:"u",ö:"ü",ü:"ü"} as Record<string,string>)[lastV(s)];
export const endsV=(s:string):boolean=>ALL_V.includes(s[s.length-1]);
export const plainM=(s:unknown):string=>String(s||"").replace(/\[([^\]:]+):\w+\]/g,"$1");
export const joinParts=(ps:Parts):string=>ps.map(([t,r])=>r==="stem"?t:"["+t+":"+r+"]").join("");
export const plainParts=(ps:Parts):string=>ps.map(p=>p[0]).join("");
/* nouns */
export const NOUNS:Noun[]=[{tr:"ev",fa:"خانه",en:"house"},{tr:"kitap",fa:"کتاب",en:"book",soft:1},{tr:"okul",fa:"مدرسه",en:"school"},{tr:"araba",fa:"ماشین",en:"car"},
 {tr:"göz",fa:"چشم",en:"eye"},{tr:"çocuk",fa:"بچه",en:"child",pl:"children",soft:1},{tr:"kedi",fa:"گربه",en:"cat"},{tr:"köprü",fa:"پل",en:"bridge"},
 {tr:"ağaç",fa:"درخت",en:"tree",soft:1},{tr:"oda",fa:"اتاق",en:"room"},{tr:"yol",fa:"جاده",en:"road"},{tr:"park",fa:"پارک",en:"park"},{tr:"masa",fa:"میز",en:"table"},{tr:"sokak",fa:"کوچه",en:"street",soft:1}];
export const OWNERS:[string,string][]=[["","no owner"],["1sg","my (benim)"],["2sg","your (senin)"],["3sg","his / her (onun)"],["1pl","our (bizim)"],["2pl","your, pl. (sizin)"],["3pl","their (onların)"]];
export const CASES:[string,string][]=[["","no case"],["loc","in / at  -DA"],["dat","to  -(y)A"],["abl","from  -DAn"],["acc","the (object)  -(y)I"],["gen","of  -(n)In"]];
export function softenStem(ps:Parts,n:Noun){if(ps.length!==1||!n.soft)return;const s=ps[0][0];const c=s[s.length-1];
  const map:Record<string,string>={p:"b",ç:"c",t:"d",k:s[s.length-2]==="n"?"g":"ğ"};if(map[c])ps[0][0]=s.slice(0,-1)+map[c]}
export function buildNoun(n:Noun,pl:boolean,own:string,cs:string):Parts{const ps:Parts=[[n.tr,"stem"]];const cur=()=>plainParts(ps);
  const addV=(t:string,r:string)=>{softenStem(ps,n);ps.push([t,r])};
  if(pl)ps.push(["l"+H2(cur())+"r","pl"]);
  if(own){const v=endsV(cur()),h=H4(cur());
    if(own==="3pl"){if(pl)ps.push([h,"poss"]);else ps.push(["l"+H2(cur())+"r"+({e:"i",a:"ı"})[H2(cur())],"poss"])}
    else if(own==="3sg"){if(v){ps.push(["s","buf"]);ps.push([h,"poss"])}else addV(h,"poss")}
    else{const c=({"1sg":"m","2sg":"n","1pl":"m"+h+"z","2pl":"n"+h+"z"} as Record<string,any>)[own];if(v)ps.push([c,"poss"]);else addV(h+c,"poss")}}
  if(cs){const third=own==="3sg"||own==="3pl";const s=cur(),v=endsV(s),A=H2(s),I=H4(s);
    if(cs==="loc"||cs==="abl"){const tail=cs==="abl"?"n":"";if(third){ps.push(["n","buf"]);ps.push(["d"+A+tail,"case"])}else ps.push([(HARD.includes(s[s.length-1])?"t":"d")+A+tail,"case"])}
    else if(cs==="dat"){if(third){ps.push(["n","buf"]);ps.push([A,"case"])}else if(v){ps.push(["y","buf"]);ps.push([A,"case"])}else addV(A,"case")}
    else if(cs==="acc"){if(third){ps.push(["n","buf"]);ps.push([I,"case"])}else if(v){ps.push(["y","buf"]);ps.push([I,"case"])}else addV(I,"case")}
    else if(cs==="gen"){if(third||v){ps.push(["n","buf"]);ps.push([I+"n","case"])}else addV(I+"n","case")}}
  return ps}
export function nounFa(n:Noun,pl:boolean,own:string,cs:string):string{let b=n.fa+(pl?"‌ها":"");
  if(own){const suf=({"1sg":"م","2sg":"ت","3sg":"ش","1pl":"مان","2pl":"تان","3pl":"شان"} as Record<string,any>)[own];
    if(b.endsWith("ا")||b.endsWith("و"))b=b+"ی"+suf;else if(b.endsWith("ه"))b=b+(own.endsWith("sg")?"‌ا":"‌")+suf;else b=b+suf}
  return ({loc:"در "+b,dat:"به "+b,abl:"از "+b,acc:b+" را",gen:"…ِ "+b})[cs]||b}
export function nounEn(n:Noun,pl:boolean,own:string,cs:string):string{const noun=pl?(n.pl||n.en+"s"):n.en;const det=own?({"1sg":"my","2sg":"your","3sg":"his / her","1pl":"our","2pl":"your","3pl":"their"})[own]:(cs?"the":(pl?"":"a"));
  const prep=({loc:"in / at",dat:"to",abl:"from",gen:"of"})[cs]||"";let s=[prep,det,noun].filter(Boolean).join(" ");if(cs==="acc")s+=" (as the object)";return s}

/* verbs */
export const VERBS:Verb[]=[{s:"gel",inf:"gelmek",past:"آمد",pres:"آ",sub:"بیا",pv:1,ao:"ir",en:["come","came","coming"]},{s:"git",soft:1,inf:"gitmek",past:"رفت",pres:"رو",sub:"برو",ao:"er",en:["go","went","going"]},
 {s:"oku",inf:"okumak",past:"خواند",pres:"خوان",sub:"بخوان",ao:"r",en:["read","read","reading"]},{s:"iç",inf:"içmek",past:"نوشید",pres:"نوش",sub:"بنوش",ao:"er",en:["drink","drank","drinking"]},
 {s:"gör",inf:"görmek",past:"دید",pres:"بین",sub:"ببین",ao:"ür",en:["see","saw","seeing"]},{s:"yaz",inf:"yazmak",past:"نوشت",pres:"نویس",sub:"بنویس",ao:"ar",en:["write","wrote","writing"]},
 {s:"iste",inf:"istemek",past:"خواست",pres:"خواه",sub:"بخواه",ao:"r",en:["want","wanted","wanting"]},{s:"otur",inf:"oturmak",past:"نشست",pres:"نشین",sub:"بنشین",ao:"ur",en:["sit","sat","sitting"]},
 {s:"bil",inf:"bilmek",past:"دانست",pres:"دان",sub:"بدان",ao:"ir",en:["know","knew","knowing"]},{s:"söyle",inf:"söylemek",past:"گفت",pres:"گو",sub:"بگو",pv:1,ao:"r",en:["say","said","saying"]},
 {s:"al",inf:"almak",past:"گرفت",pres:"گیر",sub:"بگیر",ao:"ır",en:["take","took","taking"]}];
export const PERS:[string,string][]=[["1sg","ben"],["2sg","sen"],["3sg","o"],["1pl","biz"],["2pl","siz"],["3pl","onlar"]];
/* [key, label, level the book teaches it] */
export const TENSES:[string,string,string][]=[["iyor","Present continuous  -(I)yor","A1"],["di","Simple past  -DI","A1"],["imp","Imperative / let's  -sIn, -(y)AlIm","A2"],["ecek","Future  -(y)AcAk","A2"],
 ["mis","Reported past  -mIş","A2"],["r","Aorist (geniş zaman)  -(A/I)r","A2"],["abil","Can  -(y)Abil","A2"],["iyordu","Past continuous  -(I)yordu","B1"],
 ["mali","Must  -mAlI","B1"],["sa","Wish  -sA","B1"],["sart","If (şart)  -(A/I)rsA","B1"]];
/* forms the language doesn't use: question of sen/siz imperative, question of şart */
export const noVerbForm=(tense:string,p:string,form:string):boolean=>form==="q"&&(tense==="sart"||tense==="imp"&&(p==="2sg"||p==="2pl"));
export function softV(v:Verb,ps:Parts){if(v.soft){const s=ps[0][0];ps[0][0]=s.slice(0,-1)+(({t:"d",p:"b",ç:"c",k:"ğ"} as Record<string,string>)[s[s.length-1]]||s[s.length-1])}}
/* before a vowel-initial suffix: buffer y after a vowel, or soften the bare stem (git → gid) */
export function preV(v:Verb,ps:Parts){if(endsV(plainParts(ps)))ps.push(["y","buf"]);else if(ps.length===1)softV(v,ps)}
/* personal endings -Im -sIn – -Iz -sInIz -lAr (aorist, -mIş, -mAlI, -(y)Abil), with the question particle */
export function zPers(ps:Parts,p:string,q:boolean){const s=plainParts(ps),I=H4(s),A=H2(s);
  if(!q){const E=({"1sg":I+"m","2sg":"s"+I+"n","3sg":"","1pl":I+"z","2pl":"s"+I+"n"+I+"z","3pl":"l"+A+"r"} as Record<string,any>)[p];if(E&&(p==="1sg"||p==="1pl")&&endsV(s))ps.push(["y","buf"]);if(E)ps.push([E,"pers"]);return ps}
  if(p==="3pl"){const L="l"+A+"r";ps.push([L,"pers"]);ps.push([" ","stem"]);ps.push(["m"+H4(L),"q"]);return ps}
  ps.push([" ","stem"]);ps.push(["m"+I,"q"]);const Q=({"1sg":["y",I+"m"],"2sg":[null,"s"+I+"n"],"3sg":[null,""],"1pl":["y",I+"z"],"2pl":[null,"s"+I+"n"+I+"z"]} as Record<string,any>)[p];if(Q[0])ps.push([Q[0],"buf"]);if(Q[1])ps.push([Q[1],"pers"]);return ps}
/* short endings -m -n – -k -nIz -lAr (-DI, -sA), with the question particle after them */
export function kPers(ps:Parts,p:string,q:boolean){const s=plainParts(ps),I=H4(s),A=H2(s);const E=({"1sg":"m","2sg":"n","3sg":"","1pl":"k","2pl":"n"+I+"z","3pl":"l"+A+"r"} as Record<string,any>)[p];if(E)ps.push([E,"pers"]);
  if(q){ps.push([" ","stem"]);ps.push(["m"+H4(plainParts(ps)),"q"])}return ps}
/* -(I)yor stem: gel-iyor, gid-iyor, oku-yor, ist-iyor; negative gel-mi-yor */
export function iyorBase(v:Verb,ps:Parts,neg:boolean){
  if(neg){ps.push(["m","neg"]);ps.push([H4(v.s)+"yor","tense"])}
  else if(endsV(v.s)){if("ae".includes(v.s[v.s.length-1])){ps[0][0]=v.s.slice(0,-1);ps.push([H4(ps[0][0])+"yor","tense"])}else ps.push(["yor","tense"])}
  else{softV(v,ps);ps.push([H4(v.s)+"yor","tense"])}return ps}
/* positive aorist stem: gel-ir, gid-er, oku-r */
export function aorBase(v:Verb,ps:Parts){const ao=v.ao||(endsV(v.s)?"r":H4(v.s)+"r");if(ao.length>1)softV(v,ps);ps.push([ao,"tense"]);return ps}
export function buildVerb(v:Verb,tense:string,p:string,form:string):Parts|null{const ps:Parts=[[v.s,"stem"]];const neg=form==="neg",q=form==="q";const cur=()=>plainParts(ps);
  if(noVerbForm(tense,p,form))return null;
  if(tense==="iyor"){iyorBase(v,ps,neg);
    const E:Record<string,string>={"1sg":"um","2sg":"sun","3sg":"","1pl":"uz","2pl":"sunuz","3pl":"lar"};
    if(!q){if(E[p])ps.push([E[p],"pers"])}
    else if(p==="3pl"){ps.push(["lar","pers"]);ps.push([" ","stem"]);ps.push(["mı","q"])}
    else{ps.push([" ","stem"]);ps.push(["mu","q"]);const Q=({"1sg":["y","um"],"2sg":[null,"sun"],"3sg":[null,""],"1pl":["y","uz"],"2pl":[null,"sunuz"]} as Record<string,any>)[p];if(Q[0])ps.push([Q[0],"buf"]);if(Q[1])ps.push([Q[1],"pers"])}}
  else if(tense==="iyordu"){iyorBase(v,ps,neg);
    const E=({"1sg":"m","2sg":"n","3sg":"","1pl":"k","2pl":"nuz"} as Record<string,any>)[p];
    if(p==="3pl"){ps.push(["lar","pers"]);if(q){ps.push([" ","stem"]);ps.push(["mı","q"]);ps.push(["y","buf"])}ps.push(["dı","tense"])}
    else{if(q){ps.push([" ","stem"]);ps.push(["mu","q"]);ps.push(["y","buf"])}ps.push(["du","tense"]);if(E)ps.push([E,"pers"])}}
  else if(tense==="di"){
    if(neg)ps.push(["m"+H2(v.s),"neg"]);
    const s=cur();ps.push([(HARD.includes(s[s.length-1])?"t":"d")+H4(s),"tense"]);const I=H4(cur());
    const E=({"1sg":"m","2sg":"n","3sg":"","1pl":"k","2pl":"n"+I+"z","3pl":"l"+H2(cur())+"r"} as Record<string,any>)[p];if(E)ps.push([E,"pers"]);
    if(q){ps.push([" ","stem"]);ps.push(["m"+H4(cur()),"q"])}}
  else if(tense==="ecek"){
    if(neg){ps.push(["m"+H2(v.s),"neg"]);ps.push(["y","buf"])}else if(endsV(v.s))ps.push(["y","buf"]);else softV(v,ps);
    const A=H2(neg?"a"+H2(v.s):v.s),I=A==="e"?"i":"ı";const base=A==="e"?"ecek":"acak",soft=A==="e"?"eceğ":"acağ";
    if(!q){const E=({"1sg":[soft,I+"m"],"2sg":[base,"s"+I+"n"],"3sg":[base,""],"1pl":[soft,I+"z"],"2pl":[base,"s"+I+"n"+I+"z"],"3pl":[base,"l"+A+"r"]} as Record<string,any>)[p];ps.push([E[0],"tense"]);if(E[1])ps.push([E[1],"pers"])}
    else{ps.push([base,"tense"]);if(p==="3pl"){ps.push(["l"+A+"r","pers"]);ps.push([" ","stem"]);ps.push(["m"+I,"q"])}
      else{ps.push([" ","stem"]);ps.push(["m"+I,"q"]);const Q=({"1sg":["y",I+"m"],"2sg":[null,"s"+I+"n"],"3sg":[null,""],"1pl":["y",I+"z"],"2pl":[null,"s"+I+"n"+I+"z"]} as Record<string,any>)[p];if(Q[0])ps.push([Q[0],"buf"]);if(Q[1])ps.push([Q[1],"pers"])}}}
  else if(tense==="r"){
    if(!neg){aorBase(v,ps);zPers(ps,p,q)}
    else{ps.push(["m"+H2(v.s),"neg"]);
      if(p==="1sg")ps.push(["m","pers"]);
      else if(p==="1pl"){ps.push(["y","buf"]);ps.push([H4(cur())+"z","pers"])}
      else{ps.push(["z","tense"]);zPers(ps,p,false)}}}
  else if(tense==="mis"){if(neg)ps.push(["m"+H2(v.s),"neg"]);ps.push(["m"+H4(cur())+"ş","tense"]);zPers(ps,p,q)}
  else if(tense==="abil"){preV(v,ps);const A=H2(v.s);
    if(!neg){ps.push([A+"bil","tense"]);ps.push(["ir","tense"]);zPers(ps,p,q)}
    else{ps.push([A,"tense"]);ps.push(["m"+A,"neg"]);
      if(p==="1sg")ps.push(["m","pers"]);
      else if(p==="1pl"){ps.push(["y","buf"]);ps.push([(A==="e"?"i":"ı")+"z","pers"])}
      else{ps.push(["z","tense"]);zPers(ps,p,false)}}}
  else if(tense==="imp"){
    if(neg)ps.push(["m"+H2(v.s),"neg"]);const s=cur(),A=H2(s),I2=A==="e"?"i":"ı",I=H4(s);
    if(p==="1sg"){preV(v,ps);ps.push([A,"tense"]);ps.push(["y","buf"]);ps.push([I2+"m","pers"])}
    else if(p==="1pl"){preV(v,ps);ps.push([A,"tense"]);ps.push(["l"+I2+"m","pers"])}
    else if(p==="2pl"){preV(v,ps);ps.push([I+"n","pers"])}
    else if(p==="3sg")ps.push(["s"+I+"n","pers"]);
    else if(p==="3pl"){ps.push(["s"+I+"n","pers"]);ps.push(["l"+A+"r","pers"])}
    if(q){ps.push([" ","stem"]);ps.push(["m"+H4(cur()),"q"])}}
  else if(tense==="mali"){if(neg)ps.push(["m"+H2(v.s),"neg"]);const A=H2(cur());ps.push(["m"+A+"l"+(A==="e"?"i":"ı"),"tense"]);zPers(ps,p,q)}
  else if(tense==="sa"){if(neg)ps.push(["m"+H2(v.s),"neg"]);ps.push(["s"+H2(cur()),"tense"]);kPers(ps,p,q)}
  else if(tense==="sart"){
    if(neg){ps.push(["m"+H2(v.s),"neg"]);ps.push(["z","tense"])}else aorBase(v,ps);
    if(p==="3pl"){ps.push(["l"+H2(cur())+"r","pers"]);ps.push(["s"+H2(cur()),"tense"])}
    else{ps.push(["s"+H2(cur()),"tense"]);kPers(ps,p,false)}}
  else return null;
  return ps}
export const FA_E:string[]=["م","ی","د","یم","ید","ند"],FA_EV:string[]=["یم","یی","ید","ییم","یید","یند"];
/* Persian subjunctive (بیایم / نیایم) and present (می‌آیم / نمی‌آیم) */
export const faSub=(v:Verb,i:number,neg:boolean):string=>(neg?"ن"+v.sub.slice(1):v.sub)+(v.pv?FA_EV:FA_E)[i];
export const faPres=(v:Verb,i:number,neg:boolean):string=>(neg?"نمی‌":"می‌")+v.pres+(v.pv?FA_EV:FA_E)[i];
export function verbFa(v:Verb,tense:string,p:string,form:string):string{const i=PERS.findIndex(x=>x[0]===p);const neg=form==="neg";let out;
  if(noVerbForm(tense,p,form))return "";
  const pastNeg=(st:string)=>st.startsWith("آ")?"نیا"+st.slice(1):"ن"+st;
  if(tense==="iyor"||tense==="r")out=faPres(v,i,neg);
  else if(tense==="di"){const E=["م","ی","","یم","ید","ند"];out=(neg?pastNeg(v.past):v.past)+E[i]}
  else if(tense==="ecek"){out=(neg?"نخواه":"خواه")+FA_E[i]+" "+v.past}
  else if(tense==="mis"){out=(form==="q"?"":"گویا ")+(neg?pastNeg(v.past):v.past)+"ه"+["‌ام","‌ای"," است","‌ایم","‌اید","‌اند"][i]}
  else if(tense==="abil")out=(neg?"نمی‌":"می‌")+"توان"+FA_E[i]+" "+faSub(v,i,false);
  else if(tense==="imp")out=i===1?(neg?"ن"+v.sub.slice(1):v.sub):faSub(v,i,neg);
  else if(tense==="iyordu")out=(neg?"نمی‌":"می‌")+v.past+["م","ی","","یم","ید","ند"][i];
  else if(tense==="mali")out=(neg?"نباید ":"باید ")+faSub(v,i,false);
  else if(tense==="sa")out="کاش "+faSub(v,i,neg);
  else if(tense==="sart")out="اگر "+faSub(v,i,neg);
  else return "";
  return out+(form==="q"?"؟":"")}
export function verbEn(v:Verb,tense:string,p:string,form:string):string{const i=PERS.findIndex(x=>x[0]===p);const pr=["I","you","he / she","we","you (pl.)","they"][i];const be=["am","are","is","are","are","are"][i];const [b,pa,ing]=v.en;
  const cap=(s:string)=>s[0].toUpperCase()+s.slice(1);const neg=form==="neg",q=form==="q";const s3=i===2?(({go:"goes"})[b]||b+"s"):b,dont=i===2?" doesn't ":" don't ";
  if(noVerbForm(tense,p,form))return "";
  if(tense==="iyor")return q?cap(be)+" "+pr+" "+ing+"?":cap(pr+" "+be+(neg?" not ":" ")+ing);
  if(tense==="di")return q?"Did "+pr+" "+b+"?":cap(pr+(neg?" didn't "+b:" "+pa));
  if(tense==="ecek")return q?"Will "+pr+" "+b+"?":cap(pr+(neg?" won't ":" will ")+b);
  if(tense==="r")return q?(i===2?"Does ":"Do ")+pr+" "+b+"?":cap(pr+(neg?dont+b:" "+s3));
  if(tense==="mis")return q?"Did "+pr+" "+b+" (apparently)?":"Apparently "+pr+(neg?" didn't "+b:" "+pa);
  if(tense==="abil")return q?"Can "+pr+" "+b+"?":cap(pr+(neg?" can't ":" can ")+b);
  if(tense==="imp"){if(q)return "Shall "+["I","","he / she","we","","they"][i]+" "+b+"?";
    return cap((neg?["let me not "+b,"don't "+b+"!","let him / her not "+b,"let's not "+b,"don't "+b+"! (pl.)","let them not "+b]:["let me "+b,b+"!","let him / her "+b,"let's "+b,b+"! (pl.)","let them "+b])[i])}
  if(tense==="iyordu"){const was=i===0||i===2?"was":"were";return q?cap(was)+" "+pr+" "+ing+"?":cap(pr+" "+was+(neg?"n't ":" ")+ing)}
  if(tense==="mali")return q?"Must "+pr+" "+b+"?":cap(pr+(neg?" mustn't ":" must ")+b);
  if(tense==="sa")return q?"Should "+pr+" "+b+"?":"I wish "+pr+(neg?" didn't "+b:" "+pa);
  if(tense==="sart")return "If "+pr+(neg?dont+b:" "+s3);
  return ""}
