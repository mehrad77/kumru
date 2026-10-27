/* Bindings, vars and secrets of the yakerim Worker (wrangler.jsonc, docs/SPECS.md section 3). */
export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  BACKUPS: R2Bucket;
  /** "1" under `wrangler dev` (.dev.vars), never in production: enables /api/dev/* and dev-only behaviour. */
  DEV: string;
  /** Page versions the API refuses with 426 upgrade_required, comma-separated (docs/SPECS_API.md section 1.6). */
  MIN_CLIENT: string;
  /** PBKDF2 iterations for new password hashes; stored per user in users.pw_iter. */
  PBKDF2_ITER: string;
  /** Public Turnstile site key; empty disables the signup check (wrangler dev only). */
  TURNSTILE_SITE_KEY: string;
  /** Origins of Notebook, comma-separated: the only `return` targets of /connect/yeni and the only
   * origins the /api/yeni bearer routes answer with CORS (docs/SPECS_API.md section 11a). */
  YENI_ORIGINS: string;
  /** Public VAPID key (base64url, uncompressed P-256 point) for Web Push. */
  VAPID_PUBLIC: string;
  /** Secrets (wrangler secret put). */
  VAPID_PRIVATE: string;
  PEPPER: string;
  TURNSTILE_SECRET_KEY: string;
}
