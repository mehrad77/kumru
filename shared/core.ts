/* Shared by every feature: the error codes and envelope, the user and session shapes, health. */

export type ErrorCode =
  | "invalid" | "invalid_grant" | "unauthorized" | "forbidden" | "not_found" | "taken" | "conflict" | "gone"
  | "too_large" | "upgrade_required" | "rate_limited" | "payment_required" | "not_implemented"
  | "quota_exceeded" | "internal"
  | "offline" | "aborted";                       // client-only
export interface ApiError { error: { code: ErrorCode; message: string; field?: string; retryAfter?: number;
  rev?: number; updated?: number; body?: unknown; requestId?: string } }
export type Role = "learner" | "owner";
export type Plan = "free";                        // later tiers extend this union
export interface User { id: string; username: string; role: Role; plan: Plan; created?: number; tz?: string }
export interface Session { id: string; label: string; created: number; refreshed: number }
export interface Health { ok: boolean; version: string; time: number; db?: boolean }
