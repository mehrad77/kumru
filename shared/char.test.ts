// node --test shared/char.test.ts. Run by `pnpm test`.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { charProblem } from "./char.ts";
import { castPartsText } from "../scripts/cast-parts.ts";

const AV = { v: 1, kit: "sahne-kit@1", body: { build: "adult", height: 0.5, shape: "average" }, skin: "skin_04", face: {},
  hair: { style: "hair_short", color: "hair_02" }, outfit: { top: { id: "top_tee" } } };

test("cast-parts.gen.ts is current (node scripts/cast-parts.ts)", () => {
  assert.equal(readFileSync(new URL("./cast-parts.gen.ts", import.meta.url), "utf8"), castPartsText());
});

test("charProblem accepts none, legacy and a learner's avatar", () => {
  for (const c of [null, undefined, {}, { skin: 2 }, AV, { ...AV, outfit: { top: { id: "a_part_from_a_later_kit" } } }]) {
    assert.equal(charProblem(c), null, JSON.stringify(c));
  }
});

test("charProblem refuses bad shapes, big documents, cast parts, author fields and other kits", () => {
  for (const c of ["x", { skin: "1" }, { ...AV, pad: "x".repeat(2100) }, { ...AV, outfit: { top: { id: "top_shirt_uniform" } } },
    { ...AV, wear: { waist: { id: "apron_pockets" } } }, { ...AV, custom: [] }, { ...AV, kit: "other@1" }]) {
    assert.ok(charProblem(c), JSON.stringify(c).slice(0, 80));
  }
});
