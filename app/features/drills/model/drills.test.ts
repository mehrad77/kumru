// The suffix drills: the drill table, which drills a level has, 200 random questions per drill (each builds, has three
// distinct wrong options and an explanation) and that the mixed mode stays within the level. Ported from
// tools/kumru_verbs.test.js; the assertions are the same.
import assert from "node:assert/strict";
import { test } from "node:test";
import { DT, drillOptions, drillWhy, makeDrillQ, myDrills, pickDrillType } from "./drills.ts";
import { plainParts } from "../../../lib/morphology.ts";

test("the suffix drills", () => {
  let pass = 0;
  const failures: string[] = [];
  const bad = (m: string) => { failures.push(m); };
  if (DT.length === 19 && DT.every((t) => t.lv && /^g_(a1|a2|b1)_[1-6]_[a-z0-9_]+$/.test(t.lesson))) pass++; else bad("DT shape");
  for(const [lv,n] of [["A1",10],["A2",15],["B1",19]]){if(myDrills(lv).length===n)pass++;else bad(`myDrills ${lv}: ${myDrills(lv).length}`)}
  /* 200 random questions per drill: build, 3 distinct wrong options, explanation */
  for(const t of DT)for(let k=0;k<200;k++){let q,ans,opts,why;
    try{q=makeDrillQ(t);ans=plainParts(q.ps);opts=drillOptions(q,ans);why=drillWhy(q)}catch(e){bad(`drill ${t.k} threw: ${e.message}`);break}
    if(opts.length!==3||new Set(opts).size!==3||opts.includes(ans)){bad(`drill ${t.k}: options ${JSON.stringify(opts)} for ${ans}`);break}
    if(!why.length||!q.fa||!q.en){bad(`drill ${t.k}: missing why/fa/en for ${ans}`);break}
    if(k===199)pass++}
  /* mixed mode stays within the level */
  const none = () => ({ t: 0, acc: 0 });
  if ([...Array(300)].every(() => pickDrillType("A1", "", false, none).lv === "A1")) pass++; else bad("pickDrillType A1 leaked a higher drill");
  assert.equal(pickDrillType("B1", "gen", false, none).k, "gen", "a forced type is kept");
  assert.ok([...Array(100)].every(() => pickDrillType("B1", "", true, none).verb), "verbs only gives a verb drill");
  assert.deepEqual(failures, []);
  assert.ok(pass >= 24, `only ${pass} checks passed`);
});
