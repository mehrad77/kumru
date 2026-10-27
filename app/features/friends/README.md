# friends

One public profile per learner, follows (two learners who follow each other are friends), cheers, a weekly leaderboard and invite links. Server half: `worker/features/friends`; contract: `shared/friends.ts`; routes: docs/SPECS_API.md section 6.

| | |
|---|---|
| Tabs | `friends` (order 40): `FriendsTab.tsx` |
| Deep links | none of its own. `/f/<code>`, `/c/<code>` and `/@name` are read before boot by `host/invite.ts` (kept in `kumru:pending-follow\|class\|profile`) and acted on here after the first Friends payload (`actions.ts` `processInvites`); a `/@name` that names this learner opens Profile. While a profile sheet is open the address bar shows `/@<username>` |
| Slots | provides `friendsCards` (between the leaderboard and "Following"; the classes feature fills it). `friendStats` (stats on a friend's row and sheet) is not rendered yet: the four numbers are inline in `FriendSheet.tsx` |
| Screens | `FriendsTab.tsx` (my link and friend code, Add a friend, Inbox, Following, and the shell messages), `Board.tsx` (the leaderboard: friends or one of my classes, this week or all time), `FriendSheet.tsx` (a learner's sheet; `extra` is a lazily loaded component another feature adds under the numbers), `parts.tsx` (Avatar, PersonRow, ActBtn, Flame) |
| State | `state.ts`: `profiles` (the last payload, mine included), `loaded`, `names`, `ops` (my follows and cheers not saved yet), `myCode`, `query` / `hits` (the search box), `dismissTick`, the leaderboard's `boardMode` / `boardScope`, `classBoardCache` |
| Actions | `actions.ts`: `start` (load, then every 2 minutes while the tab is open and whenever the app comes to the front; never in the background), `saveProfileSoon` / `flush` (the public profile is saved 1.5 s after a progress save or a change, only when its content changed), `follow` / `unfollow` / `cheer`, `dismiss`, `searchRemote`, `addProfiles`, the red dot on the tab button |
| Routes | `api.ts`: `friendsApi.load / names / search / save` (`GET /api/friends`, `GET /api/users`, `GET /api/profiles/search`, `PUT /api/profile`) |
| Model | `model/friends.ts` (friends, followers, pending, the leaderboard, the inbox, the public doc, search; `frRelTime` is `lib/reltime.ts`) with `friends.test.ts` |
| Storage | `kumru:frDismiss` (dismissed followers), `frBoard`, `frScope`; the pending invite keys above |
| CSS | `friends.css` (`fr-*`), `app/ui/people.css` (the person rows and board list that Classes and Owner share). The tab bar's badge (`.fr-badge`) is in `app/styles/components.css` because the tab bar is the shell's |

`sheet.ts` is DOM only (entry chunk): it builds the sheet frame and the backdrop; Preact and `FriendSheet.tsx` load when it opens. The profile document's `storiesDone` round-trips untouched (`frBuildDoc`).

## Boot

- `start()` at the `identity` phase, once the learner is known (and signed in).

`flushLater` (`app/ui/later.ts`) is what the onboarding calls when it closes, so invite sheets that waited can open.

Other features use `index.ts`: `openFriendSheet(uid, extra)` and `addProfiles(profiles, names)` (the classes feature, for a class owner opening a member). `index.ts` calls the classes feature (`joinClassFromInvite`, the board of a class, `classList`) only inside functions.
