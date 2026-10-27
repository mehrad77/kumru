// The skill tree: chunkWords, skillParts, treeFlow, skillPos and treeMark. Ported from scripts/kumru_tree.test.cjs, which
// cut them out of the built page; the assertions are the same.
import assert from "node:assert/strict";
import { test } from "node:test";
import { chunkWords, skillParts, skillPos, treeFlow, treeMark } from "./tree.ts";

const eq = (got, want, msg) => assert.equal(JSON.stringify(got), JSON.stringify(want), msg);

test("the skill tree", () => {
  /* chunkWords: lessons of up to 8 words, none left with one or two */
  const sizes=n=>chunkWords(Array.from({length:n},(_,i)=>i)).map(c=>c.length);
  eq([0,1,2,3,5,8,9,10,11,12,13,15,16,17,20].map(sizes),[[],[1],[2],[3],[5],[8],[5,4],[5,5],[6,5],[6,6],[7,6],[8,7],[8,8],[6,6,5],[7,7,6]],"chunk sizes");
  eq(chunkWords([1,2,3,4,5,6,7]).flat(),[1,2,3,4,5,6,7],"chunks keep the order and every word");
  
  /* skillParts: lessons first, then the words in lessons; missing cards are skipped */
  const have={a:1,b:1,c:1,d:1,e:1,f:1,g:1};const cardOf=id=>have[id]?{id}:null;
  eq(skillParts({lessons:["g1"],words:["a","b","c"]},cardOf).map(p=>p.t),["lesson","words"],"a mixed skill: lesson, then words");
  eq(skillParts({lessons:["g1","g2"],words:[]},cardOf).map(p=>p.g),["g1","g2"],"a grammar skill: its lessons");
  eq(skillParts({lessons:[],words:["a","b","c","d","e","f","zz"]},cardOf).map(p=>p.ws.map(c=>c.id).join("")),["abcdef"],"six real words make one lesson; the unknown id is skipped");
  eq(skillParts({lessons:[],words:["a","b","c","d","e","f","g","a","b"]},cardOf).map(p=>p.ws.length),[5,4],"nine words make two lessons");
  eq(skillParts({lessons:[],words:["zz"]},cardOf),[],"a skill whose cards are all missing has no parts");
  
  /* treeFlow: one cur step, locked after it, a checkpoint closing each section */
  const sec=(id,order,...sks)=>({id,order,level:"A1",skills:sks.map((w,i)=>({id:id+i,lessons:[],words:w}))});
  const S1=sec("s01",1,["a","b","c"],["d","e","f"]),S2=sec("s02",2,["a","b","c"]);
  const partsOf=sk=>skillParts(sk,cardOf);
  let F=treeFlow([S1,S2],{sk:{},sec:{}},partsOf);
  eq(F.secs[0].skills.map(x=>x.state),["cur","locked"],"fresh learner: first skill is cur");
  eq([F.secs[0].cp,F.secs[1].skills[0].state],["locked","locked"],"checkpoint and next section locked");
  eq([F.cur.sk.id,F.cur.l,F.cur.L],["s010",0,1],"cur names the skill, its done parts and its parts");
  F=treeFlow([S1,S2],{sk:{s010:{l:1}},sec:{}},partsOf);
  eq(F.secs[0].skills.map(x=>x.state),["done","cur"],"a finished skill is done, the next is cur");
  F=treeFlow([S1,S2],{sk:{s010:{l:1},s011:{l:1}},sec:{}},partsOf);
  eq([F.secs[0].cp,!!F.cur.cp,F.cur.sec.id,F.secs[1].skills[0].state],["cur",true,"s01","locked"],"all skills done: the checkpoint is cur");
  F=treeFlow([S1,S2],{sk:{s010:{l:1},s011:{l:1}},sec:{s01:{at:1}}},partsOf);
  eq([F.secs[0].state,F.secs[0].cp,F.secs[1].skills[0].state,F.secs[1].state],["done","done","cur","cur"],"passing the checkpoint opens the next section");
  F=treeFlow([S1,S2],{sk:{s010:{l:1},s011:{l:1},s020:{l:1}},sec:{s01:{at:1},s02:{at:1}}},partsOf);
  eq([F.cur,F.secs.every(s=>s.state==="done")],[null,true],"everything done: no cur step");
  F=treeFlow([sec("s03",3,["zz"],["a","b","c"])],{sk:{},sec:{}},partsOf);
  eq(F.secs[0].skills.map(x=>x.state),["done","cur"],"a skill without cards counts as done");
  F=treeFlow([S1],{sk:{s010:{l:9}},sec:{}},partsOf);
  eq(F.secs[0].skills[0].l,1,"progress is capped at the number of parts");
  /* placed skills: skipped by a placement or test, open, never blocking */
  F=treeFlow([S1,S2],{sk:{s010:{l:0,how:"placed"}},sec:{}},partsOf);
  eq(F.secs[0].skills.map(x=>x.state),["placed","cur"],"a placed skill does not block: the next one is cur");
  F=treeFlow([S1,S2],{sk:{s010:{l:0,how:"placed"},s011:{l:0,how:"test"}},sec:{}},partsOf);
  eq([F.secs[0].skills.map(x=>x.state),F.secs[0].cp],[["placed","placed"],"cur"],"all placed or tested: the checkpoint is cur");
  F=treeFlow([S1,S2],{sk:{s010:{l:0,how:"placed"},s011:{l:0,how:"placed"}},sec:{s01:{at:1,how:"placed"}}},partsOf);
  eq([F.secs[0].skipped,F.secs[0].cp,F.secs[1].skills[0].state],[true,"done","cur"],"a section placed past needs no checkpoint");
  F=treeFlow([S1,S2],{sk:{s010:{l:1}},sec:{s01:{at:1,how:"cp"}}},partsOf);
  eq(F.secs[0].skipped,false,"a section passed by its checkpoint is not 'skipped'");
  
  /* skillPos: the book unit of a skill (lessons, and the 80th-percentile unit of its words) */
  const lidx={g1:3,g2:5},widx={a:0,b:0,c:1,d:1,e:2,f:2,g:null};
  const posOf=sk=>skillPos(sk,g=>lidx[g]??null,id=>widx[id]??null);
  eq(posOf({lessons:["g1"],words:[]}),3,"a lesson's unit");
  eq(posOf({lessons:["g1","g2"],words:[]}),5,"the highest lesson unit");
  eq(posOf({lessons:[],words:["a","b","c","d","e"]}),2,"the 80th-percentile word unit (one stray high word does not count twice)");
  eq(posOf({lessons:[],words:["a","a","a","a","e"]}),2,"five words: the 80th percentile is the fifth");
  eq(posOf({lessons:[],words:["a","b","c","d","d","d","d","d","d","e"]}),1,"ten words: index 8 of 10, so the single highest word does not count");
  eq(posOf({lessons:["g1"],words:["e","e"]}),3,"a skill with a lesson sits where its lesson does, whatever its words");
  eq(posOf({lessons:["gx"],words:["e"]}),2,"a lesson with no unit falls back to its words");
  eq(posOf({lessons:[],words:["g"]}),null,"no unit information");
  
  /* treeMark: placed and migrated marks */
  const mk=(id,order,...skills)=>({id,order,level:"A1",skills:skills.map(([w,l],i)=>({id:id+i,lessons:l||[],words:w}))});
  Object.assign(have,{x:1,y:1,z:1});
  const M1=mk("m1",1,[["a","b","c"]],[["d","e","f"]]),M2=mk("m2",2,[["x","y","z"]]),M3=mk("m3",3,[["d","e"]],[[],["g1"]]);
  const poss={m10:0,m11:1,m20:2,m30:4,m31:6},cx=(ci,known,learned)=>({ci,partsOf:sk=>sk.lessons.length?[{t:"lesson"}]:skillParts(sk,cardOf),posOf:sk=>poss[sk.id]??null,known:id=>!!(known||[]).includes(id),learned:g=>!!(learned||[]).includes(g),now:7});
  const E={v:1,sk:{},sec:{}};
  let T=treeMark([M1,M2,M3],E,cx(2),{place:true});
  eq(Object.entries(T.sk).map(([k,v])=>k+":"+v.how),["m10:placed","m11:placed"],"place: skills before the unit are placed");
  eq(Object.keys(T.sec),["m1"],"place: a section with every skill placed is placed past");
  eq(T.mig,undefined,"placing alone does not set mig");
  T=treeMark([M1,M2,M3],E,cx(0),{place:true});
  eq([T.sk,T.sec],[{},{}],"a learner at the first unit places nothing");
  T=treeMark([M1,M2,M3],E,cx(2,["a","b","c","d","e","f"]),{migrate:true,place:true});
  eq(Object.entries(T.sk).map(([k,v])=>k+":"+v.how+":"+v.l),["m10:migrated:1","m11:migrated:1","m30:migrated:1"],"migrate: skills whose words are known are done, not placed");
  eq([T.mig,Object.keys(T.sec)],[1,[]],"migrate sets mig; a section of migrated skills still has its checkpoint");
  T=treeMark([M1,M2,M3],E,cx(3,["a","b","c","d"]),{migrate:true,place:true});
  eq(Object.entries(T.sk).map(([k,v])=>k+":"+v.how),["m10:migrated","m11:placed","m20:placed"],"4 of 6 words known is under 80%: placed, not done");
  T=treeMark([M1,M2,M3],E,cx(8,["d","e"],[]),{migrate:true,place:true});
  eq(T.sk.m30.how,"migrated","a words skill with all words known migrates");
  eq(T.sk.m31.how,"placed","a lesson skill that is not learned is placed, not done");
  T=treeMark([M1,M2,M3],E,cx(8,["d","e"],["g1"]),{migrate:true,place:true});
  eq(T.sk.m31.how,"migrated","a lesson that is learned migrates");
  /* the position moving back drops placed marks that no longer apply; finished and tested skills stay */
  let P=treeMark([M1,M2,M3],E,cx(3),{place:true});
  eq(Object.keys(P.sk),["m10","m11","m20"],"placed at unit 3");
  eq(Object.keys(treeMark([M1,M2,M3],P,cx(1),{}).sk),["m10"],"moved back to unit 1: only the skill below it stays placed");
  eq(Object.keys(treeMark([M1,M2,M3],P,cx(1),{}).sec),[],"moved back: the placed section is dropped");
  const mixed={v:1,sk:{m10:{l:1,at:1},m11:{l:0,how:"test"},m20:{l:0,how:"placed"}},sec:{}};
  eq(Object.keys(treeMark([M1,M2,M3],mixed,cx(0),{}).sk),["m10","m11"],"a finished skill and a tested one stay when the position goes back");
  eq(treeMark([M1,M2,M3],E,cx(3),{place:true}).sk.m10.at,7,"marks carry the time");
  P=treeMark([M1,M2,M3],{v:1,sk:{m10:{l:1,at:1}},sec:{}},cx(3),{place:true});
  eq(P.sk.m10.how,undefined,"a skill finished on the path is not overwritten with a placed mark");
  
});
