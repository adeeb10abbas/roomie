# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# currentDate
Today's date is 2026-05-17.

## Commands

```sh
# Start dev server (Expo Go)
npx expo start --clear

# Start and open iOS simulator
npx expo start --ios --clear

# Install packages (always use --legacy-peer-deps due to peer dep conflicts)
npm install --legacy-peer-deps <package>

# Type check
npx tsc --noEmit
```

## Architecture

This is an **Expo SDK 54** React Native app using **Expo Router** (file-based routing) with **Clerk** for authentication.

- `app/_layout.tsx` — Root layout. Wraps the entire app in `ClerkProvider` with a `SecureStore`-backed token cache. Uses a `Stack` navigator with headers hidden globally.
- `app/index.tsx` — Home screen (maps to `/`).
- `assets/` — Static image assets (icon, splash, adaptive-icon, favicon).
- `babel.config.js` — Required for Expo Router; uses `babel-preset-expo`.

## Key setup notes

- `package.json#main` is `expo-router/entry` (not a local file).
- `npm install` requires `--legacy-peer-deps` due to `@clerk/clerk-expo` requiring `react-dom` as a peer.
- `react-dom@19.1.0` must be installed alongside `react@19.1.0` — Clerk's React package imports it.
- `expo-dev-client` is **not** installed; the app runs in **Expo Go**.
- CocoaPods must be **1.13+** to build natively (`react-native-safe-area-context` v5 uses `visionos` platform). The current system CocoaPods is 1.10.1 — native builds are blocked until updated via `sudo gem install cocoapods` or `brew install cocoapods`.
- `app.json` plugins: `["expo-router", "expo-secure-store"]`. Do **not** add `@clerk/clerk-expo/plugin` — that sub-path does not exist in the installed package version.

## Environment

Requires `.env` at the project root:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<your key>
```
