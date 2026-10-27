import { defineRule, ms } from "../../core/limits.ts";

export const SEARCH = defineRule("search", 60, 15 * ms.min);
