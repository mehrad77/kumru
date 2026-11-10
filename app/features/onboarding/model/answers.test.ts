// The flow's first draw reads the learner's saved name, profile and character (answers.ts): odd shapes must never throw.
import assert from "node:assert/strict";
import { test } from "node:test";
import { initAnswers } from "./answers.ts";
import { fill, guessLang, uiLangOf, WORDS } from "./words.ts";

test("missing or odd profile fields start an empty flow, never a throw", () => {
  const odd = [{}, { nick: null, profileName: null, profile: null }, { nick: 7, profileName: { x: 1 }, profile: "Shiraz" },
    { profile: { city: null } }, { profile: { city: { raw: 5 } } }, { profile: [] }, { char: undefined }, { nick: "" }];
  for (const s of odd) {
    const a = initAnswers("full", s, "none", []);
    assert.equal(typeof a.name, "string");
    assert.equal(typeof a.ans.city, "string");
    assert.equal(a.char === undefined, false);
  }
});

test("the name and the hometown as saved", () => {
  const a = initAnswers("edit", { nick: "Mehrad", profile: { city: { raw: "Tahran" } } }, "fa", []);
  assert.equal(a.name, "Mehrad");
  assert.equal(a.ans.city, "Tahran");
  assert.equal(initAnswers("full", { profileName: "  Nur Yılmaz " }, "en", []).name, "Nur");
});

test("the flow's language: the help language, else the browser's", () => {
  assert.equal(initAnswers("full", {}, "none", ["ru-RU", "en"]).lang, "ru");
  assert.equal(initAnswers("full", {}, "none", ["de-DE"]).lang, "en");
  assert.equal(initAnswers("full", {}, "both", ["ru"]).lang, "fa");
  assert.equal(uiLangOf("ru"), "ru");
  assert.equal(guessLang(["fa-IR"]), "fa");
});

test("every word has English, Persian and Russian", () => {
  for (const [k, w] of Object.entries(WORDS)) for (const l of ["en", "fa", "ru"] as const) assert.ok((w as Record<string, string>)[l]?.trim(), k + " has no " + l);
  assert.equal(fill("ru", "step", { i: 2, n: 9 }), "Шаг 2 из 9");
});
