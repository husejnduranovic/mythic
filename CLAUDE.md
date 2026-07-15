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

## Core gameplay concepts (scoring v2, 2026-07-01 — spec in GAMEPLAY.md §1.5)

- 7 board layouts (Battlements, The Siege, The Portcullis, Snake Eyes, The Citadel, Dragon's Spine, The Eyrie) with per-level multipliers 1.0x–4.0x; blocking graphs must be SYMMETRIC (owner constraint) and machine-verified clearable via `scripts/verify-layouts.js`
- Combo system: chain multiplier capped at 100x (combo 31+); **banners** at 5/8/12/16/20/24/28/32 bank `milestone × 1,000 × fieldMult × glory` permanently and freeze the timer 3s — one ladder drives bank/freeze/sound/HUD tier
- Free Draw (doesn't reset combo): one granted per field, unused draws bank to the next field (cap 2); deck draw resets combo
- Bounty cards: 3x match points at the current combo tier (routing decision); placement seeded on shared decks (Daily/Arena)
- Glory Hunt (opt-in: 2x points, 50% time, once per game; armed = a switch — tap again to disarm/refund until the field begins, 2026-07-14); perfect clear 50,000 × fieldMult × glory; **Flawless Conquest** accolade for all-perfect runs
- **Unbroken Conquest** (2026-07-02): field cleared with final combo === its card count (one unbroken chain) pays a second perfect-clear bonus (100k × fieldMult × glory total) — apex on-board moment (gold detonation, layered fanfare, earned-only ledger row); won fields hold the board ~1s while the clear moment plays (the clear-hold)
- **The ghost**: best run's per-field pace stored locally (`@mythic_best_run_pace`); between-levels shows ahead/behind your best at that point; pre-battle names THE SHADOW (best total) before the run starts
- Personal-best banner mid-run; two-active-card rule (second card retained from combo 2)
- Removed mechanics (v1.4): wild cards, carry combo, combo insurance — code and Armory inventory deleted
- Score docs carry `scoringV: 2`; v2 scores are ~5–20x lower than v1 — `allTimeScores` wipe recommended at 1.4 release

## Multiplayer (Arena)

- 2–6 players, Realtime Database, 4-digit room codes
- Same seeded deck for all players; live scoreboard; atomic rematch transactions; disconnect handling

## Other systems

- Daily Quest (seeded, one attempt/day, own leaderboard)
- Hall of Glory: all-time / daily / weekly leaderboards (Firestore)
- Armory: 36 pieces across 4 racks (backs / battlefields / bounty / tables); gates: battles played (to 150), streaks (7/21/42/60), best combo (×12/×20/×24/×28/×32), spoils battle (1M/2M)
- Streak system with milestone unlocks (7/21/42/60 days); **Ember Ward** — one missed day per rolling week forgiven (`emberWardUsedAt` on `users/{uid}`); streak compare is an exact local-day diff (UTC-yesterday reset bug fixed 2026-07-02)
- First-session arc: coach marks on the first free battle (`@mythic_seen_coachmarks`), First Victory overlay → Armory (`@mythic_first_victory_seen`, veteran-gated), share button on game-over
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

v1.3.x in production; **v1.4 in progress on `refactor/v1.4-phase3`** — Phase 3 redesign (design system in `src/ui/`, all screens recomposed; log in DESIGN_PLAN.md) + scoring v2 / Armory skill gates + the moments pass (UNBROKEN, clear-hold, first-session arc, Ember Ward — GAMEPLAY.md §1.5) + the layout audit (7-board set; L3/L7 rebuilt 2026-07-10 as The Portcullis / The Eyrie after the funnel-pair verdict; 2026-07-14 Task-3 fixes: Siege eased, Portcullis "two hinges" lock, Eyrie "grip and weave" — GAMEPLAY.md §3) + the menu-energy pass (Home light/weight, Armory forge moment, ScreenEnter, GoldButton punch/disabled) + the Critical-Analysis build-out (2026-07-13/14, REFACTOR_PLAN verdict rows 1–9 all shipped: Field Crowns, goal module + prize strip, Second Blade coach mark, sound pass via `SoundService.playAt` variants, dead-tap reject, Glory disarm) + the REFACTOR_PLAN_V2 feature tiers (2026-07-15: **Tier 1 notifications** — per-user FCM tokens + contextual permission + scheduled streak-at-risk push; **Tier 2 async duels** — seeded free runs, `duels/{code}`, challenger/receiver flows + answer push; **Tier 3 the Daily Edict** — `src/game/edict.ts`, six config-only per-day decrees seeded per date, daily now decoupled from all-time *and* lounge boards — GAMEPLAY.md §1.5; **Tier 4** — duel-aware game-over sounds, first Jest suite over `src/game/` (40 tests, `npm test`), stale-chip fix, repo hygiene, and the sound replacement pass acquisition half (`scripts/sounds-manifest.json` + self-verifying `scripts/fetch-sounds.js` — owner runs with a freesound token; filenames unchanged so the swap is zero-code, machine-checked by a consistency test); **Tier 5 anonymous auth** — `signInAnonymously` on first open (no wall; "Wanderer" plays free battles, identity modes locked), link-at-first-game-over via `App.linkWithGoogle` (`linkWithCredential`, uid preserved; veteran-reinstall `credential-already-in-use` fallback) — REFACTOR_PLAN_V2 build log has the full tier ledger + owner gates). Marketing playbook in **MARKET.md** (lounge channel first; listing refresh + wipe at release). v1.4 release checklist: owner playtest of the new/changed boards (The Siege, The Portcullis, The Citadel, The Eyrie, Dragon's Spine base), `allTimeScores` wipe decision. Earlier: SDK 52→54, Reanimated v3→v4, 16 KB compliance, Arena disconnect handling.

## Working rules

- Be direct, concise, step-by-step. No walls of text.
- Push back on risky changes.
- Don't dump huge code blocks unless asked.
- Refactors: pure restructuring only — never change gameplay/scoring behavior without explicit approval.
- Commit in small slices; app must build between slices.
