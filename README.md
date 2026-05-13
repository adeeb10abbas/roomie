# RoomieMatch

A Hinge-style roommate-finding mobile app. Swipe on potential roommates, match, and chat in real time.

## Stack

| Layer | Tech |
|-------|------|
| Mobile | Expo 54 / React Native 0.81 / expo-router 6 |
| API | Express 5 / Drizzle ORM / PostgreSQL |
| Auth | JWT (access) + refresh token rotation (DB-backed) |
| Real-time | Socket.io |
| Monorepo | pnpm workspaces |

## Running the app

Two workflows must be running (Replit starts them automatically):

| Workflow | What it does |
|----------|-------------|
| `artifacts/api-server: API Server` | REST + Socket.io on port 8080, proxied at `/api` |
| `artifacts/mobile: expo` | Expo dev server — scan QR with Expo Go or open web preview |

If the API server dies with `EADDRINUSE`, run `fuser -k 8080/tcp` then restart the workflow.

## Test account

| Field | Value |
|-------|-------|
| Email | `test@roomie.app` |
| Password | `password123` |
| userId | `test-user-01` |
| Profile | Alex Taylor, 26, Columbia University |

10 mock roommate profiles and 5 housing listings are pre-seeded. Re-seed any time:

```bash
pnpm --filter @workspace/scripts run seed
```

## Key directories

```
artifacts/api-server/src/
  routes/          # auth, profiles, swipes, matches, messages, housing, notifications
  middlewares/     # requireUserId (JWT guard)
  lib/             # socket.ts, logger.ts

artifacts/mobile/
  app/             # expo-router screens
  components/      # ProfileCard, MatchModal, HousingCard, ConversationItem, …
  context/         # AppContext (global state + API calls)
  utils/api.ts     # apiFetch — attaches Bearer token, handles 401 → refresh → retry

lib/db/src/schema/ # Drizzle schema (users, swipe_actions, matches, messages, …)
lib/api-zod/       # Shared Zod schemas for request/response validation
scripts/src/       # seed.ts, other utilities
```

## Auth flow

1. `POST /api/auth/login` → `{ token, refreshToken, userId, hasProfile }`
2. `token` stored in SecureStore (native) / localStorage (web)
3. On 401, `apiFetch` transparently calls `POST /api/auth/refresh` and retries once
4. Native clients send `refreshToken` in the request body; web uses httpOnly cookie

## Database migrations

```bash
# Generate a new migration after schema changes
pnpm --filter @workspace/db run generate

# Apply migrations (production / fresh env)
pnpm --filter @workspace/db run migrate

# Push schema directly (dev iteration, no migration file)
pnpm --filter @workspace/db run push
```

## Typechecking

```bash
pnpm run typecheck        # full workspace check (libs → leaves)
pnpm run typecheck:libs   # composite libs only
```

## Feature summary

- **Discover** — card stack swipe (like / skip / shortlist), undo, match modal, AI match score
- **Housing** — open rooms + forming groups, search, join request flow
- **Messages** — real-time inbox, prompt chips, read receipts, report/block/unmatch
- **Profile** — stats, trust badges, lifestyle breakdown, edit profile
- **Filters** — budget, neighborhoods, noise, smoking, same-gender (applied server-side)
- **Notifications** — Expo push on new match and new message

## Environment secrets

| Secret | Purpose |
|--------|---------|
| `DATABASE_URL` | Replit-managed PostgreSQL |
| `SESSION_SECRET` | JWT signing key |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Optional — enables Google OAuth |

## Notes for agents

- **Never hardcode port 8080** — always read `process.env.PORT`.
- **Never use `console.log` in server code** — use `req.log` in route handlers, `logger` elsewhere.
- **Image imports must be static** — `require()` calls in `utils/images.ts` cannot use dynamic strings.
- **Card swiping uses PanResponder** — `isTop` prop must only be `true` for the topmost card.
- **Canonical match pair ordering** — `user1Id` is always the lexicographically smaller UUID; the unique index on `(user1Id, user2Id)` prevents duplicate matches.
- The `useColors()` hook at `@/hooks/useColors` is the single source of truth for the color palette — do not hardcode hex values in screens.
- See `replit.md` for the full architecture decision log and gotchas.
