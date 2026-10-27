// parseConnect (app/features/yeni/api.ts): the consent page's one place for validating the reader's link.
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseConnect, yeni, yeniReturn } from "./api.ts";

const ORIGINS = ["https://yeni.shab.boo", "http://localhost:4330"];
const STATE = "abcdefghijklmnopqrstuv";
const CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";   // 43 chars of base64url, like b64url(sha256(verifier))
const link = (over = {}) => {
  const q = new URLSearchParams({ return: "https://yeni.shab.boo/ayarlar/", state: STATE, code_challenge: CHALLENGE, code_challenge_method: "S256", ...over });
  for (const [k, v] of Object.entries(over)) if (v === null) q.delete(k);
  return "?" + q;
};

test("a complete link gives the return URL (hash stripped), the state and the challenge", () => {
  assert.deepEqual(parseConnect(link({ return: "https://yeni.shab.boo/ayarlar/#old" }), ORIGINS),
    { ret: "https://yeni.shab.boo/ayarlar/", state: STATE, challenge: CHALLENGE });
  assert.equal(parseConnect(link({ return: "http://localhost:4330/a1/" }), ORIGINS).ret, "http://localhost:4330/a1/");
});

test("a return outside the allowed origins is refused", () => {
  for (const bad of ["https://evil.example/", "https://yeni.shab.boo.evil.example/", "javascript:alert(1)", "not a url", ""]) {
    assert.throws(() => parseConnect(link({ return: bad }), ORIGINS), { code: "bad_return", message: /doesn't come from Notebook/ });
  }
  assert.throws(() => parseConnect(link({ return: null }), ORIGINS), /doesn't come from/);
  assert.throws(() => parseConnect(link(), []), /doesn't come from/);
});

test("the state must be 16 to 128 base64url characters", () => {
  for (const bad of ["", "short", "x".repeat(129), "has space in it!!!!", "ünicode-state-1234567"]) {
    assert.throws(() => parseConnect(link({ state: bad }), ORIGINS), { code: "bad_link", message: /incomplete or out of date/ });
  }
  assert.throws(() => parseConnect(link({ state: null }), ORIGINS), /incomplete/);
  assert.equal(parseConnect(link({ state: "a".repeat(16) }), ORIGINS).state, "a".repeat(16));
  assert.equal(parseConnect(link({ state: "A_-".repeat(40) }), ORIGINS).state.length, 120);
});

test("the challenge must be 43 base64url characters", () => {
  for (const bad of ["", CHALLENGE.slice(1), CHALLENGE + "a", CHALLENGE.slice(1) + "+", CHALLENGE.slice(1) + "="]) {
    assert.throws(() => parseConnect(link({ code_challenge: bad }), ORIGINS), /incomplete or out of date/);
  }
  assert.throws(() => parseConnect(link({ code_challenge: null }), ORIGINS), /incomplete/);
});

test("only the S256 method is accepted", () => {
  for (const bad of ["plain", "s256", "", "S512"]) assert.throws(() => parseConnect(link({ code_challenge_method: bad }), ORIGINS), /incomplete or out of date/);
  assert.throws(() => parseConnect(link({ code_challenge_method: null }), ORIGINS), /incomplete/);
});

test("yeniReturn keeps working for the cancel path", () => {
  assert.equal(yeniReturn("https://yeni.shab.boo/x/#h", ORIGINS), "https://yeni.shab.boo/x/");
  assert.equal(yeniReturn("ftp://yeni.shab.boo/", ORIGINS), null);
});

/* notebook(): the cached copy, 304s, and keeping one account's notebook from another */
function fakeBrowser({ me = "u1", quota = Infinity } = {}) {
  const ls = new Map(me ? [["kumru:me", JSON.stringify({ id: me })], ["kumru:session", "tok"]] : []);
  const calls = [];
  globalThis.localStorage = {
    getItem: (k) => (ls.has(k) ? ls.get(k) : null),
    setItem: (k, v) => { if (String(v).length > quota) throw new Error("QuotaExceededError"); ls.set(k, String(v)); },
    removeItem: (k) => { ls.delete(k); },
  };
  globalThis.document = { querySelector: () => null };
  globalThis.dispatchEvent = () => true;
  return { ls, calls, reply(fn) { globalThis.fetch = async (url, init) => { calls.push({ url, init }); return fn(url, init); }; } };
}
const res = (status, body) => ({ status, ok: status >= 200 && status < 300, text: async () => (body === undefined ? "" : JSON.stringify(body)) });

test("notebook: the first call has no since, stores rev and doc, and returns the parsed doc", async () => {
  const b = fakeBrowser();
  b.reply(() => res(200, { rev: 3, doc: { app: "yeni-defter", units: {} } }));
  assert.deepEqual(await yeni.notebook(), { app: "yeni-defter", units: {} });
  assert.equal(b.calls[0].url, "/api/yeni/notebook");
  assert.equal(b.calls[0].init.method, "GET");
  assert.equal(b.ls.get("kumru:yeni:rev"), "3");
  assert.deepEqual(JSON.parse(b.ls.get("kumru:yeni:doc")), { app: "yeni-defter", units: {} });
});

test("notebook: later calls send since and a 304 returns the cached doc", async () => {
  const b = fakeBrowser();
  b.reply(() => res(200, { rev: 3, doc: { a: 1 } }));
  await yeni.notebook();
  b.reply(() => res(304));
  assert.deepEqual(await yeni.notebook(), { a: 1 });
  assert.equal(b.calls[1].url, "/api/yeni/notebook?since=3");
  assert.deepEqual(yeni.cached(), { a: 1 });
});

test("notebook: a newer rev replaces the cache; no notebook clears it", async () => {
  const b = fakeBrowser();
  b.reply(() => res(200, { rev: 1, doc: { a: 1 } }));
  await yeni.notebook();
  b.reply(() => res(200, { rev: 2, doc: { a: 2 } }));
  assert.deepEqual(await yeni.notebook(), { a: 2 });
  assert.equal(b.ls.get("kumru:yeni:rev"), "2");
  b.reply(() => res(200, { rev: 0, doc: null }));
  assert.equal(await yeni.notebook(), null);
  assert.equal(yeni.cached(), null);
  assert.equal(b.ls.has("kumru:yeni:doc"), false);
});

test("notebook: a full localStorage keeps the doc in memory and never leaves an old copy", async () => {
  const b = fakeBrowser({ quota: 20 });
  b.reply(() => res(200, { rev: 1, doc: { a: 1 } }));
  await yeni.notebook();
  b.reply(() => res(200, { rev: 2, doc: { big: "x".repeat(100) } }));
  assert.equal((await yeni.notebook()).big.length, 100);
  assert.equal(b.ls.has("kumru:yeni:doc"), false);
  assert.equal(yeni.cached().big.length, 100);
  b.reply(() => res(304));
  assert.equal((await yeni.notebook()).big.length, 100);
  assert.equal(b.calls.at(-1).url, "/api/yeni/notebook?since=2");
});

test("notebook: another account on the same phone never sees the cached copy", async () => {
  const b = fakeBrowser({ me: "u1" });
  b.reply(() => res(200, { rev: 5, doc: { mine: true } }));
  await yeni.notebook();
  b.ls.set("kumru:me", JSON.stringify({ id: "u2" }));
  assert.equal(yeni.cached(), null);
  b.reply(() => res(200, { rev: 0, doc: null }));
  assert.equal(await yeni.notebook(), null);
  assert.equal(b.calls.at(-1).url, "/api/yeni/notebook");
});

test("notebook: failures reject like any api call and keep the cache", async () => {
  const b = fakeBrowser();
  b.reply(() => res(200, { rev: 1, doc: { a: 1 } }));
  await yeni.notebook();
  b.reply(() => { throw new Error("down"); });
  await assert.rejects(yeni.notebook(), { code: "offline" });
  assert.deepEqual(yeni.cached(), { a: 1 });
});
