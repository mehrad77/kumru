# Accounts and connecting the reader

How signing in works across Kumru and Notebook (a separate, private repo), and why it is built this way. The exact routes, tables and limits live in [SPECS_API.md](SPECS_API.md) and [SPECS_SCHEMA.md](SPECS_SCHEMA.md); this file explains them and links there rather than copying them. A change to any flow below changes those specs in the same commit.

## 1. Overview

- **Kumru** (this repo, turk.shab.boo) is the only server and the only owner of accounts: a Cloudflare Worker with D1.
- **Notebook** (yeni.shab.boo) is a static site with no server of its own (its `docs/NOTEBOOK.md`, in the course repo). It works fully without an account. A learner who wants their notebook on several devices *connects* the reader to a Kumru account.

There are two kinds of credential, and neither ever works where the other does:

| Credential | Held by | Works on | Lifetime | Stored server-side as |
|---|---|---|---|---|
| **Session token** | the Kumru page (`localStorage['kumru:session']`) | every Kumru `/api` route except the reader's | 90 days, sliding | SHA-256 in `sessions` |
| **Reader token** | the reader (`localStorage['yi:sync']`) | `GET`/`PUT /api/yeni/doc`, `DELETE /api/yeni/token`, `GET /api/yeni/check` | until revoked | SHA-256 in `yeni_tokens` |

