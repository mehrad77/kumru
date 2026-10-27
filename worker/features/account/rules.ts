import { defineRule, ms } from "../../core/limits.ts";

export const SIGNUP = defineRule("signup", 5, ms.hour);
export const LOGIN_USER = defineRule("login-user", 10, 15 * ms.min);
export const LOGIN_IP = defineRule("login-ip", 30, 15 * ms.min);
export const RECOVER = defineRule("recover", 5, ms.hour);
export const PAIR = defineRule("pair", 10, ms.hour);
