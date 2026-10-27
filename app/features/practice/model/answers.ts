/* eslint-disable @typescript-eslint/no-explicit-any -- the accept-pattern parser works on loosely shaped trees */
// Checking what a learner typed or built: Turkish text normalisation, forgiving slips (a missing diacritic, swapped or
// misspelt letters, word by word), the accepted forms of a typed word, and the accept patterns of a built sentence
// (`[optional]`, `(a|b)`, `<any|order>`). Pure.

import { normT, stripT } from "../../../lib/turkish.ts";
export { normT, stripT };

export interface EditOp { op: "swap" | "sub" | "extra" | "missing" | "diacritic"; i: number; j: number }
export interface SlipWord { x: string; y: string; ops: EditOp[]; kind: string }
export interface Slip { kind: string; words: SlipWord[] }
export type TypedVerdict = { ok: boolean; exact?: boolean; alt?: string; near?: boolean; slip?: Slip; target?: string };
export interface BuiltVerdict { ok: boolean; kind: "exact" | "variant" | "swap" | "order" | "wrong"; bad: number[] }

export function answersOf(tr:string):string[]{const set=new Set([normT(tr)]);const noPar=tr.replace(/\([^)]*\)/g,"");set.add(normT(noPar));(tr.match(/\(([^)]*)\)/g)||[]).forEach(p=>set.add(normT(p)));
  for(const part of tr.split(/\s[/·;]\s|;/))set.add(normT(part));set.delete("");return [...set]}
/* The smallest edit script from the typed word x to the answer word y: insert, delete, substitute or swap two neighbours, at most `max` edits, else null.
   Typed letters are numbered by i and answer letters by j: a substitution marks both, an extra typed letter only i, a missing one only j. */
export function editOps(x:string,y:string,max:number):EditOp[]|null{const a=[...x],b=[...y],m=a.length,n=b.length;if(Math.abs(m-n)>max)return null;
  const d=Array.from({length:m+1},()=>new Array(n+1).fill(0));for(let i=0;i<=m;i++)d[i][0]=i;for(let j=0;j<=n;j++)d[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1)}
  if(d[m][n]>max)return null;
  const ops:EditOp[]=[];let i=m,j=n;
  while(i>0||j>0){
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]&&d[i][j]===d[i-2][j-2]+1){ops.push({op:"swap",i:i-2,j:j-2});i-=2;j-=2}
    else if(i>0&&j>0&&a[i-1]===b[j-1]&&d[i][j]===d[i-1][j-1]){i--;j--}
    else if(i>0&&j>0&&d[i][j]===d[i-1][j-1]+1){ops.push({op:"sub",i:i-1,j:j-1});i--;j--}
    else if(i>0&&d[i][j]===d[i-1][j]+1){ops.push({op:"extra",i:i-1,j});i--}
    else{ops.push({op:"missing",i,j:j-1});j--}}
  return ops.reverse()}
/* How a typed answer differs from the answer, word by word: a missing or wrong Turkish letter mark (ç for c), two letters swapped, or a letter added,
   missing or wrong. A diacritic-only slip is forgiven at any length; other slips need a word of 4+ letters, one edit (two in a word of 9+).
   null when it is further off; {kind:"exact"} when equal. */
export function diffSlip(typed:string,target:string):Slip|null{const A=normT(typed).split(" "),B=normT(target).split(" ");if(!A[0]||A.length!==B.length)return null;
  const words:SlipWord[]=[];let any=false;
  for(let k=0;k<B.length;k++){const x=A[k],y=B[k];if(x===y){words.push({x,y,ops:[],kind:""});continue}
    const xs=[...x],ys=[...y];let ops:EditOp[]|null,kind:string;
    if(xs.length===ys.length&&stripT(x)===stripT(y)){ops=ys.map((ch,i)=>xs[i]!==ch?{op:"diacritic",i,j:i}:null).filter(Boolean) as EditOp[];kind="diacritic"}
    else{if(ys.length<4)return null;ops=editOps(x,y,ys.length>=9?2:1);if(!ops)return null;kind=ops.every(o=>o.op==="swap")?"swap":"typo"}
    words.push({x,y,ops,kind});any=true}
  if(!any)return {kind:"exact",words};
  const kinds=new Set(words.map(w=>w.kind).filter(Boolean));return {kind:kinds.size===1?[...kinds][0]:"typo",words}}
export function slipReason(slip:Slip):string{const ws=slip.words.filter(w=>w.kind),ops=ws.flatMap(w=>w.ops);if(!ops.length)return "";
  if(slip.kind==="diacritic")return ws.flatMap(w=>w.ops.map(o=>[...w.y][o.j]+", not "+[...w.x][o.i])).slice(0,3).join("; ");
  if(slip.kind==="swap")return "two letters swapped";
  if(ops.length===1)return ({missing:"one letter missing",extra:"one letter too many",sub:"one letter wrong",swap:"two letters swapped"} as Record<string,string>)[ops[0].op];
  return "a couple of letters off"}
