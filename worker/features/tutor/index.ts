/* The tutor feature: the tutor document (mistakes, tries, talk) served at /api/doc/tutor, and the paid-tier hook /api/ai
   (docs/SPECS.md section 10.7). No tables of its own: the document lives in `docs`. */
import type { ServerFeature } from "../../core/feature.ts";
import { ai } from "./routes.ts";

export const feature: ServerFeature = {
  id: "tutor",
  routes: [["POST", "/api/ai", ai]],
  docs: { kinds: { tutor: { limit: 64 * 1024, keys: new Set(["mistakes", "tries", "talk"]) } } },
};
