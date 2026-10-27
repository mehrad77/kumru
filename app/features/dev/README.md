# dev

What only a developer opens. No tab, no state, no storage keys.

| | |
|---|---|
| Deep links | `kerim` (`/kerim`, `#kerim`): the gallery of Kerim, `gallery.ts` + `gallery.css` (`.kg*`). It draws over the page and closes back to the Path. |
| Server half | `worker/features/dev`: `POST /api/dev/login` `{ username }` returns a session for a seeded account (`pnpm seed`). It exists only on a local host. |
| Imports | `ui/avatar` (`chAvatar`), `ui/kerim`. |

## The dev switches

They run in `app/host/dev.ts` before the page boots (so they can shape the device's saved progress the page then starts from) and only on `localhost`, `127.0.0.1` or `*.localhost`. `docs/SPECS.md` section 11.4 has the full list.

| Switch | Does |
|---|---|
| `?as=<username>` | Signs in as a seeded account without a password (`POST /api/dev/login`), then reloads without the switch. `?as=owner`, `?as=ada`; see `worker/seed/README.md`. |
| `?fresh` | Clears every `kumru:` key and cache: a brand-new learner. Once per visit. |
| `?learner` | Loads the dev learner, part-way through A1 (built in by the dev build, `scripts/vite/page.ts`). |
| `?learn=g_a1_4_iyelik,...` | Marks those lessons learned. |
| `?treedone=N` | Marks the first N steps of the skill tree done. |
| `?sw` | Registers the service worker in dev too. |

Switches of single screens read `window.__DEV`, which `host/dev.ts` sets: `?only=build,type` (practice, `kinds.ts`), `?skill=sk_id&part=N` (the Path, `PathTab.tsx`), `?lab`, `?tree` (the lab and path features' own storage keys).
