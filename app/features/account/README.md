# account

The sign-in gate and everything about the account itself (docs/SPECS.md section 8). Server half: `worker/features/account`; contract: `shared/account.ts`; routes: docs/SPECS_API.md section 4.

| | |
|---|---|
| Tabs | none |
| Deep links | `/pair/<code>` (and the old `#pair=<code>`): claimed at load by `claimPairingFromLink` (api.ts), then the page reloads signed in |
| Slots | fills `profileCards` (order 10): `AccountCard`. Provides `accountRows` (after the devices row; Notebook connections row) |
| Screens | `Gate.tsx` (the sign-in gate), `AccountCard.tsx` (Profile), `sheets.tsx` (create an account with the Turnstile check, sign in, recovery code, add this phone with a code, change password, add a phone (QR), signed-in devices, sign out, delete), `forms.tsx` (`AccForm`, `Loading`, `SheetError`, `BusyButton`) |
| State | `state.ts`: `flags.recoveryOpen` (the recovery sheet is up, so the gate's reload poll waits) and the password-changed hooks |
| Routes | `api.ts`: signup, login, recover, logout, password, devices (`GET /api/me`), revoke, pair start/claim, export, delete; `turnstile()`; `qrSvg()` loads `vendor/qrcode.js` lazily |
| Storage | `kumru:session`, `kumru:me` (through host/transport and host/storage); `sessionStorage` `kumru:welcome` (the hello after the reload, `welcome.ts`) |
| CSS | `account.css` (`acc-field`, `acc-ferr`, `pw-*`, `acc-links`, `acc-ts`, `acc-check`, `acc-lock`, `acc-code`, `acc-qr`, `sheet-locked`, `gate-*` except `gate-ctx*`). The shared sheet form (`acc-form`, `acc-err`, `acc-dev`, `acc-actions`, `acc-loading`, `spin`, `btn.busy`) is in `app/styles/components.css` (`ui/sheet.ts` and other features use it) |

Sign-in of any kind reloads the page, so boot runs once with the new identity. The recovery sheet can't be dismissed until "I've saved it" is ticked (`_onDismiss` on its backdrop, no X).

## Boot

At the `gated` phase (`core/boot.ts`): with no session it opens the gate (on `/connect/yeni` the yeni feature does, with `gateNote()` above the buttons); with one it shows `takeWelcome()`'s greeting.

Other features use `index.ts`: `accForm(title, fields, submit, action, options)`: the class join sheet of the classes feature, with `values` for a prefilled code.

Other features use `index.ts`: `accErr`, `logout`, `onPasswordChanged` (the yeni feature's consent sheet and connections), `takeWelcome`.
