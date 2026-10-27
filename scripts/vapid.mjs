// `node scripts/vapid.mjs`: make a VAPID key pair for Web Push reminders (docs/SPECS.md section 10.6).
// Put the public key in wrangler.jsonc vars (VAPID_PUBLIC) and the private one in a secret:
//   pnpm exec wrangler secret put VAPID_PRIVATE
import { generateKeyPairSync } from "node:crypto";

const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const jwk = privateKey.export({ format: "jwk" });
const pub = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, "base64url"), Buffer.from(jwk.y, "base64url")]);
void publicKey;
console.log("VAPID_PUBLIC =", pub.toString("base64url"));
console.log("VAPID_PRIVATE =", jwk.d);
