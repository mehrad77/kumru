// Expected values were produced by the implementation these helpers replaced, so a change here is a
// change in how Persian text is laid out.
import assert from "node:assert/strict";
import { test } from "node:test";
import { bidiTxt, faTxt } from "./i18n.ts";

const cases: [input: string, bidi: string, fa: string][] = [
  ["hello", "hello", "⁦hello⁩"],
  ["سلام", "⁨سلام⁩", "سلام"],
  ["hello سلام world", "hello ⁨سلام⁩ world", "⁦hello⁩ سلام ⁦world⁩"],
  ["Turkish: سلام دنیا", "Turkish: ⁨سلام دنیا⁩", "⁦Turkish⁩: سلام دنیا"],
  ["a · چیزی · b", "a · ⁨چیزی⁩ · b", "⁦a⁩ · چیزی · ⁦b⁩"],
  ["سلام (-iyor) bir", "⁨سلام (-iyor) bir⁩", "سلام ⁦(-iyor) bir⁩"],
  ["-(I)yor فعل است", "-(I)yor ⁨فعل است⁩", "⁦-(I)yor⁩ فعل است"],
  ["گذشته · past\nدوم", "⁨گذشته⁩ · past\n⁨دوم⁩", "گذشته · ⁦past⁩\nدوم"],
  ["  سلام  ", "  ⁨سلام⁩  ", "  سلام  "],
  ["", "", ""],
  ["x⁨y سلام", "x⁨y سلام", "x⁨y سلام"],
];

test("bidiTxt isolates each Persian run", () => {
  for (const [input, bidi] of cases) assert.equal(bidiTxt(input), bidi, JSON.stringify(input));
});

test("faTxt isolates each Latin run in Persian text", () => {
  for (const [input, , fa] of cases) assert.equal(faTxt(input), fa, JSON.stringify(input));
});

test("text that is already isolated, and things that are not text, pass through", () => {
  assert.equal(bidiTxt(bidiTxt("hello سلام")), bidiTxt("hello سلام"));
  assert.equal(faTxt(faTxt("hello سلام")), faTxt("hello سلام"));
  assert.equal(bidiTxt(12), 12);
  assert.equal(faTxt(null), null);
});
