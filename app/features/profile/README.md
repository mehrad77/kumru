# profile

The Profile tab: the learner's header, then a grid of cards that is the `profileCards` slot: first two that open pages (Stats, My notes), then the settings. No server half (the pieces that talk to the server are other features' cards).

| | |
|---|---|
| Tabs | `profile` (`/profile`; the address bar shows `/@username` while it is on screen: the `url` provider, priority 10) |
| Slots | provides `profileCards` (the grid; `ui/Slot.tsx`). Fills it with Study (40), Language (50), Voice & audio (60), AI tutor (70), Appearance (80), Privacy (90), Editor tools (95, editors only). `StatsCard` is drawn before the slot. Fills by others, in page order: words "My notes" (5, a card that opens the notes page), account (10), classes (20), reminders (30), stories (65), yeni banner (100) |
| Screens | `ProfileTab.tsx` (header, then the grid), `Stats.tsx` (`StatsCard`: words known, streak and share right on one line, opening the Stats page, `ui/page.ts openPage`; `Stats`: the page's four tiles, the activity calendar, the suffix skills the learner practised), `Cards.tsx` (the settings cards), `parts.tsx` (`Seg`, `Tile`) |
| State | `state.ts`: `theme`, `readAloud` (both device settings in localStorage: `kumru:theme`, `kumru:st-auto`), `voiceTick`. `S.prefs` (goal, help language, Try it, corrections) lives in the progress document; `prefs.ts` `setPref` writes it and saves. `S.calMode` (`kumru:cal`) is a signal field of `core/store.ts` |
| Model | `model/stats.ts` (`streakDays`, `totals`, `barColor`), `model/calendar.ts` (the 18-week grid, Jalali or Gregorian) |
| CSS | `profile.css` (`pf-*`, `.skill`, `.more-stats`, the calendar `.cal` / `.d`, `.set-grid`, the tiles' icons). `.tiles` / `.tile` are in `app/styles/components.css` (the Owner tab uses them) |

`theme.ts` applies the theme when the feature loads (before the first paint). The settings card, row and switch are `app/ui/settings.tsx`.

## What other features call

- `currentStreak()` (`index.ts`): the Path's top bar and Kerim's line count the days in a row.

## What this feature calls in the path feature

The path feature gives it `companionLine` (Kerim's line under the header). The learner's place on the path is never set by hand here: placement, Jump here and Test out move it. It uses `myPortrait` from `ui/avatar` (the header's portrait: Sahne portrait or the old parts), `openOnboarding("edit" | "place")` (Edit, Retake placement), (the AI tutor card and Editor tools read `aiState` and `openTutorLab` from the tutor feature). They go when the Path, the drills and onboarding are rewritten.
