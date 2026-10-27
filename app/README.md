# Kumru `app/`: the browser app

`app/` is Kumru's frontend, organised by **feature**. Every screen is a Preact feature under `features/<id>/`. A feature that needs the server has a mirrored half in `worker/features/<id>/` ([worker/README.md](../worker/README.md)) and a contract in `shared/<id>.ts`, all under the same id.

Nothing else draws the page: `index.html` is the shell (app bar, tab panels, `#session`, toast) and `main.ts` is the one script. The refactor that got here: `~/.claude/plans/plan-for-a-refactor-tender-zephyr.md`.

Stack: TypeScript, Preact + `@preact/signals`, Vite (with `@cloudflare/vite-plugin`), plain CSS.

## Layout

```text
app/
  main.ts          boot (no top-level await): styles → host → router, overlay and sheets wired → features → `startBoot` (core/startup.ts walks the boot phases of core/boot.ts)
  core/            the shell, which knows no feature: feature registry, slots, route (parseRoute: the frozen URL scheme), router (tabs, deep links, URL), overlay (full-screen page history), boot phases (boot.ts) and the start of the page (startup.ts), content (the collections as `S.cards`...), store, i18n, dom, shell/ (app bar user chip, status line)
  host/            network and platform only: transport, storage, sync (DocSync), content (collections as signals), pwa, sw.ts, lib (lazy chunks)
  ui/              the shared kit: toast, sheet (labSheet, confirmSheet, closeSheet), motion (fly), speech (voice, mic), kerim/ (art, moods, bubble, kerim.css), settings (SetCard, SetRow, Switch), Icon, Speak (SpeakBtn), Seg (a segmented control), TypeAids (the Turkish-letter row and the mic for a typing box), share (shareLink), open (`openIsland`/`mountInto`: a sheet or a host whose body is a Preact component), mount (`mountIsland` puts a component into a DOM-built host that unmounts itself when the host leaves the document; Preact-free until called), island (`BuiltNode` shows a node a plain DOM function built inside a Preact tree), Pup, Lazy (a component another feature offers as `() => import(...)`), Slot (draws a slot's fills), later (invite links wait for the onboarding), people.css (person rows and board lists shared by Friends, Classes and Owner); avatar/ (every character the page draws: `portrait.ts` the facade over the lazy Sahne portraits in `lib/avatar.ts`, `silhouette.gen.ts` (scripts/avatar-art.ts), `Avatar.tsx`, `avatar.css`); later more Preact components (Button, Card, …)
  lib/             app-agnostic pure helpers (Turkish text, the morphology engine, random, dates, edit distance, `units.ts` the course's unit table, `progress.ts` the confidence and calendar arithmetic, `char.ts`); candidates for packages (sahne/packages/README.md)
  styles/          base.css (tokens, theme, app bar, buttons, cards; `@layer base`), components.css (the rules several screens share: rings, tiles, panels, the session shell, sheets, forms; `@layer components`)
  features/
    index.ts       the feature list, in tab order
    <id>/          one feature (anatomy below)
```

## Anatomy of a feature

```text
features/<id>/
  index.ts         the public surface: `feature` (a WebFeature) plus the few functions other features may call.
                   Metadata and load() thunks only: no CSS, no .tsx, no top-level use of another feature.
  README.md        what it owns: tabs, deep links, slots it fills or provides, state, routes, tables,
                   storage keys, its worker/ and shared/ halves
  state.ts         its signals; this feature is their only writer
  api.ts           the client for its routes, built on host/transport
  *.tsx            components; the lazily loaded component imports the CSS
  <prefix>.css     the feature's styles, every class under its prefix (fr-, cl-, bk-, onb-, ow-, …)
  model/           pure logic: no DOM, no signals, state passed in; each module has a *.test.ts
```

A feature needs only the files it uses. A screen with no server has no `api.ts`; a feature with no screen (`progress`) has no `.tsx`.

## The feature contract

```ts
// core/feature.ts
interface WebFeature {
  id: string;
  tabs?: { id; label; icon; order; when?(): boolean; load(): Promise<ComponentType> }[];
  open?: Partial<Record<RouteKey, (params) => void>>;   // deep links: core/router parses, features open
  url?: { priority: number; current(): string | null }[]; // what the address bar shows while this feature is on screen
  slots?: SlotFills;                                     // contributions to other screens (core/slots.ts)
  boot?: Partial<Record<BootPhase, (ctx) => void>>;      // gated | identity | progress | routed
  onLeave?(tab: string): void;
}
```

- **Tabs** load lazily. Preact itself loads only when the first Preact screen draws, so `core/` uses `@preact/signals-core` and only features use `@preact/signals`.
- **Deep links.** The URL scheme is frozen and parsed in one place (`parseRoute`, `core/route.ts`; `BOOT`, `syncUrl` and `routeOpen` are in `core/router.ts`, which opens a link when the data its opener `needs` has loaded, or says so after 10 seconds). Full-screen pages share the history stack in `core/overlay.ts`. A feature fills the opener for its key (`lesson`, `card`, `unit`, `story`, `class`, `profile`, `connect`, …) and says, through `url`, what the address bar shows while its overlay is open.
- **Slots** are how one feature appears inside another's screen without importing it. Examples: Profile is a list of `profileCards`, and the user chip, the lesson's extras and the onboarding steps are slots too. `core/slots.ts` holds `SlotMap`; each fill has an `order` and a lazy `load`.
- **Boot phases** run in order (`core/boot.ts`; `core/startup.ts` walks them): gated (the session is known; `ctx.gated` says the sign-in gate must show, and then nothing else runs), identity (`me` and the rights loaded), progress (the server's progress merged and applied: the progress feature; the tutor's document loads), routed (the first deep link has been asked to open: the onboarding is offered). A handler may return a promise, and the next phase waits for it. The content collections start loading right after identity.

