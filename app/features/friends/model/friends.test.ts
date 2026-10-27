// Friends helpers: friends, followers and pending, the leaderboard, the inbox, the public doc, search. Ported from
// tools/kumru_friends.test.js, which cut them out of the built page; the assertions are the same.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as F from "./friends.ts";
import * as P from "../../../lib/progress.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the assertions call the helpers with loose literals
const A: Record<string, any> = { ...F, ...P };
const ok = (c: unknown, m: string) => assert.ok(c, m);
const eq = (a: unknown, b: unknown, m: string) => assert.equal(JSON.stringify(a), JSON.stringify(b), m);

test("friends helpers", () => {
  /* a fixed Wednesday noon; week 2026-W41 runs Mon 5 Oct .. Sun 11 Oct */
  const NOW=new Date(2026,9,7,12).getTime(),DAY=864e5,WK=A.weekKey(new Date(NOW)),LW=A.weekKey(new Date(NOW-7*DAY));
  eq(WK,"2026-W41","week key");eq(LW,"2026-W40","last week key");
  const today=A.dayKey(new Date(NOW)),yday=A.dayKey(new Date(NOW-DAY)),old=A.dayKey(new Date(NOW-3*DAY));
  const P=(following,o)=>Object.assign({nick:"",code:"",following,xp:0,xpWeek:{},streak:0,lastDay:today,cheers:{}},o||{});
  const profiles=new Map([
    ["me",P(["sara","nina","bob","ghost"],{code:"MEME22"})],
    ["sara",P(["me","ali"],{nick:"Sara",code:"SARA33",xp:900,xpWeek:{[WK]:180,[LW]:140},streak:12,cheers:{me:{kind:"great",at:NOW-3600e3}}})],
    ["ali",P(["me"],{nick:"Ali",code:"ALI444",xp:400,xpWeek:{[WK]:90},streak:4,cheers:{me:{kind:"go",at:NOW-20*DAY}}})],
    ["nina",P([],{nick:"Nina",code:"NINA55",xp:260,xpWeek:{[WK]:60},streak:1})],
    ["bob",P(["me"],{nick:"Bob",code:"BOB777",xp:50,xpWeek:{[WK]:180,[LW]:5},streak:12,lastDay:old,cheers:{me:{kind:"bogus",at:NOW-60e3}}})],
    ["cem",P(["me"],{nick:"Cem",code:"CEM888",xp:70,xpWeek:{[WK]:180},streak:3,cheers:{me:{kind:"go",at:NOW-120e3}}})],
    ["omid",P([],{nick:"Omid Sarabi",code:"OMID66"})]]);

  /* friends, followers, pending */
  eq(A.frFriendIds(profiles,"me"),["sara","bob"],"mutual friends (ghost has no doc, nina doesn't follow back)");
  ok(A.frIsFriend(profiles,"me","sara")&&!A.frIsFriend(profiles,"me","ali")&&!A.frIsFriend(profiles,"me","me"),"isFriend");
  eq(A.frFollowerIds(profiles,"me").sort(),["ali","bob","cem","sara"],"followers");
  eq(A.frPendingIds(profiles,"me"),["nina","ghost"],"pending: I follow, they don't follow back");
  eq(A.frFriendIds(new Map(),"me"),[],"no profiles");eq(A.frFriendIds(profiles,null),[],"no me");

  /* leaderboard: week xp, then live streak, then uid; bob's streak is stale (lastDay 3 days ago) */
  const mine={week:180,xp:120,streak:12};
  let lb=A.frLeaderboard(profiles,"me","week",WK,mine,NOW);
  eq(lb.map(r=>[r.uid,r.xp,r.streak,r.rank]),[["me",180,12,1],["sara",180,12,1],["bob",180,0,3]],"weekly order, ties and shared rank");
  ok(lb[0].me&&!lb[1].me,"me flag");
  lb=A.frLeaderboard(profiles,"me","all",WK,mine,NOW);
  eq(lb.map(r=>[r.uid,r.xp,r.rank]),[["sara",900,1],["me",120,2],["bob",50,3]],"all-time order");
  eq(A.frLeaderboard(new Map(),"me","week",WK,{week:5,xp:5,streak:0},NOW).map(r=>r.uid),["me"],"alone on the board");
  eq(A.frLeaderboard(profiles,"me","week","2026-W50",{week:0,xp:0,streak:0},NOW).map(r=>r.xp),[0,0,0],"a week nobody has keys for");
  eq([A.frLiveStreak({streak:5,lastDay:today},NOW),A.frLiveStreak({streak:5,lastDay:yday},NOW),A.frLiveStreak({streak:5,lastDay:old},NOW),A.frLiveStreak(null,NOW)],[5,5,0,0],"live streak");

  /* inbox */
  let ib=A.frInbox(profiles,"me",{},0,NOW);
  eq(ib.follows.sort(),["ali","cem"],"follow-back candidates");
  eq(ib.cheers.map(c=>[c.uid,c.kind]),[["cem","go"],["sara","great"]],"unseen cheers newest first, old (20d) and unknown kinds dropped");
  ib=A.frInbox(profiles,"me",{ali:NOW-5},NOW-1800e3,NOW);
  eq(ib.follows,["cem"],"dismissed follower hidden");
  eq(ib.cheers.map(c=>c.uid),["cem"],"cheers older than cheerSeen hidden");
  eq(A.frInbox(profiles,"me",{},NOW,NOW).cheers,[],"all seen");

  /* ops over my doc */
  const base={following:["a","b"],cheers:{x:{kind:"go",at:1}}};
  const ap=A.frApplyOps(base,[{t:"follow",uid:"c"},{t:"follow",uid:"a"},{t:"unfollow",uid:"b"},{t:"cheer",uid:"x",kind:"great",at:5},{t:"unfollow",uid:"zz"}]);
  eq(ap,{following:["a","c"],cheers:{x:{kind:"great",at:5}}},"apply ops");
  eq(base.following,["a","b"],"apply ops does not mutate");
  eq(A.frApplyOps(undefined,[]),{following:[],cheers:{}},"apply ops on no doc");
  eq([A.frCheerWait({u:{at:NOW-60e3}},"u",NOW),A.frCheerWait({u:{at:NOW-11*60e3}},"u",NOW),A.frCheerWait({},"u",NOW)],[540e3,0,0],"cheer rate limit");

  /* code generation */
  const abc=new Set(A.FR_ABC);eq(A.FR_ABC,"23456789ABCDEFGHJKMNPQRSTUVWXYZ","alphabet");
  let all=true;for(let i=0;i<500;i++){const c=A.frGenCode(new Set());if(c.length!==6||![...c].every(ch=>abc.has(ch)))all=false}ok(all,"codes: 6 chars from the alphabet");
  const seq=[0,0,0,0,0,0,0.5,0.5,0.5,0.5,0.5,0.5];let k=0;const rnd=()=>seq[k++%seq.length];
  eq(A.frGenCode(new Set(["222222"]),rnd),"HHHHHH","code generation skips a taken code");
  ok(A.frGenCode(new Set(),()=>0.99999999).length===6,"rnd near 1 stays in range");
  ok(A.frLooksCode(" sara 33 ")&&!A.frLooksCode("SARA3")&&!A.frLooksCode("SARAI3"),"looks like a code");

  /* search */
  eq(A.frSearch(profiles,"me"," sara33 ",new Map()),{self:false,code:"sara",ids:[]},"code match, case and spaces");
  eq(A.frSearch(profiles,"me","meme22",new Map()).self,true,"own code");
  eq(A.frSearch(profiles,"me","sar",new Map()).ids,["sara","omid"],"nick substring");
  eq(A.frSearch(profiles,"me","nin",new Map([["ali","Ninja Ali"]])).ids,["ali","nina"],"resolved names searched too");
  eq(A.frSearch(profiles,"me","sa",new Map()).ids,[],"under 3 chars");
  eq(A.frSearch(profiles,"me","ZZZZ22",new Map()),{self:false,code:null,ids:[]},"unknown code");

  /* public doc */
  const xpDays={[today]:20,[yday]:15,[A.dayKey(new Date(NOW-7*DAY))]:9,[A.dayKey(new Date(NOW-30*DAY))]:100};
  const nd={A1_1_cp:{at:10},A1_1_w1:{at:99},A1_2_cp:{at:30},A1_3_cp:{at:20},A1_4_cp:{at:50},A1_5_cp:{at:40},A1_6_cp:{at:60},A2_1_w2:{at:70}};
  const doc=A.frBuildDoc({nick:"  Mehrad  ",char:{skin:1},code:"MEME22",following:["sara","sara","nina"],
    cheers:{sara:{kind:"great",at:NOW-DAY},ali:{kind:"go",at:NOW-15*DAY},bob:{kind:"x",at:NOW}},xp:144,xpDays,days:{[old]:3},streak:2,pos:{lv:"A1",u:"4"},nd,st:{s1e01:{done:true},s1e02:{done:false},s1e03:{done:1},s01:{done:true}}},NOW);
  eq(Object.keys(doc).sort(),["char","cheers","code","following","lastDay","nick","pos","storiesDone","streak","unitsDone","updatedAt","v","xp","xpWeek"].sort(),"doc keys");
  eq(doc.xpWeek,{[WK]:35,[LW]:9},"xpWeek has this week and last week only");
  eq(doc.cheers,{sara:{kind:"great",at:NOW-DAY}},"cheers pruned to 14 days and known kinds");
  eq(doc.unitsDone.map(u=>u.ref),["A1_6","A1_4","A1_5","A1_2","A1_3"],"last five finished units, newest first");
  eq([doc.nick,doc.code,doc.following,doc.lastDay,doc.storiesDone,doc.pos,doc.v,doc.updatedAt],["Mehrad","MEME22",["sara","nina"],today,2,{lv:"A1",u:4},1,NOW],"doc fields");
  const empty=A.frBuildDoc({},NOW);eq([empty.char,empty.pos,empty.lastDay,empty.unitsDone,empty.following,empty.xp],[null,null,"",[],[],0],"empty inputs");

  /* change detection ignores key order and updatedAt */
  ok(A.frKey({a:1,b:{y:2,x:1},updatedAt:5})===A.frKey({b:{x:1,y:2},a:1,updatedAt:9}),"frKey stable");
  ok(A.frKey({a:[1,2]})!==A.frKey({a:[2,1]}),"frKey keeps array order");

  /* small things */
  eq([A.frRelTime(NOW-10e3,NOW),A.frRelTime(NOW-5*60e3,NOW),A.frRelTime(NOW-3*3600e3,NOW),A.frRelTime(NOW-DAY-5,NOW),A.frRelTime(NOW-3*DAY,NOW),A.frRelTime(NOW-21*DAY,NOW),A.frRelTime(0,NOW)],
    ["just now","5 min ago","3 h ago","yesterday","3 days ago","3 weeks ago",""],"relative time");
  eq([new Date(2026,9,5).getTime(),NOW,new Date(2026,9,11,23).getTime()].map(A.frWeekDaysLeft),[7,5,1],"days left in week");

});
