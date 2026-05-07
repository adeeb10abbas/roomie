# RoomieMatch

A Hinge-style mobile app for finding compatible roommates, built with Expo (React Native). Frontend-only with AsyncStorage persistence.

## Run & Operate

- Workflow: `artifacts/mobile: expo` — starts the Expo dev server
- Scan the QR code with Expo Go, or view in web preview
- No backend required — all data is mocked/local

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo 54, expo-router 6, React Native 0.81
- State: React Context + @react-native-async-storage/async-storage
- UI: expo-linear-gradient, expo-image, expo-haptics, @expo/vector-icons (Feather)
- Gestures: PanResponder (for card swiping)

## Where things live

```
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
    AppContext.tsx          # Global state + AsyncStorage persistence
  data/mockData.ts         # 10 profiles, 5 listings, 2 initial matches/messages
  constants/colors.ts      # Theme: primary #E8446A, bg #FAF8F5
  utils/images.ts          # Static require() array for profile photos
  utils/time.ts            # formatTime, uniqueId helpers
  assets/images/           # icon.png, profile1-profile5.png (AI-generated)
```

## Architecture decisions

- **Frontend-only, no backend**: all data lives in mockData.ts + AsyncStorage. Match detection is simulated (35% chance on like/shortlist).
- **PanResponder over gesture-handler** for card swiping: simpler API, no native module config needed in Expo Go.
- **Static `require()` for images**: React Native requires static image imports; we map `photoIndex` (0–4) to a pre-loaded array in `utils/images.ts`.
- **`useColors()` hook** (from `@/hooks/useColors`) provides the light-mode palette everywhere; ready for dark mode extension.
- **expo-router file-based routing**: tabs in `(tabs)/`, stack screens at root level, modal for filters.

## Product

- **Discover**: Swipe cards right (like), left (skip), or up (shortlist). 35% match chance on like. Match modal with celebration animation.
- **Housing**: Browse "Open Rooms" (existing places) and "Forming Groups" (building a group first). Search + detail page with join request flow.
- **Messages**: Match inbox with unread counts. Full chat screen with prompt chips, report/block/unmatch actions. "Why you match" banner.
- **Profile**: Own profile with stats, badges, prompts, lifestyle info. Edit profile and settings accessible from here.
- **Filters**: Budget range, neighborhoods, noise level, smoking, same-gender preference.
- **Onboarding**: 5-step setup (basic info → university → location+budget → lifestyle → bio+photo).

## User preferences

- App name: RoomieMatch
- Color palette: primary #E8446A (coral/rose), background #FAF8F5 (warm off-white)
- Feature list from attached document (May 2026) — full MVP coverage

## Gotchas

- Card swipe uses PanResponder; `isTop` prop must be true only for the topmost card or all cards will try to respond to gestures.
- `require()` for images must be static — never dynamic string interpolation.
- Expo Go does not support all native modules; avoid adding native-only packages without checking Expo Go compatibility.

## Pointers

- See the `pnpm-workspace` skill for workspace structure
- See the `expo` skill for Expo/React Native conventions
