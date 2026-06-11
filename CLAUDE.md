# Mythic Peaks — CLAUDE.md

Medieval fantasy tri-peaks solitaire. React Native mobile app, live on Google Play (`com.husejn.mythicpeaks`, Android only, iOS pending).

## Tech stack

- Expo SDK 54 (managed workflow), TypeScript, React 19, react-native-reanimated v4
- Firebase: Auth, Firestore, Realtime Database, Remote Config, FCM
- Google Sign-In: `@react-native-google-signin/google-signin`
- Cloud Functions (Node.js) in `functions/` using `firebase-admin`
- Sounds via `expo-av`

## Build workflow (Windows) — DO NOT BREAK

- JS/TS-only changes: `cd android && gradlew bundleRelease` (AAB) or `gradlew assembleRelease` (APK)
- Native/SDK changes: `npx expo prebuild --platform android --clean` — **this wipes the signing config in `android/app/build.gradle`; it must be manually restored after prebuild**
- NDK pinned: `29.0.13113456` in root `android/build.gradle` (`ext { ndkVersion = ... }`) — required for 16 KB page size compliance
- Keystore path hardcoded in build.gradle (local, not EAS managed)
- Never suggest EAS-managed Android builds; local builds only

## Core gameplay concepts

- 6 board layouts with per-layout score multipliers (1x–3x)
- Combo system: milestones at 3/5/7/10/15/20/25/30, tiered visual feedback
- Wild cards (earned at combo 10 and 20), Free Draw (one per layout, doesn't reset combo)
- Combo insurance (partial save on dead-end, layout-dependent)
- Bounty cards (5x points), Carry Combo (abandon layout, keep combo)
- Glory Hunt (opt-in: 2x points, 50% time, once per game)
- Timer freeze on combo milestones; personal-best banner mid-run

## Multiplayer (Arena)

- 2–6 players, Realtime Database, 4-digit room codes
- Same seeded deck for all players; live scoreboard; atomic rematch transactions; disconnect handling

## Other systems

- Daily Quest (seeded, one attempt/day, own leaderboard)
- Hall of Glory: all-time / daily / weekly leaderboards (Firestore)
- Armory: 34 unlockables across 5 categories, unlock conditions (games played, streaks, score milestones)
- Streak system with milestone unlocks (7/21/42/60 days)
- Hookah Lounge tournaments: venue codes (e.g. "VIENNA"), venue-specific weekly leaderboards
- Version gating via Remote Config (`minimum_app_version`)

## Firestore schema

- `users/{uid}` — profile, heroName, bestScore, bestCombo, totals, timestamps
- `gameScores/{docId}` — per-game records
- `dailyScores/{date_uid}` — daily quest scores
- `allTimeScores/{uid}` — per-user best (drives all-time leaderboard)
- `loungeScores/{loungeCode_weekId_uid}` — venue weekly scores
- `lounges/{loungeId}` — venue config

## Realtime DB schema

- `rooms/{code}` — Arena rooms: `players/{uid}`, `state` (lobby/playing/results), `level`, `rematchCount`, `isResetting`

## Current state

v1.3.5 in production. Recent: SDK 52→54, Reanimated v3→v4, 16 KB compliance, Arena disconnect handling, 2 new layouts, combo insurance, Armory at 34 items, scoring rebalance.

## Working rules

- Be direct, concise, step-by-step. No walls of text.
- Push back on risky changes.
- Don't dump huge code blocks unless asked.
- Refactors: pure restructuring only — never change gameplay/scoring behavior without explicit approval.
- Commit in small slices; app must build between slices.
