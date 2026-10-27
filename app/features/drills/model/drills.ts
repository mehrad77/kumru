// The suffix drills (Kerim's Lab and the Path's grammar steps): the nineteen drill types, which of them a level has, picking
// the next one, and building a question (a stem and a target form from the morphology engine, app/lib/morphology.ts), its three
// wrong options and the explanation lines. Pure: the learner's level, running session and accuracy come in as arguments. The
// picker sheet is DrillSheet.tsx; the question screen is app/features/practice/steps/Drill.tsx.
import { ALL_V, FRONT_V, HARD, H2, H4, NOUNS, PERS, VERBS, buildNoun, buildVerb, endsV, lastV, nounEn, nounFa, plainParts, verbEn, verbFa, type Noun, type Parts, type Verb } from "../../../lib/morphology.ts";
import { pick, shuffle } from "../../../lib/random.ts";
import { levelRank } from "../../../lib/units.ts";

export interface DrillType { k: string; lesson: string; lv: string; label: string; pl?: boolean; cs?: string; own?: string; verb?: string }
export interface DrillQ {
  t: DrillType; ps: Parts; orig: string; prompt: string; fa: string; en: string;
  v?: Verb; p?: string; form?: string; pron?: string; soft?: boolean;
}

export const DT:DrillType[]=[{k:"pl",lesson:"g_a1_1_cogul",lv:"A1",label:"Plural -lAr",pl:true},{k:"q",lesson:"g_a1_1_soru",lv:"A1",label:"Question mI"},
  {k:"loc",lesson:"g_a1_2_bulunma",lv:"A1",label:"In / at -DA",cs:"loc"},{k:"dat",lesson:"g_a1_3_yonelme",lv:"A1",label:"To -(y)A",cs:"dat"},
  {k:"abl",lesson:"g_a1_3_uzaklasma",lv:"A1",label:"From -DAn",cs:"abl"},{k:"poss",lesson:"g_a1_4_iyelik",lv:"A1",label:"My -(I)m",own:"1sg"},
  {k:"acc",lesson:"g_a1_4_belirtme",lv:"A1",label:"Object -(y)I",cs:"acc"},{k:"gen",lesson:"g_a1_6_belirtili_tamlama",lv:"A1",label:"Of -(n)In",cs:"gen"},
  {k:"iyor",lesson:"g_a1_3_simdiki",lv:"A1",label:"Present -Iyor",verb:"iyor"},{k:"di",lesson:"g_a1_5_gecmis",lv:"A1",label:"Past -DI",verb:"di"},
  {k:"imp",lesson:"g_a2_1_emir",lv:"A2",label:"Imperative -sIn, -(y)AlIm",verb:"imp"},{k:"ecek",lesson:"g_a2_3_gelecek",lv:"A2",label:"Future -(y)AcAk",verb:"ecek"},
  {k:"mis",lesson:"g_a2_4_mis",lv:"A2",label:"Reported past -mIş",verb:"mis"},{k:"r",lesson:"g_a2_5_genis",lv:"A2",label:"Aorist -(A/I)r",verb:"r"},
  {k:"abil",lesson:"g_a2_6_yeterlilik",lv:"A2",label:"Can -(y)Abil",verb:"abil"},{k:"iyordu",lesson:"g_b1_1_iyordu",lv:"B1",label:"Past continuous -(I)yordu",verb:"iyordu"},
  {k:"mali",lesson:"g_b1_3_meli",lv:"B1",label:"Must -mAlI",verb:"mali"},{k:"sa",lesson:"g_b1_5_dilek",lv:"B1",label:"Wish -sA",verb:"sa"},
  {k:"sart",lesson:"g_b1_6_sart",lv:"B1",label:"If -(A/I)rsA",verb:"sart"}];

/** The drills up to the learner's level. */
export const myDrills = (level: string): DrillType[] => DT.filter((t) => levelRank(t.lv) <= levelRank(level));