export function checkTyped(input:string,tr:string,alts?:string[]):TypedVerdict{const u=normT(input);if(!u)return {ok:false};for(const a of answersOf(tr)){if(u===a)return {ok:true,exact:true};}
  for(const alt of alts||[])for(const a of answersOf(alt))if(u===a)return {ok:true,exact:true,alt};
  for(const a of answersOf(tr)){const s=diffSlip(u,a);if(s&&s.kind!=="exact")return {ok:true,near:true,slip:s,target:a}}return {ok:false}}
export const sentToks=(t:unknown):string[]=>String(t).toLocaleLowerCase("tr").replace(/[.,!?;:"«»]/g,"").split(/\s+/).filter(Boolean);
/* The accepted answers of a sentence card. `accept` holds patterns written like  [Sen] kaç yaşındasın  ([optional words]),
   (Teşekkür ederim|Teşekkürler)  (alternatives) and  <dün|bu akşam>  (the parts in any order); the card's own `tr` is always accepted too. */
export function acceptForms(pattern:string,cap=200):string[]{let i=0;const p=String(pattern);
  const seq=(stops:string):any[]=>{const items:any[]=[];while(i<p.length&&!stops.includes(p[i])){const ch=p[i];
    if(ch===" "){i++;continue}
    if(ch==="["){i++;const s=seq("]");i++;items.push({o:s})}
    else if(ch==="("){i++;const a=alts(")");i++;items.push({a})}
    else if(ch==="<"){i++;const a=alts(">");i++;items.push({m:a})}
    else{let j=i;while(j<p.length&&!" []()<>|".includes(p[j]))j++;if(j===i)j=i+1;items.push({w:p.slice(i,j)});i=j}}
    return items};
  const alts=(close:string):any[]=>{const out=[seq("|"+close)];while(p[i]==="|"){i++;out.push(seq("|"+close))}return out};
  const prod=(a:any[][],b:any[][]):any[][]=>{const r:any[][]=[];for(const x of a)for(const y of b){if(r.length>=cap)return r;r.push(x.concat(y))}return r};
  const perms=(a:any[]):any[][]=>a.length<2?[a]:a.flatMap((x,k)=>perms(a.filter((_,j)=>j!==k)).map(r=>[x,...r]));
  const exp=(items:any[]):any[][]=>{let acc:any[][]=[[]];for(const it of items){let opts:any[][];
    if(it.w!==undefined)opts=[sentToks(it.w)];
    else if(it.o)opts=[[],...exp(it.o)];
    else if(it.a)opts=it.a.flatMap(exp);
    else opts=perms(it.m).flatMap(order=>order.reduce((ac,part)=>prod(ac,exp(part)),[[]]));
    acc=prod(acc,opts)}return acc};
  return exp(seq("")).map(t=>t.join(" "))}
export function compileAccept(tr:string,patterns?:string[]|null):{forms:Set<string>;toks:Set<string>}{const forms=new Set([sentToks(tr).join(" ")]);for(const p of patterns||[])for(const f of acceptForms(p))forms.add(f);
  const toks=new Set<string>();for(const f of forms)for(const t of f.split(" "))if(t)toks.add(t);return {forms,toks}}
/* how a built sentence compares: exact, an accepted variant, a swap of two neighbouring words in a longer sentence (counts, as "almost"),
   the right words in another order, or wrong; `bad` lists the positions that differ from the canonical sentence */
export function checkBuilt(placed:unknown[],tr:string,patterns?:string[]|null):BuiltVerdict{const canon=sentToks(tr),got=placed.map(t=>String(t).toLocaleLowerCase("tr")),key=got.join(" ");
  const bad=got.map((t,i)=>t!==canon[i]?i:-1).filter(i=>i>=0);
  if(key===canon.join(" "))return {ok:true,kind:"exact",bad:[]};
  if(compileAccept(tr,patterns).forms.has(key))return {ok:true,kind:"variant",bad:[]};
  if(got.length>=4&&got.length===canon.length&&bad.length===2&&bad[1]===bad[0]+1&&got[bad[0]]===canon[bad[1]]&&got[bad[1]]===canon[bad[0]])return {ok:true,kind:"swap",bad};
  const same=got.length===canon.length&&[...got].sort().join(" ")===[...canon].sort().join(" ");
  return {ok:false,kind:same?"order":"wrong",bad:got.length>canon.length?[...bad,...got.slice(canon.length).map((_,k)=>canon.length+k)].filter((v,k,a)=>a.indexOf(v)===k):bad}}
