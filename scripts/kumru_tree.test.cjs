/* Checks for the retry limit (requeue, features/practice/model/requeue.ts), the Path's Test out (features/path/model/testout.ts) and Prove it.
   usage: node scripts/kumru_tree.test.cjs */
const A=require("../app/features/practice/model/answers.ts"),R=require("../app/features/practice/model/requeue.ts"),TO=require("../app/features/path/model/testout.ts"),T=require("../app/features/path/model/tree.ts");
/* the Path's Test out (app/features/path/model/testout.ts) takes its state and effects as arguments: fakes here */
const S={session:null,learned:{},tp:{v:1,sk:{},sec:{}}};
let SECS=[],BY={},synced=0,saved=0;
const wordCardOf=id=>/^[a-z]$/.test(id)?{id}:null;
const applyTreeTest=(R,C,to)=>TO.applyTreeTest({S,secs:()=>SECS,scoreRecs:()=>BY,parts:sk=>T.skillParts(sk,wordCardOf).length,syncPos:()=>{synced++},save:()=>{saved++},closeUnits:()=>{},now:Date.now},R,C,to);
const requeue=st=>R.requeue(S.session,st);
const setSecs=x=>{SECS=x},setBy=x=>{BY=x},counts=()=>[synced,saved];
let pass=0,fail=0;const eq=(got,want,msg)=>{if(JSON.stringify(got)===JSON.stringify(want))pass++;else{fail++;console.log("FAIL "+msg+"\n  got  "+JSON.stringify(got)+"\n  want "+JSON.stringify(want))}};
const card=(id,tr,en,fa)=>({id,tr,en,fa});

/* meaningClash, wordLessonSteps, acceptForms, checkBuilt, word hints, slips and lessonSentences are tested in app/features/practice/model/practice.test.ts */

/* requeue: a miss comes back twice at most, only inside a path node, only when a word is asked */
const sess=(node)=>({node,queue:[],total:10});
const step={k:"choice",c:card("w0","t0","e0","ف"),dir:"m",label:"New words"};
S.session=sess(null);requeue(step);eq(S.session.queue.length,0,"no requeue outside a node");
S.session=sess({id:"n"});requeue({k:"drill"});eq(S.session.queue.length,0,"no requeue without a word");
requeue(step);eq([S.session.queue.length,S.session.total,S.session.queue[0].retry],[1,11,1],"first retry queued");
requeue(S.session.queue[0]);eq([S.session.queue.length,S.session.total,S.session.queue[1].retry],[2,12,2],"second retry queued");
requeue(S.session.queue[1]);eq([S.session.queue.length,S.session.total],[2,12],"no third retry");
eq(S.session.queue[0].c.id,"w0","retry keeps the word");
/* a retry comes three steps later, not at once */
S.session=sess({id:"n"});S.session.queue=["a","b","c","d","e"].map(k=>({k:"drill",tag:k}));requeue(step);
eq(S.session.queue.map(x=>x.tag||"retry"),["a","b","c","retry","d","e"],"a miss is requeued after three steps");
S.session=sess({id:"n"});S.session.queue=[{k:"drill",tag:"a"}];requeue(step);eq(S.session.queue.map(x=>x.tag||"retry"),["a","retry"],"a short queue puts it last");
/* chunkWords, skillParts, treeFlow, skillPos and treeMark are tested in app/features/path/model/tree.test.ts */
const have={a:1,b:1,c:1,d:1,e:1,f:1,g:1};
const mk=(id,order,...skills)=>({id,order,level:"A1",skills:skills.map(([w,l],i)=>({id:id+i,lessons:l||[],words:w}))});