const VGROUPS:[string,string][]=[["a·ı","ai"],["o·u","ou"],["e·i","ei"],["ö·ü","öü"]];
export const vgroupOf=(w:string):string=>{const v=lastV(w);return (VGROUPS.find(g=>g[1].includes(v==="ı"?"i":v==="u"?"u":v))||VGROUPS[0])[0]};
export const vgroup=(w:string):string=>({a:"a·ı",ı:"a·ı",o:"o·u",u:"o·u",e:"e·i",i:"e·i",ö:"ö·ü",ü:"ö·ü"} as Record<string,string>)[lastV(w)];
let drillNounsCache:Noun[]|null=null;
const drillNouns=():Noun[]=>drillNounsCache||(drillNounsCache=NOUNS.concat([{tr:"gül",fa:"گل سرخ",en:"rose"},{tr:"kuş",fa:"پرنده",en:"bird"},{tr:"deniz",fa:"دریا",en:"sea"},
  {tr:"bahçe",fa:"باغچه",en:"garden"},{tr:"kız",fa:"دختر",en:"girl"},{tr:"gün",fa:"روز",en:"day"},{tr:"dost",fa:"دوست",en:"friend"},{tr:"otobüs",fa:"اتوبوس",en:"bus",pl:"buses"},
  {tr:"kapı",fa:"در",en:"door"},{tr:"pencere",fa:"پنجره",en:"window"},{tr:"ayna",fa:"آینه",en:"mirror"},{tr:"köy",fa:"روستا",en:"village"}]));
export function drillVariants(orig:string,stemOut:string,suffix:string,answer:string):string[]{const V2="ea",V4="iıuü";const pos=[...suffix].map((ch,i)=>V2.includes(ch)?[i,V2]:V4.includes(ch)?[i,V4]:null).filter(Boolean).slice(0,3) as [number,string][];
  let combos:string[]=[suffix];for(const [i,set] of pos){const nx:string[]=[];for(const s of combos)for(const ch of set)nx.push(s.slice(0,i)+ch+s.slice(i+1));combos=nx}
  const sufs=new Set();for(const s of combos){sufs.add(s);const m=s.match(/^( ?)([dt])/);if(m)sufs.add(m[1]+(m[2]==="d"?"t":"d")+s.slice(m[0].length));
    if(/^[yn]/.test(s)&&s.length>1)sufs.add(s.slice(1));if(endsV(stemOut)&&ALL_V.includes(s[0]))sufs.add("y"+s)}
  const out=new Set();for(const st of new Set([stemOut,orig]))for(const s of sufs){const w=st+s;if(w!==answer)out.add(w)}
  return shuffle([...out] as string[]).slice(0,3)}
export function drillOptions(q:DrillQ,answer:string):string[]{const out:string[]=[],seen=new Set([answer]);const add=(w:string|null|undefined)=>{if(w&&!seen.has(w)&&out.length<3){seen.add(w);out.push(w)}};
  const stemOut=q.ps[0][0],tv=q.t.verb;const form=(v:Verb,tn:string,p:string,f:string)=>{const ps=buildVerb(v,tn,p,f);return ps?plainParts(ps):""};
  if(tv&&q.v){const {v,p}=q as Required<Pick<DrillQ,"v"|"p">>,f=q.form as string,pri:string[]=[];
    if((tv==="r"||tv==="sart")&&f==="pos"&&!endsV(v.s))for(const ao of shuffle(["ar","er","ır","ir","ur","ür"]).filter(x=>x!==v.ao).slice(0,2))pri.push(form({...v,ao},tv,p,f));
    if(tv==="r"&&f==="neg"&&(p==="1sg"||p==="1pl")){const z=v.s+"m"+H2(v.s)+"z";pri.push(z+H4(z)+(p==="1sg"?"m":"z"))}
    if(tv==="abil"&&f==="neg"&&(p==="1sg"||p==="1pl")){const z=answer.slice(0,answer.length-(p==="1sg"?1:3))+"z";pri.push(z+H4(z)+(p==="1sg"?"m":"z"))}
    if(v.soft&&["mis","mali","sa","di"].includes(tv)&&f==="pos")pri.push(answer.replace(/t(?=[^aeıioöuü])/,"d"));
    if(v.soft&&["r","abil","imp","iyor","iyordu","ecek"].includes(tv)&&stemOut!==v.s)pri.push(v.s+answer.slice(stemOut.length));
    if(tv==="imp")for(const pp of shuffle(PERS.map(x=>x[0])).filter(x=>x!==p).slice(0,1))pri.push(form(v,tv,pp,f));
    pri.forEach(add)}
  for(const w of drillVariants(q.orig,stemOut,answer.slice(stemOut.length),answer))add(w);
  if(tv&&q.v){for(const pp of shuffle(PERS.map(x=>x[0])))if(pp!==q.p)add(form(q.v,tv,pp,q.form as string));add(form(q.v,tv,q.p as string,q.form==="neg"?"pos":"neg"))}
  if(out.length<3){const suf=answer.slice(stemOut.length),more:string[]=[];if(ALL_V.includes(suf[0]))for(const b of ["y","n"])more.push(stemOut+b+suf);else if(suf&&suf[0]!==" ")for(const x of "ıiuü")more.push(stemOut+x+suf,stemOut+"y"+x+suf);
    [...suf].forEach((ch,i)=>{if(ALL_V.includes(ch))for(const x of "aeıiuü")more.push(stemOut+suf.slice(0,i)+x+suf.slice(i+1))});shuffle(more).forEach(add)}
  return out}
