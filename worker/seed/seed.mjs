// `pnpm seed`: fill the local D1 (wrangler dev) with deterministic accounts and progress states
// (docs/SPECS.md section 11.4). Re-running replaces them. Passwords and states are listed in README.md.
// Open one in the browser pane with ?as=<username> (dev only), no password needed.
import { spawnSync } from "node:child_process";
import { pbkdf2Sync, createHmac } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const vars = Object.fromEntries(readFileSync(".dev.vars", "utf8").split("\n").filter((l) => /^\w+=/.test(l)).map((l) => l.split(/=(.*)/s).slice(0, 2)));
const PEPPER = vars.PEPPER || "";
const ITER = 1000;   // dev only: users.pw_iter records it, so login verifies with it
const DAY = 86_400_000;
const NOW = Date.now();

const manifest = JSON.parse(readFileSync("public/data/manifest.json", "utf8"));
const cards = JSON.parse(readFileSync("public/" + manifest.files.cards, "utf8"));
const grammar = JSON.parse(readFileSync("public/" + manifest.files.grammar, "utf8"));

const hex = (b) => "X'" + Buffer.from(b).toString("hex") + "'";
const q = (s) => (s === null || s === undefined ? "NULL" : "'" + String(s).replace(/'/g, "''") + "'");
let n = 0;
const det = (len) => { n++; return Buffer.from(createHmac("sha256", "seed").update(String(n)).digest()).subarray(0, len); };
const B32 = "abcdefghijklmnopqrstuvwxyz234567";
const idOf = (name) => [...createHmac("sha256", "seed-id").update(name).digest()].slice(0, 26).map((x) => B32[x & 31]).join("");
const dayKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
function weekKey(t) {
  const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return d.getFullYear() + "-W" + String(1 + Math.round(((d - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7)).padStart(2, "0");
}

/** A progress document (docs/SPECS_SCHEMA.md section 3.1) for someone who knows the words of `refs`. */
function progress({ nick, pos, refs, lessons, streakDays = 0, placed = null }) {
  const conf = {}, confAt = {}, stats = {};
  let i = 0;
  for (const [id, c] of Object.entries(cards)) {
    if (!refs.includes(c.ref) || c.kind !== "word") continue;
    conf[id] = 5 + (i++ % 8);
    confAt[id] = NOW - DAY;
    stats[id] = { r: 3, w: i % 4 === 0 ? 1 : 0, t: NOW - DAY, l: 1 };
  }
  const days = {}, xpDays = {};
  for (let d = 0; d < streakDays; d++) { days[dayKey(NOW - d * DAY)] = 20; xpDays[dayKey(NOW - d * DAY)] = 30; }
  const gram = Object.fromEntries(Object.keys(grammar).filter((g) => lessons.some((l) => g.startsWith(l))).map((g) => [g, 1]));
  const xp = Object.values(xpDays).reduce((a, b) => a + b, 0) + Object.keys(conf).length;
  return { v: 5, conf, confAt, stats, drill: {}, days, ex: {}, gram, log: [], nick, st: {}, prefs: { lang: "fa", corr: "end", tryIt: true, goal: 20 },
    onb: 3, xp, xpDays, nd: {}, cheerSeen: 0, pos, ...(placed ? { placed } : {}), at: { nick: NOW - DAY, pos: NOW - DAY } };
}

const ACCOUNTS = [
  { username: "ada", password: "ada-password", doc: progress({ nick: "Ada", pos: { lv: "A1", u: 4 }, refs: ["A1_1", "A1_2", "A1_3"], lessons: ["g_a1_1", "g_a1_2", "g_a1_3"], streakDays: 5 }) },
  { username: "ali", password: "ali-password", doc: progress({ nick: "Ali", pos: { lv: "B1", u: 1 }, refs: ["A1_1", "A1_2"], lessons: ["g_a1"], streakDays: 1,
    placed: { lv: "B1", u: 1, self: "a2", probes: [], test: true, ai: false, learned: [], at: NOW - 2 * DAY, v: 1 } }) },
  { username: "nur", password: "nur-password", doc: null },
  { username: "owner", password: "owner-password", role: "owner", doc: progress({ nick: "Owner", pos: { lv: "A2", u: 1 }, refs: ["A1_1"], lessons: [], streakDays: 2 }) },
];

const sql = ["PRAGMA foreign_keys = ON;", `DELETE FROM users WHERE username IN (${ACCOUNTS.map((a) => q(a.username)).join(",")});`];
const codes = { ada: "ADA234", ali: "ALI234", owner: "OWN234" };
// ada and ali follow each other (friends); owner follows ada
// characters (shared/char.ts): ada a Sahne avatar document, ali the legacy eight-slot shape (drawn as the silhouette), the rest none
const CHARS = {
  ada: { v: 1, kit: "sahne-kit@1", body: { build: "adult", height: 0.45, shape: "average" }, skin: "skin_07", face: {},
    hair: { style: "hair_short", color: "hair_02" }, outfit: { top: { id: "top_tee" }, bottom: { id: "bottom_jeans" }, shoes: { id: "shoes_sneakers" } } },
  ali: { skin: 2, hair: 3, hairC: 1, beard: 0, top: 0, wear: 1, acc: 0, shirt: 4 },
};
const FOLLOWS = { ada: ["ali"], ali: ["ada"], owner: ["ada"] };
for (const a of ACCOUNTS) {
  const id = idOf(a.username), salt = det(16);
  const hash = pbkdf2Sync(a.password + "\u0000" + PEPPER, salt, ITER, 32, "sha256");
  const rec = createHmac("sha256", PEPPER).update("SEED2SEED2").digest();
  sql.push(`INSERT INTO users (id, username, pw_hash, pw_salt, pw_iter, recovery_hash, role, tz, created) VALUES (${q(id)}, ${q(a.username)}, ${hex(hash)}, ${hex(salt)}, ${ITER}, ${hex(rec)}, ${q(a.role || "learner")}, 'Europe/Istanbul', ${NOW - 30 * DAY});`);
  if (a.doc) {
    if (CHARS[a.username]) a.doc.char = CHARS[a.username];
    sql.push(`INSERT INTO docs (user_id, kind, body, rev, updated) VALUES (${q(id)}, 'progress', ${q(JSON.stringify(a.doc))}, 1, ${NOW - DAY});`);
    const wk = weekKey(NOW);
    const prof = { v: 1, nick: a.doc.nick, char: CHARS[a.username] || null, code: codes[a.username], following: (FOLLOWS[a.username] || []).map(idOf), xp: a.doc.xp, xpWeek: { [wk]: Math.min(a.doc.xp, 150) },
      streak: Object.keys(a.doc.days).length, lastDay: Object.keys(a.doc.days).sort().at(-1) || "", pos: a.doc.pos, unitsDone: [], storiesDone: 0, cheers: {}, updatedAt: NOW - DAY };
    sql.push(`INSERT INTO profiles (user_id, body, code, nick, xp, week, xp_week, last_day, updated) VALUES (${q(id)}, ${q(JSON.stringify(prof))}, ${q(prof.code)}, ${q(prof.nick.toLowerCase())}, ${prof.xp}, ${q(wk)}, ${prof.xpWeek[wk]}, ${q(prof.lastDay)}, ${NOW - DAY});`);
  }
}

for (const [who, list] of Object.entries(FOLLOWS)) {
  for (const whom of list) sql.push(`INSERT INTO follows (follower, followee, at) VALUES (${q(idOf(who))}, ${q(idOf(whom))}, ${NOW - DAY});`);
}
// hard-words summaries (docs/SPECS_SCHEMA.md section 3.4) so the owner's report and the teacher view have data
const some = Object.entries(cards).filter(([, c]) => c.kind === "word" && c.ref === "A1_1").slice(0, 6).map(([id]) => id);
const lesson = Object.keys(grammar)[0];
for (const [who, wrong] of [["ada", 4], ["ali", 3]]) {
  const body = { v: 1, at: NOW - DAY, cards: some.map((id, i) => ({ id, tries: 6, wrong: Math.max(1, wrong - (i % 3)) })), lessons: [{ id: lesson, tries: 5, misses: wrong }] };
  sql.push(`INSERT INTO weak (user_id, body, updated) VALUES (${q(idOf(who))}, ${q(JSON.stringify(body))}, ${NOW - DAY});`);
}
// a class owned by `owner` with ada (sharing with the teacher) and ali (not sharing)
sql.push(`INSERT INTO classes (id, name, code, owner, created) VALUES ('seedclass0000001', 'A1 Salı', 'CLS234', ${q(idOf("owner"))}, ${NOW - 7 * DAY});`);
for (const [who, share, shareBook] of [["owner", 1, 0], ["ada", 1, 1], ["ali", 0, 0]]) {
  sql.push(`INSERT INTO class_members (class_id, user_id, joined, share, share_book) VALUES ('seedclass0000001', ${q(idOf(who))}, ${NOW - 6 * DAY}, ${share}, ${shareBook});`);
}
// ada shares her book progress with the owner (migration 0008): a summary shaped like shared/api.ts BookDoc
sql.push(`INSERT INTO book (user_id, body, updated) VALUES (${q(idOf("ada"))}, ${q(JSON.stringify({ v: 1, at: NOW - 2 * DAY, last: { ref: "A1_3", at: NOW - 2 * DAY },
  units: { A1_1: { d: 1, p: 1, s: [12, 11, 14] }, A1_2: { d: 1, p: 0.96, s: [10, 8, 12] }, A1_3: { d: 0, p: 0.42, s: [3, 2, 15] } } }))}, ${NOW - 2 * DAY});`);
// a class taught by `ali`, with ada sharing and nur not, so ada sees a class she joined next to the one she teaches
sql.push(`INSERT INTO classes (id, name, code, owner, created) VALUES ('seedclass0000002', 'Ali''s Turkish Circle', 'ALI234', ${q(idOf("ali"))}, ${NOW - 5 * DAY});`);
for (const [who, share] of [["ali", 1], ["ada", 1], ["nur", 0]]) {
  sql.push(`INSERT INTO class_members (class_id, user_id, joined, share) VALUES ('seedclass0000002', ${q(idOf(who))}, ${NOW - 4 * DAY}, ${share});`);
}

mkdirSync(".wrangler", { recursive: true });
writeFileSync(".wrangler/seed.sql", sql.join("\n") + "\n");
const run = (args) => { const r = spawnSync("pnpm", ["exec", "wrangler", ...args], { stdio: "inherit" }); if (r.status) process.exit(r.status); };
run(["d1", "migrations", "apply", "yakerim", "--local"]);
run(["d1", "execute", "yakerim", "--local", "--file=.wrangler/seed.sql"]);
console.log(`seeded ${ACCOUNTS.map((a) => a.username).join(", ")}; open http://localhost:8787/?as=ada`);
