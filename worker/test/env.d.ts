/* The test env is the Worker's Env (worker/core/env.ts). */
declare namespace Cloudflare {
  interface Env {
    ASSETS: Fetcher;
    DB: D1Database;
    BACKUPS: R2Bucket;
    DEV: string;
    MIN_CLIENT: string;
    PBKDF2_ITER: string;
    TURNSTILE_SITE_KEY: string;
    VAPID_PUBLIC: string;
    YENI_ORIGINS: string;
    VAPID_PRIVATE: string;
    PEPPER: string;
    TURNSTILE_SECRET_KEY: string;
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}

// the registry test reads wrangler.jsonc as text
declare module "*?raw" {
  const text: string;
  export default text;
}