export function makeDrillQ(t:DrillType):DrillQ{
  if(t.verb){const v=pick(VERBS),p=pick(PERS)[0],form=Math.random()<.3?"neg":"pos";const ps=buildVerb(v,t.verb,p,form) as Parts;
    return {t,ps,v,p,form,orig:v.s,pron:PERS.find(x=>x[0]===p)![1],prompt:v.inf+" · "+PERS.find(x=>x[0]===p)![1]+(form==="neg"?" · negative":""),fa:verbFa(v,t.verb,p,form),en:verbEn(v,t.verb,p,form)}}
  const n=pick(drillNouns());
  if(t.k==="q"){const ps:Parts=[[n.tr,"stem"],[" ","stem"],["m"+H4(n.tr),"q"]];return {t,ps,orig:n.tr,prompt:n.tr+" + ?",fa:n.fa+"؟",en:n.en[0].toUpperCase()+n.en.slice(1)+"?"}}
  const ps=buildNoun(n,!!t.pl,t.own||"",t.cs||"");return {t,ps,orig:n.tr,soft:!!n.soft,prompt:n.tr,fa:nounFa(n,!!t.pl,t.own||"",t.cs||""),en:nounEn(n,!!t.pl,t.own||"",t.cs||"")}}
export function drillWhy(q:DrillQ):string[]{const v=lastV(q.orig),front=FRONT_V.includes(v),round="ouöü".includes(v);const lines:string[]=[];
  lines.push(`Last vowel of ${q.orig}: “${v}” (${front?"front":"back"}, ${round?"rounded":"unrounded"}) → 2-way suffixes take ${front?"e":"a"}, 4-way take ${H4(q.orig)}.`);
  const stemOut=q.ps[0][0];
  if((q.t.verb==="iyor"||q.t.verb==="iyordu")&&stemOut!==q.orig&&"ae".includes(q.orig[q.orig.length-1]))lines.push(`${q.orig} ends in -${q.orig.slice(-1)}: drop it before -ıyor.`);
  else if(stemOut!==q.orig)lines.push(`${q.orig.slice(-1)} softens to ${stemOut.slice(-1)} before a vowel.`);
  const buf=q.ps.filter(p=>p[1]==="buf").map(p=>p[0]);if(buf.length)lines.push(`Buffer letter ${buf.map(b=>"“"+b+"”").join(" and ")} keeps two vowels apart.`);
  if(["loc","abl"].includes(q.t.cs as string)&&!q.t.own||q.t.verb==="di"){const base=q.t.verb==="di"?plainParts(q.ps.slice(0,q.ps.findIndex(p=>p[1]==="tense"))):q.orig;const c=base.slice(-1);
    lines.push(HARD.includes(c)?`“${c}” is a hard letter (fıstıkçı şahap), so d → t.`:`“${c}” is not a hard letter, so d stays d.`)}
  const tv=q.t.verb,neg=q.form==="neg",vb=q.v;
  if((tv==="r"||tv==="sart")&&!neg&&vb)lines.push(endsV(vb.s)?`${vb.s} ends in a vowel, so the aorist is just -r (${vb.s}r).`:`Aorist of ${vb.inf}: -${vb.ao}. One-syllable stems take -Ar (yazar, gider) except 13 verbs that take -Ir (gelir, bilir, alır …); longer stems take -Ir (oturur).`);
  if(tv==="r"&&neg)lines.push("Negative aorist is -mAz, but ben takes -mAm and biz -mAyIz (gelmem, gelmeyiz).");
  if(tv==="sart")lines.push(neg?"Negative şart: -mAz + -sA (gelmezsem, gelmezse).":"Şart = aorist + -sA + the short endings -m, -n, -k, -nIz (gelirsem, gelirsek).");
  if(tv==="abil")lines.push(neg?"The negative of -(y)Abil is -(y)AmA + aorist -z, with no “bil”: gelemem, gelemezsin, gelemeyiz.":"-(y)Abil is followed by the aorist -ir and the person ending (gelebilirim).");
  if(tv==="mis")lines.push("-mIş starts with a consonant, so the stem never softens (gitmiş, not gidmiş).");
  if(tv==="iyordu")lines.push("After -yor the vowel is always u, so -du is fixed: geliyordum, okuyordunuz.");
  if(tv==="mali")lines.push("-mAlI ends in a vowel, so ben and biz add buffer y: gelmeliyim, gelmeliyiz.");
  if(tv==="sa")lines.push("-sA takes the short past endings -m, -n, -k, -nIz (gelsem, gelsek).");
  if(tv==="imp")lines.push("Emir and istek: sen is the bare stem (gel!), o -sIn, siz -(y)In; ben -(y)AyIm, biz -(y)AlIm.");
  return lines}

