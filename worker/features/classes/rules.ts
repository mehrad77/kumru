import { defineRule, ms } from "../../core/limits.ts";

export const CLASS_CREATE = defineRule("class-create", 5, ms.day);
export const CLASS_JOIN = defineRule("class-join", 20, ms.day);
