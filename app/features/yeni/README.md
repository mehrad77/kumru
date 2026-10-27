# yeni

Notebook (yeni.shab.boo) as Kumru sees it. Server half: `worker/features/yeni`; contract: `shared/yeni.ts`; routes: docs/SPECS_API.md section 11a; the flow (code + PKCE): docs/AUTH.md.

| | |
|---|---|
| Tabs | none |
| Slots | fills `accountRows` (order 10: `AccountRow`), `profileCards` (order 100: `Promo`, the last card of the Profile grid) and `pathBanners` (order 10: `PathBits`, the Path's book box) |
| Deep links | `unit` (`/unit/<REF>`, `WebFeature.open`): the Path scrolled to that unit, via `bookPathReveal` from the path feature. `/connect/yeni?return=&state=&code_challenge=&code_challenge_method=S256` is not a router key: the `gated` boot handler opens `openConnect()` (and `gateNote()` in the sign-in gate); the URL stays held (`holdUrl`) until the sheet is answered |
| Screens | `ConnectSheet.tsx` (the consent sheet and its invalid-link / failure views), `Connections.tsx` (Account card → connected readers, Disconnect through `confirmSheet`), `AccountRow.tsx` (the Account card's row), `Promo.tsx` (the Profile banner), `PathBits.tsx` (the Path's "In the book" line and checkpoint / jump offers, a `pathBanners` fill; it asks `bookEnsure()` each time the Path draws), `ClassBook.tsx` (a class member's shared book summary, for the class pages), `Mark.tsx` (the "Yİ" mark), `sheets.ts` (opens the sheets; DOM only) |
| State | `book.ts`: the notebook model (`model` signal), `bookEnsure` (cached first, refetched at most every 10 minutes for a linked account, once a day to find out whether there is one; nothing polls), `bookLinked` (`prefs.yeniLinked`), `bookPayload` / `bookSent` (the `book` summary riding with a progress save while a class shares it), `bookDismiss` (`prefs.bookDismiss`). `state.ts`: the connection count signal, `meReady` (the `identity` boot handler resolves it; the consent sheet waits for the session's name) |
| Routes | `api.ts`: `origins`, `parseConnect` (pure), `code`, `list`, `revoke`, `notebook()` and `cached()` (rev-cached under `kumru:yeni:uid`, `:rev`, `:doc`; cleared on sign-out by `host/transport.ts`) |
| Model | `model/book.ts` (the notebook as a model, the shared summary, the offers), `model/classbook.ts`, `model/reader.ts` (`READER`, `readerSlug`, `readerUrl`), `model/format.ts` |
| Hooks | a progress save hook (`addSaveHook` from the progress feature) adds `book` to the save; `onPasswordChanged` zeroes the connection count |
| CSS | `yeni.css`: `yk-*` and `bk-*`. The Path's `bk-flash` rule is in `path.css` beside the Path code that applies it; `cl-b*` (class book chips) are in the classes feature's `classes.css` |

Consent behaviour is covered by `smoke/connect.spec.ts`: Cancel, the X, Escape and the backdrop deny (`#yk_error=denied&state=`); Allow goes back with `#yk_code=<code>&state=`; a link that fails `parseConnect` shows both languages and no redirect.

## Boot

- `gated` phase: `/connect/yeni` signed out opens the sign-in gate with `gateNote()`, signed in opens `openConnect()` at once; `identity` phase: `meDone()` (the session's name is known).

## What this feature calls in other features

`bookPath()`, `bookPathAct(ref, kind)`, `bookPathReveal(ref)` from the path feature (the Path's lock rules and buttons, `app/features/path/book.ts`); the classes that share the book summary come from the classes feature (`bookClasses`).

Other features use `index.ts`: `READER`, `readerSlug`, `readerUrl` (the words feature links a card to the reader), `loadClassBookBox` and `loadClassBookLine` (the classes feature shows a member's shared book progress).