/**
 * The next drill type. `forced` is the type a running drill or custom session asks for; otherwise types are drawn at
 * random, weighted towards the ones the learner is least sure of (`acc(key)` gives tries and accuracy), from the drills
 * of `level`, only the verb drills when `verbsOnly`.
 */
export function pickDrillType(level: string, forced: string, verbsOnly: boolean, acc: (k: string) => { t: number; acc: number }, rng: () => number = Math.random): DrillType {
  if (forced) {
    const t = DT.find((x) => x.k === forced);
    if (t) return t;
  }
  const w = (t: DrillType) => {
    const { t: n, acc: a } = acc(t.k);
    return n < 3 ? 3 : 1 + (1 - a) * 6;
  };
  const ds = myDrills(level).filter((t) => !verbsOnly || t.verb);
  const tot = ds.reduce((a, t) => a + w(t), 0);
  let r = rng() * tot;
  for (const t of ds) {
    r -= w(t);
    if (r <= 0) return t;
  }
  return ds[0];
}

/** The drill types that practise a lesson (the vowel-harmony lesson takes every A1 drill). */
export const lessonDrillTypes = (lessonId: string): DrillType[] => (lessonId === "g_a1_1_unlu_uyumu" ? DT.filter((t) => t.lv === "A1") : DT.filter((t) => t.lesson === lessonId));

/** How a lesson's drills are going: their answers added up (`stats` is `S.drill`), or null when none was tried. */
export function drillTally(types: DrillType[], stats: Record<string, { r: number; w: number } | undefined>): { n: number; acc: number } | null {
  let r = 0, w = 0;
  for (const t of types) { const s = stats[t.k]; if (s) { r += s.r; w += s.w; } }
  return r + w ? { n: r + w, acc: Math.round((r / (r + w)) * 100) } : null;
}

/** The accuracy chip of a drill: its class and text. */
export const drillChip = (tries: number, acc: number): { cls: string; text: string } => {
  const p = Math.round(acc * 100);
  return { cls: "pchip " + (!tries ? "new" : p < 60 ? "bad" : p < 80 ? "mid" : "ok"), text: tries ? p + "%" : "new" };
};

/** What "Drill this" on a lesson page starts: "" (mixed) for the vowel-harmony lesson, else the lesson's first drill, or null when it has none. */
export const lessonDrillStart = (lessonId: string): string | null =>
  lessonId === "g_a1_1_unlu_uyumu" ? "" : (DT.find((t) => t.lesson === lessonId)?.k ?? null);