Data flows one way. The Kumru page may read the learner's own notebook with its session (`GET /api/yeni/notebook`, read-only) to show book progress and suggest checkpoints; a reader token never reaches Kumru data. The reader's exam-practice room (a Worker on the reader's origin, in the course repo) gives AI essay feedback only to connected learners: it sends the reader token once to `GET /api/yeni/check` through a service binding and keeps only the answer, an opaque id that names no account ([SPECS_API.md](SPECS_API.md) §11a). Teachers see book progress only for members who switched book sharing on in that class ([SPECS.md](SPECS.md) §10.3).

Both are 32 random bytes, base64url, sent as `Authorization: Bearer …`. Neither is a cookie, so there is no CSRF surface on the API, and Kumru's session never leaves turk.shab.boo.

## 2. Kumru accounts

Routes: [SPECS_API.md](SPECS_API.md) §4 (and `POST /api/delete`, §8). Tables: [SPECS_SCHEMA.md](SPECS_SCHEMA.md) §2.1 `users`, §2.2 `sessions`, §2.6 `pairings`, §2.7 `limits`. Code: `worker/features/account/`.

| Action | What it does | Sessions | Reader tokens |
|---|---|---|---|
| **Sign up** | username (3–24 of `a–z 0–9 _ .`), password (≥ 8), Turnstile. Shows a recovery code **once**. | +1 | — |
| **Sign in** | username + password; restores an account deleted in the last 7 days | +1 | — |
| **Recover** | username + recovery code + new password; shows a new code | all ended, +1 | **all revoked**, unused codes deleted |
| **Add a phone** | a signed-in device shows a QR / 12-character code (5 min, single use); the new phone claims it | +1 | — |
| **Change password** | current + new | all but this one ended | **all revoked**, unused codes deleted |
| **Sign out / remove a device** | | that one ended | — |
| **Delete account** | soft delete, purged after 7 days | all ended | **all revoked**, unused codes deleted |

Passwords are PBKDF2-SHA-256 with a salt and the `PEPPER` secret; recovery and pairing codes are stored as HMAC-SHA-256(`PEPPER`, code). Brute force is bounded by the rate limits in [SPECS_API.md](SPECS_API.md) §1.7 (`signup`, `login-user`, `login-ip`, `recover`, `pair`, `anon`).

The sign-in gate is the only thing a visitor without a session sees. It keeps the URL it was opened on, so a deep link (a class, a friend invite, `/connect/yeni`) continues after signing in.

## 3. Connecting the reader

The flow is OAuth 2.0's **authorization code with PKCE**, cut down to one first-party client. Routes: [SPECS_API.md](SPECS_API.md) §11a. Tables: [SPECS_SCHEMA.md](SPECS_SCHEMA.md) §2.10a (`yeni_tokens`, `yeni_codes`). Code: `worker/features/yeni/` and, in the reader (course repo), `src/lib/notebook/sync.ts` and `pkce.ts`.

```mermaid
sequenceDiagram
    autonumber
    actor L as Learner
    participant R as Reader (yeni.shab.boo)
    participant P as Kumru page (turk.shab.boo)
    participant W as Kumru Worker

    L->>R: Ayarlar → Connect with Kumru
    R->>R: state, verifier = random 32 bytes<br/>challenge = b64url(SHA-256(verifier))<br/>keep {state, verifier, return} (30 min)
    R->>P: /connect/yeni?return&state&code_challenge&code_challenge_method=S256
    opt signed out
        P->>L: gate with a Notebook banner
        L->>P: sign in / sign up (URL kept)
    end
    P->>W: GET /api/yeni/origins
    P->>L: consent sheet (account, what the reader can and can't reach)
    alt Allow
        P->>W: POST /api/yeni/codes {return, challenge} (session)
        W-->>P: {code} (5 min, single use, stored as HMAC)
        P->>R: return#yk_code=code&state=state
        R->>R: state matches the kept one?
        R->>W: POST /api/yeni/token {code, verifier, return, label}
        W->>W: consume code; SHA-256(verifier) = challenge?<br/>return = stored return?
        W-->>R: {token, username}
        R->>W: GET / PUT /api/yeni/doc (Bearer token)
    else Cancel or close
        P->>R: return#yk_error=denied&state=state
    end
```

**Parameters.**

| Name | Where | Shape |
|---|---|---|
| `return` | query on `/connect/yeni`; body of `/codes` and `/token` | `http(s)` URL whose origin is in `YENI_ORIGINS`; no fragment; must be identical at exchange |
| `state` | query; back in the fragment | 16–128 base64url characters (the reader sends 43) |
| `code_challenge` | query; body of `/codes` | 43 base64url characters, `b64url(SHA-256(verifier))` |
| `code_challenge_method` | query | `S256` only |
| `code` | fragment `yk_code`; body of `/token` | 43 base64url characters, 5 minutes, one use |
| `verifier` | body of `/token` only | 43–128 of `[A-Za-z0-9._~-]` |
| `label` | body of `/token` | ≤ 40 characters, e.g. "Safari · iPhone", shown in Kumru's connections list |

**Why the fragment, not the query.** The reader is static files on Cloudflare; a query string would reach its access logs and any analytics, a fragment reaches no server. The reader removes the parameters from the address bar (`history.replaceState`) before doing anything else.

**What the reader shows.** `connected` (a "Connected as @name" notice), `denied` (the learner cancelled), `stale` (no matching `state`: an old tab, another browser, or more than 30 minutes; the learner is asked to connect again and nothing is called), `failed` (Kumru unreachable; try again).

## 4. Threat model

| Threat | Defence |
|---|---|
| **A forged return link plants an attacker's account** in the learner's reader (login CSRF), so the learner's notebook syncs to the attacker | `state`: the reader only acts on a fragment whose `state` it generated and still holds; it is consumed once. |
| **The code leaks** (history, a browser extension, a screen share, a referrer) | PKCE: the code is useless without the verifier, which never leaves the reader's storage; it also expires in 5 minutes and works once. |
| **The token leaks through a URL** | It never appears in one: it only comes back in the body of a cross-origin `POST`. |
| **A look-alike site asks for a code** | `return` must be on an origin in `YENI_ORIGINS` (checked by the page *and* the Worker) and the exchange must name the same `return`. Other origins get an error page and no redirect. |
| **Another site calls the API from a learner's browser** | No cookies; CORS is sent only for `YENI_ORIGINS` and only on `/api/yeni/doc` and `/api/yeni/token`. A session token is refused on reader routes and a reader token everywhere else. |
| **A database or backup leaks** | Tokens are stored as SHA-256, codes and recovery codes as HMAC with the `PEPPER` secret, passwords as peppered PBKDF2. |
| **Guessing codes or tokens** | 256 random bits each, plus the `yeni-code` (per IP) and `anon` rate limits. |
| **A stolen password** | Changing it, or using the recovery code, ends every other session and disconnects every reader. |
| **A runaway or hostile reader** | The `yeni` limit (120 requests per 10 minutes), a 1-second minimum between saves, and the 512 KiB cap. |
| **The token check is used to learn about an account** | `GET /api/yeni/check` answers only an HMAC of the user id (no username, no data), sends no CORS headers, and is limited per learner (`yeni-check`, 60 per 10 minutes). |

**Not covered.** Script injection on yeni.shab.boo could read the reader token from `localStorage`; the token only reaches that learner's notebook document, and the learner can revoke it from Kumru. The same holds for the Kumru page and its session token. Both sites ship no third-party scripts except Turnstile on the Kumru gate.

## 5. Reader token lifecycle

- **Issued** by the exchange. A learner has at most 10; the eleventh deletes the oldest.
- **Used** on every sync request, and when the exam room checks it (`GET /api/yeni/check`); `last_used_at` moves at most once a day.
- **Listed** in Kumru → Profile → Account → *Notebook*, with its label and dates.
- **Ends** when the reader disconnects (`DELETE /api/yeni/token`), the learner disconnects it in Kumru, the password changes, the recovery code is used, the account is deleted, or it is the oldest of eleven.
- **In the reader**, a `401` clears the token and shows "your Kumru connection ended" with the likely reasons, on any page. The local notebook is untouched; connecting again merges it with the account's copy.

## 6. How this differs from OAuth 2.0 / OpenID Connect

- One built-in client, no client registration or `client_id`: the client is identified by its origin in `YENI_ORIGINS`.
- One fixed scope (the reader notebook); no consent per scope.
- No refresh tokens: the access token lives until revoked, and the learner sees and controls every one.
- No ID token or user-info endpoint: the exchange returns the username, which is all the reader shows.
- The code comes back in the fragment instead of the query (§3).

If a third app ever needs Kumru accounts, or anyone outside these two apps builds a client, move to a real OAuth 2.1 / OIDC provider (registered clients, scopes, discovery) instead of stretching this flow.

## 7. Local development

- `pnpm dev` here serves Kumru on `:8787`; `.dev.vars` sets `YENI_ORIGINS` to include `http://localhost:4330` and leaves Turnstile off. `pnpm seed` once, then `?as=<username>` signs in a seeded account without a password (`worker/seed/README.md`).
- `pnpm reader dev` in the course repo serves the reader on `:4330`. Point it at the local Kumru with its dev-only `localStorage` override (the reader's README names it; production uses `PUBLIC_KUMRU_ORIGIN`, default `https://turk.shab.boo`).
- Start a connection from the reader's Ayarlar; a hand-made `/connect/yeni` link needs a `state` and a challenge, and its code cannot be exchanged without the matching verifier.

Tests that cover these flows:

| Test | Covers |
|---|---|
| `worker/features/account/auth.test.ts` and friends | sign up, sign in, recover, pairing, password change, limits |
| `worker/features/yeni/yeni.test.ts` | codes, the exchange (wrong verifier, reused or expired code, other `return`), CORS, tokens, the token check, revocation, export and delete |
| `smoke/connect.spec.ts` | the browser flow: gate, consent, Allow, Cancel, closing the sheet, a bad link |
| the reader's `src/lib/notebook/sync.test.ts`, `pkce.test.ts` (course repo) | the reader: connect URL, `state` checks, exchange, sync, `401`, disconnect |

## 8. Adding another client

1. Decide whether it should be a client of this flow at all (§6).
2. Add its origin to `YENI_ORIGINS`, or better a separate var and token table if it reaches different data; a reader token must never open a second kind of document.
3. Write its routes into [SPECS_API.md](SPECS_API.md) and its tables into [SPECS_SCHEMA.md](SPECS_SCHEMA.md) first, then its types in `shared/<feature>.ts` (re-exported by `shared/api.ts`), a migration and tests, in one commit.
4. Give it its own consent copy that says exactly what it can reach.
