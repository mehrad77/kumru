/* Web Push for Workers (RFC 8030 + RFC 8291 aes128gcm + RFC 8292 VAPID), Web Crypto only. The VAPID keys:
   VAPID_PUBLIC is the uncompressed P-256 public point (65 bytes, base64url); VAPID_PRIVATE is the private
   scalar `d` (32 bytes, base64url). `node scripts/vapid.mjs` makes a pair. */
import { b64url, randomBytes } from "../../core/crypto.ts";
import type { Env } from "../../core/env.ts";

const enc = new TextEncoder();
const fromB64url = (s: string): Uint8Array<ArrayBuffer> => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "="));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const concat = (...p: Uint8Array[]): Uint8Array<ArrayBuffer> => {
  const out = new Uint8Array(p.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of p) { out.set(x, o); o += x.length; }
  return out;
};

async function hkdf(salt: Uint8Array<ArrayBuffer>, ikm: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>, bytes: number) {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, bytes * 8));
}

/** The encrypted aes128gcm body for one push message (RFC 8291). */
export async function encryptPayload(sub: { p256dh: string; auth: string }, payload: string): Promise<Uint8Array<ArrayBuffer>> {
  const uaPub = fromB64url(sub.p256dh), authSecret = fromB64url(sub.auth);
  const asKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", asKeys.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asKeys.privateKey, 256));
  const ikm = await hkdf(authSecret, shared, concat(enc.encode("WebPush: info\0"), uaPub, asPub), 32);
  const salt = randomBytes(16);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const data = concat(enc.encode(payload), new Uint8Array([2]));   // 0x02: last record, no padding
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, data));
  const header = concat(salt, new Uint8Array([0, 0, 0x10, 0]), new Uint8Array([asPub.length]), asPub);   // record size 4096
  return concat(header, cipher);
}

/** A VAPID Authorization header value for the push service of `endpoint`. */
export async function vapidAuth(env: Env, endpoint: string, now = Date.now()): Promise<string> {
  const pub = fromB64url(env.VAPID_PUBLIC);
  const jwk = { kty: "EC", crv: "P-256", d: env.VAPID_PRIVATE, x: b64url(pub.slice(1, 33)), y: b64url(pub.slice(33, 65)) };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const head = b64url(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64url(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: "mailto:kumru@shab.boo" })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${head}.${claims}`)));
  return `vapid t=${head}.${claims}.${b64url(sig)}, k=${env.VAPID_PUBLIC}`;
}

/** Send one push. Resolves with the push service's status; 404 and 410 mean the subscription is dead. */
export async function sendPush(env: Env, sub: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: object): Promise<number> {
  const body = await encryptPayload(sub.keys, JSON.stringify(payload));
  const r = await fetch(sub.endpoint, {
    method: "POST", body,
    headers: { Authorization: await vapidAuth(env, sub.endpoint), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "43200", Urgency: "low" },
  });
  return r.status;
}
