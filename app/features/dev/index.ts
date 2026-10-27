// The dev feature: what only a developer opens. The `/kerim` gallery (every mood and size of Kerim, for review screenshots). The
// dev switches themselves (?as=, ?fresh, ?learner, ...) run before the page boots, so their code stays in host/dev.ts; README.md
// lists them with `POST /api/dev/login`, whose server half is worker/features/dev.
import type { WebFeature } from "../../core/feature.ts";

export const feature: WebFeature = {
  id: "dev",
  open: { kerim: { open: () => void import("./gallery.ts").then((m) => m.kerimGallery()) } },
};
