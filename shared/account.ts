/* Account routes (docs/SPECS_API.md section 4): sign up, sign in, recover, pair, sessions. */
import type { Session, User } from "./core.ts";

export interface Signup { username: string; password: string; turnstile?: string; tz?: string; label?: string }
export interface SignupOk { token: string; user: User; recovery: string }
export interface Login { username: string; password: string; tz?: string; label?: string }
export interface LoginOk { token: string; user: User; restored?: boolean }
export interface Recover { username: string; recovery: string; password: string; tz?: string; label?: string }
export interface Password { current: string; next: string }
export interface Me { user: User; session: { id: string }; sessions: Session[] }
export interface PairStartOk { code: string; expires: number }
export interface PairClaim { code: string; tz?: string; label?: string }