/* applyTreeTest: a successful test out marks sections C..to-1 as tested; lessons learn only on a clean, passed probe */
{Object.assign(have,{x:1,y:1,z:1});
 const A=mk("t1",1,[["a","b","c"]],[[],["gA"]]),B=mk("t2",2,[["d","e","f"]],[[],["gB"]]),Cc=mk("t3",3,[["x","y","z"]]);
 setSecs([A,B,Cc]);setBy({gA:[true,true],gB:[true,true,false]});
 S.tp={v:1,sk:{t10:{l:1,at:1}},sec:{}};S.learned={};
 applyTreeTest({probes:[{ref:"sec:t2",pass:true,w:[6,6],g:[2,2]},{ref:"sec:t1",pass:true,w:[6,6],g:[2,2]}],recs:{}},0,2);
 eq(Object.keys(S.tp.sec),["t1","t2"],"sections 1 and 2 are tested out");
 eq(S.tp.sk.t10,{l:1,at:1},"a skill already finished on the path keeps its record");
 eq(S.tp.sk.t11.how,"test","an unfinished skill becomes tested out");
 eq(S.tp.sk.t20.how,"test","skills of every skipped section are marked");
 eq(S.tp.sk.t30,undefined,"the target section is untouched");
 eq(Object.keys(S.learned),["gA"],"a lesson with 2 clean drills in a passed section is learned; one with a miss is not");
 eq([S.tp.tests.length,S.tp.tests[0].from,S.tp.tests[0].to],[1,0,2],"the test is recorded");
 eq(counts(),[1,1],"position synced and progress saved once");
 /* declined or failed: nothing is marked, answers still scored */
 S.tp={v:1,sk:{},sec:{}};S.learned={};
 applyTreeTest({probes:[{ref:"sec:t1",pass:false,w:[2,6],g:[0,2]}],recs:{}},0,0);
 eq([Object.keys(S.tp.sk),Object.keys(S.tp.sec),Object.keys(S.learned)],[[],[],[]],"staying marks nothing");
 eq(S.tp.tests.length,1,"but the attempt is recorded");
 /* a lesson only learns when its section lies below the section moved to */
 S.tp={v:1,sk:{},sec:{}};S.learned={};setBy({gB:[true,true]});
 applyTreeTest({probes:[{ref:"sec:t2",pass:true,w:[6,6],g:[2,2]}],recs:{}},0,1);
 eq([Object.keys(S.learned),Object.keys(S.tp.sec)],[[],["t1"]],"moving to section 2: section 2's own lesson is not learned by the test")}
/* Lab practice earns no XP and no active day: app/features/progress/api.test.ts */
/* Prove it: a claimed word is confident (10+) and never answered; each round asks up to 12, one step each */
{const {claimedWords,proveSteps}=require("../app/features/lab/model/prove.ts"),P={S:{conf:{},stats:{}},claimedWords:cards=>claimedWords(cards,P.S.conf,P.S.stats),proveSteps:(words,max)=>proveSteps(words,max,a=>a.slice())};
 const w=(id,tr,kind)=>({id,tr,en:id,kind:kind||"word"});const cards=[w("a","elma"),w("b","su"),w("c","ben de gelirim"),w("d","iyi akşamlar dilerim"),w("e","kitap"),w("f","x","sentence"),w("g","yok")];
 P.S.conf={a:10,b:12,c:10,d:10,e:6,f:10};P.S.stats={b:{r:1},v:0};
 eq(P.claimedWords(cards).map(c=>c.id),["a","c","d"],"claimed: confident words never answered (not answered, below 10, or a sentence)");
 P.S.stats={a:{v:2}};eq(P.claimedWords(cards).map(c=>c.id),["a","b","c","d"],"a teach card (v) is not an answer");
 const st=P.proveSteps(cards.filter(c=>["a","c","d"].includes(c.id)));
 eq(st.map(x=>[x.c.id,x.k]),[["a","type"],["c","choice"],["d","choice"]],"two words are typed from recall, a phrase of three words or more is picked");
 eq(P.proveSteps(Array.from({length:30},(_,i)=>w("w"+i,"k"+i))).length,12,"a round holds at most 12");
 eq(P.proveSteps([]),[],"no claims, no steps")}
console.log(fail?fail+" failed, "+pass+" passed":"all "+pass+" assertions passed");process.exit(fail?1:0)
