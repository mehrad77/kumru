// Placement: the adaptive climb (a binary search over units or sections), the pass rule and the writing-sample nudge. Ported from
// scripts/kumru_onb.test.cjs and scripts/kumru_tree.test.cjs, which cut them out of the built page; the assertions are the same.
import assert from "node:assert/strict";
import { test } from "node:test";
import { plNext, plNudge, plPass } from "./placement.ts";

const eq = (got, want, msg) => assert.equal(JSON.stringify(got), JSON.stringify(want), msg);

test("the placement climb, pass rule and nudge", () => {
  /* placement climb */
  const run=(start,passes)=>{let st={lo:-1,hi:18,p:start,n:0};for(const ps of passes){st=plNext(st,ps);if(st.done)return st.idx}return "open"};
  eq(run(6,[true,false]),7,"pass A2·1, fail A2·2 -> A2·2");
  eq(run(6,[false,false,true]),5,"fail A2·1, fail A1·6, pass A1·5 -> A1·6");
  eq(run(12,[false,false,false,false,false]),7,"five fails from B1·1");
  eq(run(0,[false]),0,"fail at the very bottom");
  eq(run(17,[true]),17,"pass at the very top");
  eq(run(1,[true,true,true,true,true]),6,"five passes stop at lo+1");
  eq(run(6,[true,true,false]),8,"A2·1 pass, A2·2 pass, A2·3 fail -> A2·3");
  /* pass rule */
  eq(plPass({w:[5,6],g:[0,0]}),true,"5/6 words");
  eq(plPass({w:[4,6],g:[0,0]}),false,"4/6 words");
  eq(plPass({w:[3,3],g:[1,2]}),false,"grammar 1/2");
  eq(plPass({w:[6,6],g:[3,4]}),true,"grammar 3/4");
  eq(plPass({w:[0,0],g:[0,0]}),true,"nothing left to ask");
  /* writing nudge only goes down, at most three units */
  eq(plNudge(8,{language:"tr",level:"A1",unit:6}),5,"nudge down is capped at 3");
  eq(plNudge(8,{language:"tr",level:"A2",unit:6}),8,"never up");
  eq(plNudge(8,{language:"tr",level:"A2",unit:2}),7,"small nudge down");
  eq(plNudge(8,{language:"en",level:"A1",unit:1}),8,"not Turkish");
  eq(plNudge(8,null),8,"no sample");

  /* a jump test stays inside the skipped units: from unit 2 to target 6 probes units 2..5 */
  const jrun=(from,target,passes)=>{let st={lo:from-1,hi:target,p:target-1,n:0};for(const ps of passes){st=plNext(st,ps);if(st.done)return st.idx}return "open"};
  eq(jrun(2,6,[true]),6,"jump: top unit passed -> target");
  eq(jrun(2,6,[false,false,false,false]),2,"jump: all fail -> stay");
  eq(jrun(2,6,[false,true]),5,"jump: fail, then pass -> unit after the pass");
  eq(jrun(0,3,[false,false,false]),0,"jump from the first unit, all fail -> stay");
  eq(jrun(0,3,[true]),3,"jump from the first unit, top passes");
  eq(jrun(2,3,[false]),2,"jump one unit ahead, fail -> stay");
  /* plNext: the climb works for any number of steps (sections as well as the 18 units) */
  const climb=(max,passes,start,bounds)=>{let st={lo:bounds?bounds.lo:-1,hi:bounds?bounds.hi:max+1,p:start,n:0};for(const ps of passes){st=plNext(st,ps,max);if(st.done)return st.idx}return null};
  eq(climb(17,[true],17),17,"units: pass at the top stays at the top");
  eq(climb(5,[true],5),5,"six sections: pass at the top is capped at 5");
  eq(climb(5,[false,false,false,false],3),0,"four fails climb down to the first");
  eq(climb(5,[true,false],2),3,"pass then a fail one above: start above the pass");
  eq(climb(5,[true],2,{lo:1,hi:3}),3,"a test bounded to sections 2-3 ends at the target");
});
