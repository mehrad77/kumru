import { defineRule, ms } from "../../core/limits.ts";

export const YENI = defineRule("yeni", 120, 10 * ms.min);
export const YENI_TOKEN = defineRule("yeni-token", 20, ms.day);
export const YENI_CODE = defineRule("yeni-code", 30, 10 * ms.min);
export const YENI_CHECK = defineRule("yeni-check", 60, 10 * ms.min);
