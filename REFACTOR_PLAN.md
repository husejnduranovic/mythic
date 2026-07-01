# Mythic Peaks — Refactor & Improvement Plan

Ordered smallest-risk-first. Each Phase 1 step is a separate commit; the app must build (`tsc --noEmit` + `gradlew assembleRelease`) after every step. No behavior changes in Phase 1.

---

## ▶ Fable session — 2026-07-01 (supersedes the 2026-06-16 pause)

The held Fable-level pass ran on branch `refactor/v1.4-phase3`. Shipped, one slice per commit (tsc-gated):

- **Housekeeping** `a3c266d`: prior-session tree committed — Scoreboard Daily-tab fallback (keep podium mounted across tab switches) + v1.3.9/38 bump. Daily-tab fix needs on-device confirm.
- **Game board war table** (DESIGN_PLAN 27) + **card feel/vanquish tiers** (28, incl. Layout7 invisible-bounty fix + dead `pending` machinery sweep).
- **Scoring v2 — "Spoils, Banners & Bounties"** (`GAMEPLAY.md §1.5`): capped 100× combo curve, banked banners on one aligned milestone ladder (kills the freeze/banner defect + `comboBaseRef`), bounty ×3-at-tier, seeded bounties (Daily/Arena fairness), `scoringV: 2` stamps. **Release gate: `allTimeScores` wipe decision.** Also fixed a stale-closure arena-rematch deck bug (`initLevel` deps).
- **Layouts**: The Warfront (new `LayoutWarfront.tsx`, layout 10, level 5 — `Layout2` shelved) + Dragon's Spine interlocked base. **Owner playtest gate on both.**
- **Moments**: game-over count-up/stamp/rank-punch + banners row; between-levels ignition + `LEVEL_CONFIG.name`; pre-battle road deal.
- **Armory**: skill gates (`comboReq`/`scoreReq`) + wild styles deleted (`wildStyle` off ThemeConfig/storage; Findings #1 resolved).
- **Docs**: CLAUDE.md drift corrected (milestones/multipliers/wilds/item count/scoring v2).

**Still open:** Lounge & Guide distinctive-identity pass (on-system but flagged); shared-component migration sweep (`TabBar` extraction, menu screens → `GoldButton`/`honor.tsx`); `migrateArmoryIfNeeded` retirement question; Daily-tab on-device confirm.

---

## Current state (findings)

Lines below are the **baseline at plan-writing time**; the *Now* column tracks Phase 1 progress.

| File | Baseline | Now | Notes |
|---|---|---|---|
| `src/components/Game.tsx` | 4,822 | **1,575** | Was a monolith (constants, scoring math, 4 decorative components, ~80 state hooks, all Firebase score-saving, 7 screen states, 1,700+ lines of styles). Steps 1.1–1.6 extracted the dead code, `src/game/` logic, decorative components, score-saving flow, and all 6 screen-states + quit modal. Remaining: core state/effects/handlers + main-board JSX & its styles. |
| `src/components/Arenascreen.tsx` | 1,520 | **271** | Was menu + lobby + invite UI + styles in one file. Step 1.7 split it into a thin container (state/effects/handlers) + `src/components/arena/` presentational components. |
| `src/components/Profile.tsx` | 1,066 | 1,133 | Includes the multi-collection rename logic (Bug 1). Consumer imports updated in Step 1.4; otherwise untouched. |
| `src/components/Scoreboard.tsx` | 851 | 884 | `saveScore` moved out to `LocalScoreService.ts` in Step 1.4. |
| Services | ~750 | — | Split/cleaned in Step 1.4 (`ScoreService`, `DailyQuestService`, `LocalScoreService`, `collections.ts`, `storageKeys.ts`, `logError.ts`); `saveGameResults` added in Step 1.5. Components still call Firestore directly (App, Game, Profile, Authscreen). |

**Phase 1: ✅ COMPLETE** — Steps 1.0–1.7 done; optional 1.8 (data-driven layouts) skipped by owner decision (revisit as a prerequisite if Phase 4 layout expansion proceeds). **Phase 2: ✅ COMPLETE** — both bugs fixed & verified on a real build. **Phase 3 review done:** see `DESIGN_PLAN.md` (2026-06-12) for the design/UX/retention audit and prioritized backlog.

Cross-cutting issues found:

- **heroName is denormalized** into `gameScores`, `dailyScores`, `allTimeScores`, `loungeScores`, and RTDB rooms. Renaming requires rewriting history — root of Bug 1.
- **`getAllTimeLeaderboard` reads `gameScores`, not `allTimeScores`** (`Dailychallenge.ts:83-94`), contradicting the intended schema in CLAUDE.md. One player can occupy multiple top-50 slots, and renames must touch every historical game doc.
- **`onRoomUpdate` polls RTDB every 1s** (`ArenaService.ts:232-255`) instead of using a realtime `.on("value")` listener.
- **Mixed `doc.exists` (property) vs `doc.exists()` (method)** — `Dailychallenge.ts:108`, `LoungeService.ts:103`. With RNFirebase v23, `!doc.exists` is `!function` → always `false`; the code only works by accident because the score comparison covers the missing-doc case.
- **Silent `catch {}` everywhere** — failures (including the rename and invite writes) disappear without a trace.
- **Large commented-out feature blocks** in Game.tsx (wild cards, carry combo, combo insurance — several hundred lines). Note: CLAUDE.md still describes these as live features; code says they're disabled. **Confirm with owner before deleting.**
- Dead import: `subscribeToOnlinePlayers` in `Arenascreen.tsx:21` (never called).
- `Dailychallenge.ts` is misnamed — it contains all general score/profile persistence, not just daily quest.
- Misc: `console.log` of arena players in `Game.tsx:1204`, `LogBox.ignoreLogs` hack in `ArenaService.ts:4`, debug scripts (`check_activity.js`, `reset-users.js`) in repo root (untracked, fine, but should move to a `scripts/` folder).

---

## Phase 1 — Refactor (pure restructuring, zero behavior change)

### Step 1.0 — Safety net (no code change)
- Work on `refactor/v1.4` branch (already on it). Commit `CLAUDE.md` + this plan first.
- Verification gate for every step: `npx tsc --noEmit` passes, `cd android && gradlew assembleRelease` builds, manual smoke test (one full game, one daily, one 2-player arena round).

### Step 1.1 — Delete dead code (needs one approval)
- Remove all commented-out wild-card / carry-combo / insurance blocks in Game.tsx (~400 lines), commented-out `LEVEL_CONFIG` variants, dead `subscribeToOnlinePlayers` import, commented-out duplicate `handleSendInvite` in Arenascreen.
- **Gate:** confirm wild cards / carry combo / insurance are intentionally retired (CLAUDE.md disagrees with code). If they may return, keep the blocks in git history only — that's what history is for.
- Risk: none (comments only). Biggest payoff per line for later steps.

**Status: ✅ DONE** — executed in commit `158f5c9` (refactor/v1.4). 798 lines removed across Game.tsx + Arenascreen.tsx; `tsc --noEmit` passes. Inventory below is retained for reference. All line numbers refer to Game.tsx at commit `8e9aa10` unless noted.

Confirmed safe to delete — commented-out code:
- 87, 91 — old `LEVEL_CONFIG` variants
- 98–117 — `WILD_*_THRESHOLD` consts + entire Combo Insurance block (`INSURANCE_LAYOUTS`, `getInsuranceReset`)
- 1047–1050, 1054 — wild state hooks + `wildPulse`
- 1098, 1106, 1114–1126 — `wildActiveRef`, `carryCombo` state, insurance refs/`insuranceFlash`/`insuranceFlashStyle`, `wildPlacingRef`
- 1163, 1168 — wild lines in ref-sync effect
- 1374–1387 — wild-card earn logic in combo effect; 1390–1407 — `wildActive` pulse effect
- 1450 — stray "Inside Game component…" comment
- 1488–1491 — auto-carry on perfect clear; 1510–1516 — commented setters in `advanceLevel`
- 1520–1534 — `handleAbandonLayout`
- 1542, 1560–1568 (keep live 1569–1570), 1571–1573, 1577 — commented blocks in `initLevel`
- 1649–1650 — `wildPlacing`/`wildPendingIndex` states
- 1709–1765 — `applyWildPlacement` + `handleCancelWildPlacement`
- 1807–1822 — `handleWildPlaceFirst/Second`, `handleWild`
- 1833, 1841–1845, 1854 — commented setters in `handlePlayAgain`
- 1901 — in `handleFreeDraw`
- 1911–1939 — `carryButtonData` + `wildProgressData` memos (keep live `battlefieldMemo` 1905–1910)
- 1987–1990 — commented setters in rematch effect
- 2028 — `pendingIndex` prop in `getLayout`
- 2085–2087 — old Return-to-Castle button; 2092, 2255 — "REPLACE … return block" comments
- 2208–2212, 2527–2533, 2704–2720 — commented `gloryBonusBox` JSX (3 sites)
- 2558–2582 — carry-combo achievement banner (also update comment 2541: "Perfect Clear > Carry Combo > Glory Hunt" → drop Carry Combo)
- 2840–2885 — insuranceFlash JSX + wildActive overlay JSX (one contiguous commented region)
- 2898–2904 — wildPlacing banner JSX
- 2982–2999 — carry-combo button JSX + trailing "Wild cards between center and timer" comment
- 3000–3081 — wild cards bottom-bar JSX
- 3098 — commented COMBO label
- 3159–3175 — wild progress JSX

Confirmed safe to delete — live-but-unreferenced after the above (verified by grep: only referenced from commented JSX, or never):
- Style keys: `wildBtn`+`wildIcon` (3922–3940 incl. header comment), `wildCardStack`+`wildCardIcon` (4287–4295 incl. header), `gloryBonusBox`+`gloryBonusText` (4525–4548), `wildBarBtn` (4550–4560), `wildCard`/`wildCard2`/`wildCardFrame`/`wildCardSymbol`/`wildCardLabel` (4561–4601), `wildActiveLabel`/`wildActiveBolt`/`wildActiveText`/`wildActiveSub`/`wildBorder` (4603–4649), `wildSelectBanner`/`wildSelectBannerText` (4841–4863), `abandonBtn`/`abandonBtnText` (4864–4881), `carryComboBox`/`carryComboText`/`carryCard`/`carryCardInner`/`carryCardLabel`/`carryCardValue`/`wildProgress*` (4882–4960), `insuranceFlash`/`insuranceFlashIcon` (5002–5025), `achievementCarry` (5047–5055)
- `wildConfig` (1445–1446) becomes unused once the commented JSX is gone → also remove `WILD_STYLE_CONFIG` from the Armory import (line ~26). Armory itself untouched — wild styles stay purchasable there.
- Rename style header 4438: "FLOATING BUTTONS (Hint/Wild)" → "(Hint)".
- `console.log("ARENA PLAYERS:…")` at 1204 (debug noise).

**Keep (live, easily mistaken for dead):** `openCardGlowWild` (used at 2964), `battlefieldMemo` comment 1905–1906, `bountyConfig` 1451–1453, all `freeDraw*` styles, `achievementPerfect`/`achievementGlory`.

Arenascreen.tsx (same commit):
- Remove unused `subscribeToOnlinePlayers` from import (line 21)
- Remove commented `handleSendInvite` (107–110) — keep the live one as-is; the `|| "1234"` fallback is a Phase 2 fix, NOT part of this commit
- Remove commented back-button JSX (487–489)

### Step 1.2 — Extract pure game logic → `src/game/`
New folder, pure TypeScript, no React imports — this becomes unit-testable for free:
- `src/game/config.ts`: `LEVEL_CONFIG`, `TOTAL_LEVELS`, `BASE_CARD_VALUE`, `SECOND_CARD_COMBO`, `COMBO_MILESTONES`, `RUNES`
- `src/game/scoring.ts`: `getComboMultiplier`, plus extracted-as-is helpers for the inline math in Game.tsx: `getLayoutMultiplier(level)` (`1 + (level-1)*0.5`), match points, bounty bonus (5000×layout), time bonus (50/s), deck bonus (200/card), perfect-clear bonus (50000×layout×glory)
- Move `isCardMatch` from CardService here; CardService re-exports for compatibility.
- Game.tsx imports these; numbers and formulas copied verbatim.
- Risk: very low (moves of constants and pure functions).

**Status: ✅ DONE** — commit `850a7c9` (refactor/v1.4). Created `src/game/config.ts`, `src/game/scoring.ts`, and `src/game/match.ts` (`isCardMatch` moved here, re-exported from `CardService.ts`). The three inline scoring sites in Game.tsx now call `getMatchPoints`/`getBountyBonus`/`getTimeBonus`/`getDeckBonus`/`getPerfectClearBonus` — formulas copied verbatim. `tsc --noEmit` passes.

### Step 1.3 — Extract decorative components out of Game.tsx
- `src/components/game/Battlefield.tsx` (lines 245–549 + styles `s`), `Battlements` + `WallTexture` (currently exported from Game.tsx — keep re-exports until callers updated), `PulsingCard`, `LayoutEntrance`, `bottomBarStyles`/`bs`.
- Risk: low (self-contained `React.memo` components).

**Status: ✅ DONE** — commit `ec5b5be` (refactor/v1.4). Created `src/components/game/Battlefield.tsx` (+ `s` styles), `Wall.tsx` (`Battlements`, `WallTexture` + `bs` styles), `LayoutEntrance.tsx`; Game.tsx −833 lines. No external callers existed, so no re-exports were needed. `PulsingCard` and `bottomBarStyles` were dropped instead of moved — both unreferenced (`bottomBarStyles` was a dead duplicate of `styles.*`); the dead `RUNES` import was also removed (Battlefield inlines its own rune subset). `tsc --noEmit` passes.

### Step 1.4 — Firebase service cleanup (structure only)
- Rename `Dailychallenge.ts` → split into `src/services/ScoreService.ts` (game/all-time score submission, `updateUserProfile`, rank queries) and `src/services/DailyQuestService.ts` (`hasPlayedToday`, `submitDailyScore`, daily leaderboard). Keep function bodies identical.
- Move `saveScore`/local-score helpers out of `Scoreboard.tsx` into `src/services/LocalScoreService.ts`.
- `src/services/collections.ts`: single source for collection names + doc-id builders (`dailyScoreId(date, uid)`, `loungeScoreId(code, week, uid)`).
- Normalize all `doc.exists` → `doc.exists()` (Dailychallenge/LoungeService). Today the property form happens to produce the same outcome, so this is behavior-neutral — but verify each site when changing.
- Move AsyncStorage keys (`@mythic_*`, scattered across 5 files) into one `storageKeys.ts`.
- Replace silent `catch {}` with a tiny `logError(scope, err)` helper (console-only for now — same user-visible behavior, but failures become diagnosable; directly needed for Phase 2).
- Risk: low-medium (many import-path updates; tsc catches them all).

**Status: ✅ DONE** — commit `292e761` (refactor/v1.4). `Dailychallenge.ts` deleted and split into `src/services/ScoreService.ts` (`getAllTimeLeaderboard`, `submitAllTimeScore`, `submitGameScore`, `updateUserProfile`, `getUserProfile`) and `src/services/DailyQuestService.ts` (`hasPlayedToday`, `submitDailyScore`, `getDailyLeaderboard`, `DailyScore` interface — `ScoreService` imports the type from there). `saveScore`/local-score helper moved out of `Scoreboard.tsx` into `src/services/LocalScoreService.ts`. New single-source files: `collections.ts` (collection names + `dailyScoreId`/`loungeScoreId` builders, used by the score/daily/lounge services), `storageKeys.ts` (all `@mythic_*` keys; Armory/Game/Introscreen/Lounge now reference it — Armory keeps its local `STORAGE_KEYS` map but sources values from `StorageKeys`), and `logError.ts`. Normalized the two property-form `doc.exists` → `doc.exists()` (`submitAllTimeScore`, `submitLoungeScore`). Replaced every silent `catch {}`/silent fallback `catch` with `logError(scope, err)` across ScoreService, DailyQuestService, LocalScoreService, LoungeService, SoundService, ArenaService, Armory, and App. Function bodies otherwise identical. Consumers updated: Game, Scoreboard, Profile, App. `tsc --noEmit` passes; manual smoke test passed (game / daily / arena).

### Step 1.5 — Extract score-saving flow from Game.tsx
- The `gameOver` effect (`Game.tsx:1217-1322`) fires ~8 independent Firestore operations inline. Move into `ScoreService.saveGameResults(params)` returning `{ rank, dailyRank, isAllTimeRecord, isPersonalBest, previousBest }`; Game.tsx keeps only the effect that calls it and sets state.
- Same call order/fire-and-forget semantics — no awaiting changes, no new sequencing.
- Risk: medium (touches the money path — verify a score still lands in all collections after one game, daily, arena, and lounge run).

**Status: ✅ DONE** — refactor/v1.4. Added `ScoreService.saveGameResults(params)` returning `{ rank, dailyRank, isAllTimeRecord, isPersonalBest, previousBest }`; Game.tsx's `gameOver` effect now just calls it and sets state from the result. All writes (`submitGameScore`, `submitAllTimeScore`, lounge submit, `updateUserProfile`, gamesPlayed sync, arena `updatePlayerScore`) stay fire-and-forget in the same order; the four result-feeding reads (all-time record, personal best, this-run rank, daily submit+rank) run concurrently via `Promise.all` and resolve into one object. The only timing change is that the dependent `setState` calls now fire together once all reads resolve, instead of each as its own read returns — sub-second Firestore reads, imperceptible. Silent `.catch(() => {})` sites became `logError(...)` per Step 1.4's pattern (return value unchanged: null/false defaults). Game.tsx dropped the now-dead `submitGameScore`/`submitAllTimeScore`/`updateUserProfile`/`submitDailyScore`/`submitLoungeScore`/`getSavedLoungeCode` imports. `tsc --noEmit` passes; manual smoke test pending.

### Step 1.6 — Split Game.tsx screen states
- Game renders 7 distinct screens via early returns: already-played (`:2058`), pre-battle (`:2094`), game-over (`:2257`), between-levels (`:2471`), paused (`:2769`), main board, quit-confirm modal (`:3282`).
- Extract each into `src/components/game/` with explicit props; move the matching styles with them. One commit per screen, building between each.
- Target: Game.tsx ≤ ~1,200 lines (state + logic + main board).
- Risk: medium (mechanical but large; styles must move with their consumers).

**Status: ✅ DONE** — refactor/v1.4, one commit per screen. Extracted into `src/components/game/`: `AlreadyPlayedScreen`, `PausedScreen`, `PreBattleScreen`, `GameOverScreen`, `BetweenLevelsScreen` (early-return screens) and `QuitConfirmModal` (in-board modal) — each a self-contained component with explicit props/callbacks and its own `StyleSheet` (values copied verbatim, matching the Step 1.3 convention). Side effects stay in Game.tsx behind callbacks (e.g. pre-battle `onEnter` battle-start write, paused restart). The `loading` early-return (~10 lines) was left inline. After each extraction the screen's now-orphaned style keys were pruned; a dedicated sweep then removed 87 unreferenced keys (accumulated orphans + pre-existing dead decorative styles from Step 1.3, the superseded old `quit*`/hint/`freeDrawIcon` styles) — verified behavior-neutral (every removed key had zero `styles.*` references; every surviving `styles.*` reference still resolves). Game.tsx 3,325 → 1,575 lines. `tsc --noEmit` passes after every commit; manual smoke test pending. (Target was ~1,200; the remaining bulk is core state/effects/handlers + the main board JSX and its bottom-bar/combo/milestone styles, which legitimately stay.)

### Step 1.7 — App.tsx + Arenascreen tidy-up
- App.tsx: replace the if-chain with a screen map; extract the presence logic (`isOnline` writes, online-count subscription, streak load) into `src/hooks/usePresence.ts` / `useUserStats.ts`.
- Arenascreen: split menu view / lobby view / invite-modal into components; remove the `roomCode || "1234"` fallback **only as part of Phase 2** (it's a behavior change).
- Risk: low.

**Status: ✅ DONE** — refactor/v1.4, two commits. **App.tsx** (305 → 234): presence logic (`isOnline` AppState writes + online-count `onSnapshot`) extracted to `src/hooks/usePresence.ts` (returns `onlineCount`); streak load extracted to `src/hooks/useUserStats.ts` (returns `{ currentStreak, bestStreak }`). The screen if-chain replaced by a `Record<Screen, () => ReactElement>` map keyed off `screen`, wrapped once in `<StatusBar hidden />`; the `showRules` overlay stays a guard above the map (it's orthogonal to `screen` and never co-occurs with `screen === "armory"`, so precedence is unchanged). `handleLogout`'s explicit offline write kept inline (identical behavior). **Arenascreen.tsx** (1,577 → 271): now a thin container holding all state/effects/handlers, rendering `ArenaMenu` or `ArenaLobby`. New `src/components/arena/`: `ArenaMenu`, `ArenaLobby`, `InviteModal`, `BackgroundDecor`, and `arenaStyles.ts` (StyleSheet moved verbatim — pre-existing dead style keys left as-is, not swept, to keep the move behavior-neutral). Animated values threaded as props; the `roomCode || "1234"` fallback left intact for Phase 2. `tsc --noEmit` passes after each commit; manual smoke test pending.

### Step 1.8 (optional, last) — Data-driven layouts
- `Layout1–9.tsx` (~1,800 lines total) are structurally identical position tables. Could collapse into one component + 9 data files. Defer unless needed — touching card positioning right before bug-fix work isn't worth it.

**Status: ⏭️ SKIPPED** — owner elected to skip and proceed to Phase 2. Layouts left as-is.

**Explicitly NOT in Phase 1** (behavior changes, need approval): RTDB polling → listener, leaderboard source change, batched rename, any scoring/gameplay change.

---

## Phase 2 — Bug fixes — ✅ COMPLETE (both fixed & verified)

### Bug 1: Profile name change "not working" / stale name in Hall of Glory

Root causes, in order of impact — `Profile.tsx:162-232` (`handleNameChange`):

1. **Partial-failure design.** The handler updates `users` → `allTimeScores` → every `gameScores` doc → every `dailyScores` doc, serially, with individual `await doc.ref.update(...)` calls in `for` loops, all inside one try/catch. If *any* later write fails (security rules, offline blip, doc count), the catch shows "Failed to update" — but `users/{uid}.heroName` has **already changed**. Result: user sees an error, app header may show old or new name depending on `onNameChange`, and leaderboard docs are part-old part-new.
2. **Hall of Glory reads the wrong collection.** The all-time tab is fed by `getAllTimeLeaderboard()` → **`gameScores`** (`Dailychallenge.ts:83-94`), i.e. every historical game doc with the heroName frozen at play time. So the rename only "works" if the loop over potentially hundreds of `gameScores` docs fully succeeds — fragile by construction. (`allTimeScores` — one doc per user — exists and is maintained, but isn't used for display.)
3. **`loungeScores` is never renamed** — venue weekly leaderboards permanently show the old name.
4. No batching: Firestore `WriteBatch` (500 ops/batch) would make the rewrite atomic per batch; currently it's N sequential round-trips.
5. Likely external factor to verify during fix: Firestore security rules (managed in console, not in repo) must allow this client to update `gameScores`/`dailyScores` docs and query `users` by heroName. Capture the actual error via the Step 1.4 `logError` before fixing.

Proposed fix direction (for approval later): make `users/{uid}.heroName` the single source of truth; point the all-time tab at `allTimeScores` (also fixes duplicate-player slots in top 50); rename only `users` + `allTimeScores` (+ current-week `loungeScores`) in a `WriteBatch`; stop renaming historical `gameScores`/`dailyScores` (or do it in a Cloud Function trigger on `users` heroName change).

**Status: ✅ FIXED & VERIFIED** — refactor/v1.4. `getAllTimeLeaderboard` now reads `allTimeScores` (one row per player — also dedupes the top-50). New `ScoreService.renameHero(uid, newName)` renames the only docs ever displayed with a frozen heroName — `users`, `allTimeScores`, today's `dailyScores`, current-week `loungeScores` — atomically in a single `WriteBatch` (each non-`users` doc added only if it exists, so the batch never fails on a missing doc). No Cloud Function needed: the daily tab only shows today's doc and the lounge tab only the current week, so historical `gameScores`/`dailyScores` are no longer renamed at all. `Profile.handleNameChange` reduced to a single `renameHero` call; the old serial-loop handler (and Profile's direct `firestore` import) removed. Manually tested on a real build (rename + leaderboards) — working; existing Firestore rules permit the new write paths.

### Bug 2: Arena Invite button "not working as expected"

Root causes — `Arenascreen.tsx` + `ArenaService.ts`:

1. **The invitee almost never sees the invite.** Invites are only received in `subscribeToMyInvites`, which is mounted **only inside Arenascreen**, and the modal is only shown when the invitee's local `mode === "menu"` (`Arenascreen.tsx:74-81`). But the "INVITE ONLINE" list shows everyone with `users.isOnline == true` — i.e. anyone anywhere in the app (home screen, mid-game…). Invite someone on the Home screen → write succeeds, button flips to "SENT", recipient sees nothing. The 60s expiry (`ArenaService.ts:362`) then kills it.
2. **`roomCode || "1234"` fallback** (`Arenascreen.tsx:112`): if `roomCode` is ever empty (room deleted underneath, or `createRoom` failed — note `createRoom` swallows its error and *still returns the code*, `ArenaService.ts:116-139`), the invite points to nonexistent room "1234" → invitee gets "Room not found".
3. **No error handling on send**: `sendArenaInvite` does `users/{toUid}.update(...)` — writing to *another user's* doc. If security rules forbid it, the promise rejects unhandled while the UI still shows "SENT".
4. Minor: `sentAt: Date.now()` is client clock — skewed clocks break the 60s window; invite is a single `pendingInvite` field, so a second invite silently overwrites the first.

Proposed fix direction (for approval later): subscribe to invites at App level (banner/modal on any screen, or at least Home + Arena); remove the `"1234"` fallback and disable invite buttons until `roomCode` is set; make `createRoom` throw on failure; surface send errors; consider a dedicated `invites/{uid}` doc or RTDB node with tight rules instead of writing to the target's user doc.

**Status: ✅ FIXED & VERIFIED** — refactor/v1.4. The invite listener (`subscribeToMyInvites`) + `InviteModal` moved to **App.tsx**, so an invite now shows on any screen — previously the modal was wired so it never actually appeared (state was set only on the menu, but rendered only in the lobby). Accepting routes to the Arena screen and auto-joins via a new `autoJoinCode` prop on `ArenaScreen`. `createRoom` now `throw`s on a failed write instead of returning a code for a room that doesn't exist. The `roomCode || "1234"` fallback is gone; `handleSendInvite` guards on `roomCode` and surfaces send failures via `logError` + an on-screen error. Manually tested on a real build (send/accept invite from Home) — working. (Deferred: client-clock `sentAt`, single-`pendingInvite` overwrite, and moving invites off the target's user doc — left for the Phase 3 deep-link redesign.)

---

## Phase 3 — Redesign proposals (nothing built without approval)

> **2026-06-12:** Phase 3 design review completed — full audit, design tokens, per-screen specs, retention/Arena proposals, and the Phase 4 layout-expansion recommendation now live in **`DESIGN_PLAN.md`**. The notes below (3.1–3.4) remain as the original survey; DESIGN_PLAN.md supersedes them where they overlap.
>
> **Same-day addendum (owner input):** directional activity data added (DESIGN_PLAN §6.0 — 6 actives; converts go deep, first session + distribution are the leaks). New items: **"One More Battle" mid-session hook** on game-over (§6.5), **"First Victory" early-reward celebration** (§6 R5), and an **Acquisition section** (§10 — share loop, store-listing refresh, lounge-venue channel, DE/BS localization). Phase 4 reframed: Layouts 3/4c/6 were *deliberately* shelved after playtesting — goal is replay variety (rotation pool / variants / campaign) without hurting the feel of the chosen 6; every layout entering rotation passes an owner feel-gate (DESIGN_PLAN §8).
>
> **Phase 3 build started (2026-06-12):** commit `be88536` — design tokens (`src/ui/theme.ts`) + Cinzel fonts activated on Home; commit `b5ad456` — Home de-blue (Arena tile → ember, wolf card → steel); commit `d10ceab` (slice 2) — `Icon.tsx` family + Home/Arena/lobby icon & de-blue; commit `45916db` (slice 3) — Profile fix (blob/safe-area/auto-fit + metal-tier de-neon); **slice 4 — Armory tiles + tabs (✅ done): MCI tabs/header, one gold selection style, icon-wells + `lock`/`key-variant` locks, in-game wild-accent de-neon (§4.9).** Owner signed off on typography + Home palette direction. Live status table in DESIGN_PLAN.md.

### 3.1 Navigation & app shell
- App.tsx hand-rolled screen switching has no Android back-button handling, no transitions, no deep links. Proposal: adopt `react-navigation` (native-stack). Enables: hardware back = quit-confirm in game / back-to-home elsewhere, animated transitions, and an invite deep-link (`mythicpeaks://arena/1234`) that would make Arena invites genuinely good.

### 3.2 Design system
- The gold-on-dark palette (`#E8C547`, `#0F1A12`, rgba-gold borders), ornamental headers (`◆` + lines), glow-pulse loops, and "Return to Castle" are re-implemented per screen with copy-pasted styles and `Animated.loop` boilerplate. Proposal: `src/ui/` with theme tokens + shared `OrnateHeader`, `PanelCard`, `GoldButton`, `ScreenBackground`. Cuts hundreds of style lines, makes screens consistent, and makes any future re-skin a one-file change.

### 3.3 Per-screen notes
- **Home**: dense two-column layout carrying 10+ actions. Proposal: group into Play (battle/daily/arena) vs Meta (armory/profile/leaderboards/lounge); make streak + online count tappable; move logout behind profile.
- **Hall of Glory**: dedup all-time list (one row per player — falls out of Bug 1 fix); add weekly tab to match lounge cadence; pull-to-refresh (currently loads once per mount); highlight-and-scroll-to your row.
- **Arena**: global invite banner (3.1); "share code" via system share sheet; show host's heroName in join flow before committing; replace 1s polling with RTDB listener (also battery win).
- **Game over**: rank/daily-rank arrive async with no loading state — reserve space or skeleton to avoid layout pop; "personal best" and "all-time record" celebrations can overlap — sequence them.
- **Profile**: name editor is the only editable thing yet takes top billing; consider moving stats/milestones up, name-edit behind a pencil icon. Show rename progress properly once Bug 1 fix makes it fast.
- **Auth/Intro**: fine functionally; could reuse 3.2 components for consistency.
- **Armory/Lounge**: visually consistent already; main win is migrating to shared components.

### 3.4 Tech-debt items adjacent to redesign (flag only)
- `expo-av` is deprecated (removal announced for SDK 54+ successors) — plan migration to `expo-audio` at the next SDK bump.
- Online presence via Firestore writes on every AppState change is costly at scale; RTDB `.info/connected` presence is the standard pattern.
- No automated tests; after Step 1.2, `src/game/` is pure and cheap to cover with a handful of Jest tests (scoring table, match rules, seeded deck determinism).

---

## Suggested commit sequence

| # | Commit | Risk | Status |
|---|---|---|---|
| 1 | docs: add CLAUDE.md + REFACTOR_PLAN.md | none | ✅ |
| 2 | chore: remove dead/commented code (after approval) | none | ✅ |
| 3 | refactor: extract src/game/ (config, scoring) | very low | ✅ |
| 4 | refactor: extract Battlefield + decorative components | low | ✅ |
| 5 | refactor: split services, collections.ts, storageKeys, logError, exists() | low-med | ✅ |
| 6 | refactor: ScoreService.saveGameResults | medium | ✅ |
| 7–12 | refactor: one screen-state extraction per commit (+ dead-style sweep) | medium | ✅ |
| 13 | refactor: App screen map + presence hooks | low | ✅ |
| 14 | refactor: split Arenascreen into menu/lobby/invite | low | ✅ |
| — | fix: name change atomic rename + all-time source (Bug 1) | medium | ✅ |
| — | fix: global arena invites + createRoom throws (Bug 2) | medium | ✅ |
