/* eslint-disable @typescript-eslint/no-explicit-any -- hits and segments are loosely shaped records */
// Word hints and which words mean the same: a Turkish sentence cut into pieces whose words point at their cards (exactly, before
// an apostrophe, or after stripping up to three endings), the Persian or English prompt of a built sentence matched to those
// words, two cards that a learner could not tell apart, and the reading sentences that use a lesson's words. Pure.
import { normT, sentToks } from "./answers.ts";

/** The parts of a word card these helpers read. */
export interface Card { id?: string; tr?: string; en?: string; fa?: string; kind?: string; [k: string]: any }
export type GlossIndex = Map<string, Card>;
export interface GlossHit { card?: Card; en?: string; note: string }
export interface GlossSegment { text: string; hit: GlossHit | null }
export type PromptSegment = { text: string; hit: any };

/* two cards clash when a learner could not tell their meanings apart: the same Turkish word, or a shared English or Persian sense (bay and bey are both "Mr.") */
export const senseKey=(t:unknown):string=>String(t||"").toLocaleLowerCase("en").replace(/\([^)]*\)/g," ").replace(/^to\s+/,"").replace(/[.!?]+$/,"").replace(/\s+/g," ").trim();
export const sensesOf=(t:unknown,seps:RegExp):Set<string>=>new Set(String(t||"").split(seps).map(senseKey).filter(x=>x.length>1));
export function meaningClash(a:Card|null|undefined,b:Card|null|undefined):boolean{if(!a||!b)return false;if(normT(a.tr)===normT(b.tr))return true;
  const ea=sensesOf(a.en,/[;,/]/),eb=sensesOf(b.en,/[;,/]/);for(const x of ea)if(eb.has(x))return true;
  const fa=sensesOf(a.fa,/[،؛;,/]/),fb=sensesOf(b.fa,/[،؛;,/]/);for(const x of fa)if(fb.has(x))return true;return false}
/* up to `max` of a skill's reading sentences (its `sentences`, from the books' reading practices) that use the lesson's words, the ones using most of them first; a long word matches by its stem, a short one only exactly */
export function lessonSentences<S extends {tr:string;id?:unknown}>(ws:Card[],pool:S[],max=2):S[]{const keys=ws.map(c=>{const w=sentToks(c.tr)[0]||"";return w.length>4?{stem:w.replace(/[aeıioöuü]$/,"")}:{exact:w}}).filter(k=>k.stem||k.exact);
  return pool.map(s=>{const t=sentToks(s.tr),hit=keys.filter(k=>t.some(x=>k.stem?x.startsWith(k.stem):x===k.exact)).length;return {s,hit,len:t.length}}).filter(x=>x.hit>0)
    .sort((a,b)=>b.hit-a.hit||a.len-b.len||String(a.s.id).localeCompare(String(b.s.id))).slice(0,max).map(x=>x.s)}
/* Word hints inside sentences. The index maps a lower-case Turkish word (or phrase) to its card; an infinitive also gets its stem (gelmek: gel). */
export const GL_SUF:string[]=["sınız","siniz","sunuz","sünüz","larımız","lerimiz","ımız","imiz","umuz","ümüz","ların","lerin","ları","leri","ınız","iniz","unuz","ünüz","ndan","nden","ıyor","iyor","uyor","üyor","yor","acak","ecek","lar","ler","dır","dir","dur","dür","tır","tir","tur","tür","sın","sin","sun","sün","yım","yim","yum","yüm","dan","den","tan","ten","nda","nde","yı","yi","yu","yü","ya","ye","da","de","ta","te","la","le","ki","mı","mi","mu","mü","ım","im","um","üm","ın","in","un","ün","ız","iz","uz","üz","na","ne","nı","ni","dı","di","du","dü","tı","ti","a","e","ı","i","u","ü","m","n","k"];
export const MUTATE:Record<string,string>={b:"p",c:"ç",d:"t",ğ:"k"};
export function buildGlossIndex(cards:(Card|null|undefined)[]):GlossIndex{const idx:GlossIndex=new Map(),put=(k:string,c:Card)=>{if(k&&!idx.has(k))idx.set(k,c)};
  for(const c of cards){if(!c||c.kind!=="word"||!c.tr)continue;
    const base=String(c.tr).toLocaleLowerCase("tr").replace(/[.,!?;:"«»]/g,"").trim();
    for(const part of [base.replace(/\([^)]*\)/g,"").trim(),...(base.match(/\(([^)]*)\)/g)||[]).map(x=>x.slice(1,-1))])for(const alt of part.split(/\s[/·]\s|;/))put(alt.trim(),c);
    const m=base.match(/^(.{2,})m[ae]k$/);if(m)put(m[1],c)}
  return idx}
