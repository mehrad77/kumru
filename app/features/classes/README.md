# classes

A class has a code, a weekly board and an owner (the teacher), who sees what members choose to share: place, streak and hardest words, and, separately, the reader's book progress. Server half: `worker/features/classes`; contract: `shared/classes.ts`; routes: docs/SPECS_API.md section 7.

| | |
|---|---|
| Tabs | none |
| Deep links | `/c/<code>` (an invite link): opens the class if I am in it, else the Join form with the code filled in. Open, the class page shows `/c/<code>` in the address bar (`url` provider, priority 40) |
| Slots | fills `friendsCards` (order 10: the Classes card on Friends) and `profileCards` (order 20: the Classes card on Profile, the two switches per class) |
| Screens | `ClassCards.tsx` (`FriendsClasses`, `ProfileClasses`), `BoardPage.tsx` (the class page: hero with the description under the name, or "+ Add a description" for its teacher, which opens Manage class at the description; this week's board, the switches), `BoardList.tsx` (a board as a list; the Friends leaderboard draws it too), `Editor.tsx` (start a class, Manage class, the danger zone), `JoinClass.tsx` (the join form, through the account feature's `accForm`), `Members.tsx` (the owner's list), `TeacherBox.tsx` (a member's shared numbers under their profile sheet), `parts.tsx` (Badge, Shares) |
| Page | `page.ts` (DOM, entry chunk): the full-screen page shares the history stack of the other pages (`core/overlay.ts`); `sheets.ts` (DOM) opens the page, the forms, the members list and a member's profile |
| State | `state.ts`: `classList` (null until asked), `loadClasses`, `ensureClasses`, `bookClasses`, `putClass` |
| Routes | `api.ts`: `classesApi.list / create / join / leave / setShare / update / remove / removeMember / board / members` (`/api/classes...`) |
| CSS | `classes.css` (`cl-*`, `cc-*`); the rows and boards use `app/ui/people.css` |

Destructive actions (delete a class: type its name; leave; remove a member) go through `confirmSheet`.

## What other features call

- `classes.list()` and `classes.join(code, share)`: the onboarding feature's "Join a class?" step (it imports them through `index.ts` as `classes`).

Other features use `index.ts`: `classList`, `bookClasses(load)` (the yeni feature, for the book summary a member shares), `classBoard(id)`, `loadBoardList`, `openClassMember`, `joinClassFromInvite` (the friends feature). It calls the friends feature (`openFriendSheet`, `addProfiles`) only inside functions. A member's book progress comes from `yeni/index.ts` (`loadClassBookBox`, `loadClassBookLine`).
