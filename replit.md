# RoomieMatch

A Hinge-style mobile app for finding compatible roommates, built with Expo (React Native).
Backed by a PostgreSQL database and a REST API server (Express + Drizzle ORM).

## Run & Operate

- Workflow `artifacts/api-server: API Server` — Express API on port 8080, proxied at `/api`
- Workflow `artifacts/mobile: expo` — Expo dev server; scan QR with Expo Go or view in web preview
- Database: Replit-managed PostgreSQL (connection via `DATABASE_URL`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo 54, expo-router 6, React Native 0.81
- API: Express 5, Drizzle ORM 0.45, Zod v4
- State: React Context (AppContext) + REST API for all relational data
- AsyncStorage: retained **only** for three device-local items: `userId` (auth token placeholder until real auth is added), `currentUser` (cold-start cache), and `filters` (UI preference). All relational data (profiles, matches, messages, housing) is server-backed.
- UI: expo-linear-gradient, expo-image, expo-haptics, @expo/vector-icons (Feather)
- Gestures: PanResponder (for card swiping)

## Where things live

```
artifacts/api-server/
  src/
    routes/
      profiles.ts      # GET /api/profiles (paginated, filtered, excludes swiped)
                       # GET /api/profiles/:id
      swipes.ts        # POST /api/swipes (reciprocal match detection)
                       # DELETE /api/swipes/:swipedId (undo)
      matches.ts       # GET /api/matches
      messages.ts      # GET/POST /api/messages/:matchId
                       # POST /api/messages/:matchId/read
      profile.ts       # GET/PUT /api/profile/me
      housing.ts       # GET /api/housing, GET /api/housing/:id
    middlewares/
      userId.ts        # requireUserId — reads x-user-id header
    utils/
      validateResponse.ts  # sendValidated() — Zod response validation helper

lib/db/
  src/schema/          # Drizzle schema: users, swipe_actions, matches, messages,
                       #   housing_listings
  migrations/          # Generated SQL migration files (drizzle-kit generate)
  drizzle.config.ts    # Points to ./migrations output dir

lib/api-zod/
  src/schemas.ts       # Zod schemas for all request/response types

scripts/src/seed.ts    # Seeds 10 profiles + 5 housing listings (idempotent)

artifacts/mobile/
  app/
    index.tsx              # Entry: redirect to onboarding or (tabs)
    onboarding.tsx         # 5-step profile setup
    (tabs)/
      index.tsx            # Discover (card swipe stack)
      housing.tsx          # Browse open rooms & forming groups
      messages.tsx         # Match inbox
      profile.tsx          # Own profile view
    chat/[id].tsx          # Chat with a match
    user/[id].tsx          # View another user's full profile
    housing-detail/[id].tsx # Housing listing detail
    filters.tsx            # Match filter settings (modal)
    shortlist.tsx          # Saved profiles
    settings.tsx           # App settings
    edit-profile.tsx       # Edit own profile
  components/
    ProfileCard.tsx        # Swipeable card (PanResponder)
    MatchModal.tsx         # "It's a Match!" overlay
    ConversationItem.tsx   # Message inbox row
    HousingCard.tsx        # Housing listing card
    Badge.tsx              # Trust badges (verified, etc.)
  context/
    types.ts               # All TypeScript interfaces
    AppContext.tsx          # Global state; all relational data via REST API
  utils/
    api.ts                 # apiFetch helper with x-user-id header injection
    images.ts              # Static require() array for profile photos
    time.ts                # formatTime, uniqueId helpers
  constants/colors.ts      # Theme: primary #0284C7, bg #F8FBFF
  assets/images/           # icon.png, profile1-profile5.png (AI-generated)
```

## Architecture decisions

- **PostgreSQL + REST API**: all relational data (profiles, swipes, matches, messages, housing) lives in the database. Mobile reads/writes via `utils/api.ts` → Express routes → Drizzle ORM.
- **Reciprocal match detection**: `POST /swipes` checks for an existing like/shortlist from the other user before creating a match row. No random simulation — matches are strictly data-driven.
- **Canonical match pair ordering**: `user1Id` is always the lexicographically smaller UUID. A unique index on `(user1Id, user2Id)` prevents duplicate matches from concurrent reciprocal swipes.
- **Response validation**: all API routes use `sendValidated(res, Schema, data)` to parse the response payload through Zod before sending. Mismatches return 500 with issue details logged by pino.
- **Placeholder auth**: `x-user-id` header carries the device-generated userId. AsyncStorage persists this ID across app restarts. Will be replaced by real auth (JWT/session) in a future task.
- **Migration workflow**: `pnpm --filter @workspace/db run generate` creates SQL migrations in `lib/db/migrations/`. `pnpm --filter @workspace/db run migrate` applies them (for prod). Development uses `push` or `push-force` for rapid iteration.
- **Seeding**: `pnpm --filter @workspace/scripts run seed` inserts 10 profiles + 5 housing listings (`onConflictDoNothing`). Safe to re-run.
- **PanResponder over gesture-handler** for card swiping: simpler API, no native module config needed in Expo Go.
- **Static `require()` for images**: React Native requires static image imports; we map `photoIndex` (0–4) to a pre-loaded array in `utils/images.ts`.
- **`useColors()` hook** (from `@/hooks/useColors`) provides the light-mode palette everywhere; ready for dark mode extension.
- **expo-router file-based routing**: tabs in `(tabs)/`, stack screens at root level, modal for filters.

## Product

- **Discover**: Swipe cards right (like), left (skip), or up (shortlist). Match is created only when both users liked each other (reciprocal). Match modal with celebration animation.
- **Housing**: Browse "Open Rooms" (existing places) and "Forming Groups" (building a group first). Search + detail page with join request flow.
- **Messages**: Match inbox with unread counts. Full chat screen with prompt chips, report/block/unmatch actions. "Why you match" banner. Messages persist to DB; chat history loads on mount.
- **Profile**: Own profile with stats, badges, prompts, lifestyle info. Edit profile and settings accessible from here.
- **Filters**: Budget range, neighborhoods, noise level, smoking, same-gender preference. Applied server-side via query params.
- **Onboarding**: 5-step setup (basic info → university → location+budget → lifestyle → bio+photo).

## User preferences

- App name: RoomieMatch (header branding: "Roomie" + "AI" badge)
- Color palette: primary #0284C7 (sky-600), primaryLight #F0F9FF (sky-50), primaryMedium #E0F2FE (sky-100), background #F8FBFF, foreground #0F172A (slate-900)
- Tab bar active: sky primary tint; section icon backgrounds: sky-100 rounded squares
- Match score badges: emerald ≥85%, amber ≥70%, sky <70%
- Feature list from attached document (May 2026) — full MVP coverage

## Gotchas

- Card swipe uses PanResponder; `isTop` prop must be true only for the topmost card or all cards will try to respond to gestures.
- `require()` for images must be static — never dynamic string interpolation.
- Expo Go does not support all native modules; avoid adding native-only packages without checking Expo Go compatibility.
- Housing listings require a valid `postedById` (FK to users). If the poster user is missing, the listing is silently omitted from GET /api/housing responses to avoid schema validation failures.

## Pointers

- See the `pnpm-workspace` skill for workspace structure
- See the `expo` skill for Expo/React Native conventions