/* a word's card: exactly, before an apostrophe, or after stripping up to three endings (kitabı: kitab, then kitap) */
export function glossToken(tok:string,idx:GlossIndex,gl?:Record<string,string>|null):GlossHit|null{const t=sentToks(tok)[0];if(!t)return null;
  if(gl&&gl[t])return {en:gl[t],note:""};
  if(idx.has(t))return {card:idx.get(t),note:""};
  const ap=t.split(/['’]/)[0];if(ap!==t&&ap.length>1&&idx.has(ap))return {card:idx.get(ap),note:"form of «"+idx.get(ap)!.tr!.replace(/[.!?]/g,"")+"»"};
  const seen=new Set([t]),walk=(w:string,d:number):Card|null=>{if(d>3)return null;
    for(const suf of GL_SUF){if(!w.endsWith(suf)||w.length-suf.length<(suf.length>=2?2:3))continue;const st=w.slice(0,-suf.length);if(seen.has(st))continue;seen.add(st);
      const last=st[st.length-1],cands=[st,...(MUTATE[last]?[st.slice(0,-1)+MUTATE[last]]:[])];
      for(const c of cands)if(idx.has(c))return idx.get(c)!;
      const deeper=walk(st,d+1);if(deeper)return deeper}return null};
  const c=walk(t,1);return c?{card:c,note:"form of «"+c.tr!.replace(/[.!?]/g,"")+"»"}:null}
/* a sentence cut into pieces, a phrase card (hoş geldin) before single words: [{text, hit}] with hit null for plain text */
export function glossSegments(tr:string,idx:GlossIndex,gl?:Record<string,string>|null):GlossSegment[]{const parts=String(tr).split(/(\s+)/),w:number[]=[];parts.forEach((p,i)=>{if(p&&!/^\s+$/.test(p))w.push(i)});const out:GlossSegment[]=[];
  for(let k=0;k<w.length;){let done=false;
    for(let L=Math.min(3,w.length-k);L>=2&&!done;L--){const text=parts.slice(w[k],w[k+L-1]+1).join(""),key=text.toLocaleLowerCase("tr").replace(/[.,!?;:"«»]/g,"");
      if(idx.has(key)){out.push({text,hit:{card:idx.get(key),note:""}});k+=L;done=true}}
    if(!done){out.push({text:parts[w[k]],hit:glossToken(parts[w[k]],idx,gl)});k++}
    if(k<w.length)out.push({text:parts.slice(w[k-1]+1,w[k]).join(""),hit:null})}
  return out}
/* The question side of a built sentence: which words of its Persian (or English) prompt mean which Turkish word. For each hinted Turkish word the
   card's meanings are looked up in the prompt (a prompt word matches a meaning exactly or as its stem plus up to three letters); each prompt word is used once.
   Returns [{text, hit}] covering the whole prompt, hit = {word (Turkish), card, en, note} or null. */
export const normMean=(t:unknown):string=>String(t||"").replace(/[ً-ٰٟ‌‍]/g,"").replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/[.,!?;:"«»()؟،؛…]/g,"").trim().toLocaleLowerCase("en");
export const meaningsOf=(card:Card,lang:string):string[]=>(lang==="en"?String(card.en||"").split(/[;,/]/):String(card.fa||"").split(/[،؛;,/]/)).map(x=>normMean(x.replace(/\([^)]*\)/g,"").replace(/^(to|the|a|an)\s+/i,""))).filter(x=>x.length>=2);
export function promptSegments(prompt:string,tr:string,idx:GlossIndex,gl:Record<string,string>|null|undefined,lang:string):PromptSegment[]{const parts=String(prompt||"").split(/(\s+)/),wi:number[]=[];parts.forEach((p,i)=>{if(p&&!/^\s+$/.test(p))wi.push(i)});
  const nm=wi.map(i=>normMean(parts[i])),hit:any[]=new Array(wi.length).fill(null),same=(t:string,m:string)=>t===m||(m.length>=3&&t.startsWith(m)&&t.length-m.length<=3);
  for(const sg of glossSegments(tr,idx,gl)){if(!sg.hit)continue;const ms=sg.hit.card?meaningsOf(sg.hit.card,lang):(sg.hit.en?[normMean(sg.hit.en)]:[]),word=sg.text.replace(/[.,!?;:"«»]/g,"");
    outer:for(const m of ms){const mw=m.split(/\s+/);
      for(let k=0;k<=wi.length-mw.length;k++){let ok=true;for(let q=0;q<mw.length;q++)if(hit[k+q]||!same(nm[k+q],mw[q])){ok=false;break}
        if(ok){const h={word,card:sg.hit.card,en:sg.hit.en,note:sg.hit.note,span:mw.length};for(let q=0;q<mw.length;q++)hit[k+q]=q===0?h:{skip:true};break outer}}}}
  const out:PromptSegment[]=[];for(let k=0;k<wi.length;k++){if(k===0&&wi[0]>0)out.push({text:parts.slice(0,wi[0]).join(""),hit:null});
    const h=hit[k],span=h&&!h.skip?h.span:1,end=wi[k+span-1];out.push({text:parts.slice(wi[k],end+1).join(""),hit:h&&!h.skip?h:null});k+=span-1;
    if(k+1<wi.length)out.push({text:parts.slice(end+1,wi[k+1]).join(""),hit:null});else if(end+1<parts.length)out.push({text:parts.slice(end+1).join(""),hit:null})}
  return out}
