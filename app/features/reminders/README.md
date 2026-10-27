# reminders

Streak reminders: one Web Push nudge a day at the hour the learner picks, only on days they haven't practised. Server half: `worker/features/reminders` (the hourly cron sends them); contract: `shared/reminders.ts`; routes: docs/SPECS_API.md.

| | |
|---|---|
| Tabs | none |
| Slots | `profileCards` (order 30): `RemindCard.tsx` |
| Screens | `RemindCard.tsx` (the Profile card: hour, Turn on / Update / Turn off; "Checking…" while it asks; a note where the browser has no push), `StepBody.tsx` (the body of onboarding's "Daily reminder" step), `step.ts` (what that step calls) |
| State | `state.ts`: `status` (this phone's subscription, loaded once the card draws), `stepHour` (the hour the onboarding step has picked) |
| Routes | `api.ts`: `reminders.supported / status / enable / disable` (`GET/POST /api/push`, `GET /api/push/key`, `DELETE /api/push/<id>`) |
| Model | `model/hours.ts` |
| CSS | `reminders.css` (`.onb-remind`) |

The service worker (`app/host/sw.ts`) shows the pushed message and opens the app on tap; it stays in `host/`.

## What other features call

- The onboarding feature's "Daily reminder" step calls `remindStep()` (`step.ts`: `{ supported, turnOn }`; it resets the step's hour to 8 pm) and draws `loadRemindBody()` (`StepBody.tsx`). It could become an `onboardingSteps` slot fill once more steps live outside onboarding.

`window.kumru.host.push` is gone: nothing else read it.
