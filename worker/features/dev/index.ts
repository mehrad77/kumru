/* The dev feature: POST /api/dev/login, a sign-in without a password for the seeded accounts. Answers 404 unless DEV is "1". */
import type { ServerFeature } from "../../core/feature.ts";
import { devLogin } from "./routes.ts";

export const feature: ServerFeature = { id: "dev", routes: [["POST", "/api/dev/login", devLogin]] };
