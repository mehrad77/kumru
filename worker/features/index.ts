// The server feature list, in route order (a test checks that no route is shadowed). A new backend is a folder under features/ and
// one line here.
import type { ServerFeature } from "../core/feature.ts";
import { feature as account } from "./account/index.ts";
import { feature as classes } from "./classes/index.ts";
import { feature as dev } from "./dev/index.ts";
import { feature as friends } from "./friends/index.ts";
import { feature as owner } from "./owner/index.ts";
import { feature as progress } from "./progress/index.ts";
import { feature as reminders } from "./reminders/index.ts";
import { feature as tutor } from "./tutor/index.ts";
import { feature as yeni } from "./yeni/index.ts";

export const FEATURES: ServerFeature[] = [account, progress, friends, classes, reminders, owner, tutor, yeni, dev];
