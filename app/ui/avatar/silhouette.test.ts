// node --test app/ui/avatar/silhouette.test.ts. Run by `pnpm test`: the generated silhouette and onboarding's cast heads are current.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FILES } from "../../../scripts/avatar-art.ts";

for (const f of FILES) {
  test(`${f.path} is current (node scripts/avatar-art.ts)`, () => {
    assert.equal(readFileSync(new URL(`../../../${f.path}`, import.meta.url), "utf8"), f.text());
  });
}

test("onboarding's cast: every character of ONBOARDING_CAST, in order, and small", async () => {
  const { castShown, CAST_SHOWN, ONBOARDING_CAST } = await import("../../../scripts/avatar-art.ts");
  const cast = castShown();
  assert.deepEqual(cast.map((c) => c.id), ONBOARDING_CAST.slice(0, CAST_SHOWN));
  for (const c of cast) assert.ok(c.kind === "cast" && c.avatar, c.id);
  assert.ok(readFileSync(new URL("../../features/onboarding/cast.gen.ts", import.meta.url)).length < 45_000, "cast.gen.ts stays small");
});
