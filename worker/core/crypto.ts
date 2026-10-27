/* Hashing and codes (docs/SPECS.md section 8.3, docs/SPECS_API.md section 1.2). Web Crypto only. */
const enc = new TextEncoder();

export type Bytes = Uint8Array<ArrayBuffer>;

export const CODE_ABC = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // the page's FR_ABC
const B32 = "abcdefghijklmnopqrstuvwxyz234567";

export function randomBytes(n: number): Bytes {
  return crypto.getRandomValues(new Uint8Array(n));
}

/** Lower-case base32 of `bytes` random bytes (user ids: 16 → 26 chars). */
export function randomBase32(bytes: number): string {
  const b = randomBytes(bytes);
  let bits = 0, value = 0, out = "";
  for (const x of b) {
    value = (value << 8) | x;
    bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

/** `n` characters of the friend-code alphabet, uniformly (rejection sampling). */
export function randomCode(n: number): string {
  let out = "";
  while (out.length < n) {
    for (const x of randomBytes(n * 2)) {
      if (x < 248 && out.length < n) out += CODE_ABC[x % 31];
    }
  }
  return out;
}

export function b64url(bytes: Bytes): string {
  let s = "";
  for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256(data: string | Bytes): Promise<Bytes> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", typeof data === "string" ? enc.encode(data) : data));
}

export async function hmac(key: string, data: string): Promise<Bytes> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}

export async function pbkdf2(password: string, pepper: string, salt: Bytes, iterations: number): Promise<Bytes> {
  const k = await crypto.subtle.importKey("raw", enc.encode(password + "\u0000" + pepper), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, k, 256));
}

/** Constant-time comparison of two byte strings. */
export function equalBytes(a: Bytes, b: Bytes): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

/** D1 returns BLOB columns as number[] or ArrayBuffer. */
export function bytesOf(v: unknown): Bytes {
  if (v instanceof Uint8Array) return new Uint8Array(v);
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  if (Array.isArray(v)) return new Uint8Array(v);
  throw new Error("not a blob");
}
