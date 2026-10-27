// The grammar feature: the lesson page (/lesson/<id>), its blocks (tables, suffix chains, comparisons, slots, tips) and the
// interactive boxes (vowel harmony, noun, cases, verb, clock, "where is the cat?", quiz). No tab, no server half. The Turkish
// morphology engine behind the boxes and the drills is app/lib/morphology.ts.
import type { WebFeature } from "../../core/feature.ts";
import { S } from "../../core/store.ts";
import { lessonId, openLesson } from "./lesson.ts";

export { closeLesson, lessonOrder, lessonTitle, openLesson } from "./lesson.ts";
export { mEl, morph, quizLine, renderBlock } from "./dom.ts";

export const feature: WebFeature = {
  id: "grammar",
  // /lesson/<id> opens once the lessons have loaded; while the page is open the address bar shows it
  open: { lesson: { open: openLesson, needs: () => S.gLoaded && S.grammar.length > 0, exists: (id) => S.grammar.some((g: { id: string }) => g.id === id), gone: ["That lesson doesn't exist.", "path"] } },
  url: [{ priority: 30, current: () => (lessonId.value ? "/lesson/" + lessonId.value : null) }],
};