## How to add …

- **A screen:** create `features/<id>/` with an `index.ts` that registers a tab or an opener, and add one line to `features/index.ts`.
- **A route the screen calls:** first document it in `docs/SPECS_API.md`. Then add its types to `shared/<id>.ts`, add the handler in `worker/features/<id>/` ([worker/README.md](../worker/README.md)), and add the client in `features/<id>/api.ts`. All of it goes in one commit.
- **An extension point:** add a key to `SlotMap` in `core/slots.ts` and render the fills where it belongs.
- **Pure logic:** add `features/<id>/model/<name>.ts` and `<name>.test.ts`. If it has nothing to do with Kumru (Turkish text, dates), put it in `lib/` and list it in `sahne/packages/README.md`.
- **Something big that only one screen needs** (the Sahne engine): a dynamic `import()` from that screen, so Vite emits its own chunk and the service worker precaches it.

## Rules

- **Import boundaries** (eslint `no-restricted-imports`, with a fixture that proves the rule fires):
  - `core`, `host`, `ui`, `lib` and `styles` never import a feature.
  - A feature imports another feature only through `features/<other>/index.ts`, and only uses it inside functions, never at module top level (friends and classes refer to each other).
  - `app/` never imports `worker/`. Both import `shared/`, which imports neither.
- **State has one writer.** A feature's signals are in its `state.ts`. Others read them through its `index.ts` and change them only by calling functions it exports.
- **A signal sees assignment, not mutation.** Progress is mutated in place (`S.stats[id].a++`); its `rev` signal is bumped on every save, and `rerender()` bumps `redrawTick` for the plain-property fields.
- **Network** goes only through `host/` and each feature's `api.ts`.
- **`model/` is pure and tested**, with `node --test` (Node 24 strips the types). Imports use the `.ts` / `.tsx` extension.
- **Styles.**
  - Tokens and shared components are in `styles/` (`base.css`, `components.css`).
  - A feature's CSS sits beside its components under the feature's class prefix.
  - The cascade is `@layer reset, base, components, features` (declared in `index.html`), so the order of the files does not matter.
  - The entry CSS is inlined into `index.html`.
- **Persian is first-class.** New learner-facing text has English and Persian. A Latin run inside Persian goes through `faTxt` (`core/i18n.ts`).
- **Destructive actions** go through `ui/ConfirmSheet`: a red button, and `type: <name>` for the worst ones. Never `confirm()`.
- **Frozen contracts.** These do not change in a refactor:
  - the localStorage keys (`kumru:session`, `kumru:me`, `kumru:progress:<id>`, `kumru:dirty`, …);
  - every `/api` route and the URL scheme;
  - card, lesson, skill and section ids;
  - the progress, tutor and profile documents (the story fields `st` and `storiesDone` round-trip untouched).

## Features

| id | What | Server half |
|---|---|---|
| account | sign-in gate, account card, sign up / in / recover, pairing, devices, password, export, delete | yes |
| progress | progress state, persistence, selectors (no UI) | yes (documents) |
| path | the Path tab (the skill tree and the book's units, the next step, Review), its sheets (a unit, Review, a skill, the legend, Jump here, Test out), Kerim's line, the `/kerim` gallery | |
| practice | the session runner and every question type, and the session kinds: a path node's queue, timed and review sessions, the new-word queues, intro and lesson cards, the reports | |
| drills | the suffix drill engine, the drill picker sheet | |
| grammar | the lesson page, its blocks, the interactive grammar boxes, Try it | |
| placement | the placement climb (onboarding's quiz, the Path's Jump here and Test out) and what its result does to progress | |
| onboarding | the onboarding flow, and the learner's name and hometown helpers | |
| profile | Profile tab, stats, calendar, settings (made of slots) | |
| words | the card sheet, practice chip, gloss popup, read-only notes list | |
| friends | Friends tab, a learner's sheet, follows, cheers, the leaderboard, invite links | yes |
| classes | the Classes cards (Friends, Profile), class page `/c/<code>`, board, members | yes |
| reminders | streak reminders: the Profile card and onboarding's reminder step | yes |
| yeni | Notebook: connect, book progress, reader links | yes |
| tutor | the AI state, "Try it", the tutor document and saved fixes, Fix my mistakes, onboarding's writing helpers, the tutor lab | yes (`/api/ai` stub) |
| lab | the Lab tab | |
| owner | the Owner tab | yes |
| stories | placeholder until the Sahne stories: tab, `/stories/<id>`, talk entry | |
| dev | the `/kerim` gallery; documents the dev switches (`host/dev.ts`) | yes (`/api/dev/login`) |

The Owner tab (`features/owner/`) is the worked example of a screen. It has `OwnerTab.tsx`, `format.ts` + `format.test.ts`, and `index.ts`, which registers a `lazy` tab.

## Tests

`app/TESTS_TODO.md` lists the tests the refactor postponed.
