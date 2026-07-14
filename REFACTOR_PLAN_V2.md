# Mythic Peaks — Refactor & Improvement Plan V2

*Written 2026-07-14 by Fable 5, against `refactor/v1.4-phase3` @ `3c3d3bd`. This document supersedes the forward-looking parts of REFACTOR_PLAN.md — that file remains the historical record (Phases 1–3, the Critical Analysis of 2026-07-13, and the build-out log). Everything below was re-verified in code today, not carried forward on trust. Analysis and planning only; nothing here is built.*

**How to read it:** §1 is the Critical Analysis v2 — where every finding stands now, including the facts that moved. §2 is the prioritized plan for the next builder (written for Opus: each package has a design sketch, files, owner gates, and risks). §3 is the verdict — the sequencing judgment and what not to do.

---

## 1. Critical Analysis v2 — status, code-verified 2026-07-14

### 1.1 The build-out holds — rows 1–9 all verified in code

Every BUILD row of the 07-13 verdict table is real, on the branch, and where it should be:

| Row | Finding | Verified in code |
|---|---|---|
| 1 | Field Crowns | `d053ad7` — `fieldCrownsRef` + `StorageKeys.fieldCrowns` (`Game.tsx:165-170, 727-740`), persisted at **field end**, surfaced in the Breath (23 refs in `BetweenLevelsScreen`) + game-over (17 refs) |
| 2 | Goal module | `79167cf` — imminence ladder lives in `GameOverScreen.tsx:327+` (Armory battles → rank tier → PB gap → named rival) |
| 3 | Second Blade coach mark | `450dd4d` — fourth mark present in `CoachMarks.tsx` |
| 4 | Prize visibility | `79167cf` — `src/game/prize.ts`; Scoreboard prize strip (`Scoreboard.tsx:759`); game-over "SEAT #N PAYS €X AT MONTH'S END" (`GameOverScreen.tsx:559`) |
| 5 | Dead-tap reject | `8456773` — `SoundService.playReject()` at `Game.tsx:916-919` |
| 6 | Glory disarm | `8456773` — `toggleGloryHunt` in `Game.tsx` |
| 7 | Sound pass | `31b1847` — `SoundService.playAt` shipped; game/ screens now speak (GameOver ×4 calls, Breath, PreBattle — was zero) |
| 8 | Portcullis "two hinges" | `9f9de3e` — `LayoutPortcullis.tsx`; verifier graph updated (`verify-layouts.js:265`) |
| 9 | Eyrie "grip and weave" | `6b03ad9` — `LayoutEyrie.tsx`; verifier graph updated (`verify-layouts.js:299`) |

The in-run game has no known unaddressed finding left. Further in-run polish is now procrastination.

### 1.2 Corrections — facts that moved since the 07-13 analysis was written

1. **"FCM has never sent anything" was imprecise.** One Cloud Function exists: `onAllTimeRecordBroken` (`functions/src/index.ts:8`) — a Firestore trigger on `allTimeScores/{uid}` that broadcasts "ALL-TIME RECORD BROKEN!" to the `alltime-record` topic, which Authscreen subscribes every user to (`Authscreen.tsx:61-63, 135-137`). So the push *pipeline* is proven end-to-end. What's still true: no per-user tokens are stored, nothing is scheduled, and — new finding — **`requestPermission()` is never called**, so on Android 13+ (runtime `POST_NOTIFICATIONS`) even the record push likely never displays. The retention-notification gap is real; the plumbing gap is smaller than the analysis claimed.
2. **"Retreat saves nothing" is no longer fully true.** Field Crowns persist the moment a field ends, "run dead or alive" (comment at `Game.tsx:727-729`) — a run abandoned at field 5 keeps any crowns taken in fields 1–4. What finishing still uniquely provides: the battle-gate tick (`incrementGamesPlayed` fires only at game-over) and the score submit. `handleConfirmQuit` (`Game.tsx:1121-1128`) itself still banks nothing — correct now that crowns self-bank.
3. **Post-wipe broadcast noise.** After the `allTimeScores` wipe, *every* new #1 in the launch scramble fires the record broadcast to all users. At launch scale that's either free drama ("the throne changed hands again") or spam — owner should decide keep/throttle *before* the wipe, not after the third push in an hour.
4. **`onRoomUpdate` still polls** RTDB in a 1s `once("value")` loop (`ArenaService.ts:239-251`) — the old cross-cutting item stands (a `.on("value")` listener elsewhere in the file is a different subscription).

### 1.3 The ten open items — Critical Analysis v2 status

1. **The sign-in wall** *(row 10)* — **OPEN, verified.** `handleGoogleSignIn` (`Authscreen.tsx:74-93`) is the only path into the app; no `signInAnonymously` anywhere in `src/`. Still the single largest funnel hole, and it now actively fights the marketing plan: MONETIZE.md's Lever 3 ("€100/month, 6 players") is designed to spike installs from exactly the strangers this wall turns away. → Tier 1.
2. **Notifications at ~zero** *(row 11)* — **OPEN, refined by §1.2.1.** One broadcast exists; zero personal sends. Streaks still die silently; the Ember Ward still forgives days nobody knew they missed. The Android 13+ permission gap means even the existing push is likely invisible. → Tier 2.
3. **Async duels / the share dead-end** *(row 12)* — **OPEN, verified.** Share is plain text + store link (`GameOverScreen.tsx:322-324`); no duels code anywhere. Arena still requires both players online now. The only self-multiplying loop the game could have remains unbuilt. → Tier 3.
4. **Every day identical / Daily Edict** *(row 13)* — **OPEN, blocker confirmed in code.** `saveGameResults` calls `submitAllTimeScore` unconditionally (`ScoreService.ts:428`) — daily runs feed the eternal board, so score-affecting edicts pollute it. Also verified: lounge submits fire on every run including daily, so edicts would ripple into venue weekly boards too. The decouple decision must precede any edict work. → Tier 4.
5. **The 10-minute indivisible unit** *(row 14)* — **OPEN, softened.** Crowns (§1.2.2) mean an abandoned run is no longer a total loss, but the atomic unit of play is still one 7-field run and mobile's is 2–3 minutes. Skirmish mode remains the answer and remains a Phase-4-sized surface. → Tier 6.
6. **Timer-vs-demographic tension** *(row 15)* — **FLAG, unchanged by construction.** Positioning fact: every mode is timed; the stated audience plays solitaire to relax. Handle in store-listing copy (sell the war campaign, don't promise relaxation), not in code.
7. **The first ten runs are the weakest ten** *(§4 residual)* — **NARROWED.** New players now get crowns from run 1 (per-field goals that don't need a PB), the goal module, the prize strip, and four coach marks. What they still lack: an opponent (item 3), a reason tomorrow differs (items 2, 4), and a frictionless entry (item 1). No separate build — this finding *is* items 1–4.
8. **Three proper-noun ladders shouting at once** *(§3.5, never got a verdict row)* — **OPEN, untouched — now the cheapest unaddressed finding.** Rank titles, banner titles, field names: all gold, all Cinzel. The fix is copy hierarchy, not systems: mid-run, gold shouting belongs to the banner ladder alone. → Tier 5.
9. **The share artifact is words** *(§5 residual)* — **OPEN.** Text-only share; no image card (`react-native-view-shot` is a native dep → prebuild + signing-restore cycle — never worth doing alone; bundle with the next forced native change). The *challenge* half of the share problem belongs to item 3. → Tier 6 (bundled).
10. **Nothing accumulates between runs** *(§2.2 residual)* — **OPEN BY DESIGN, hold.** Crowns + the goal module made the Armory ladder visible, which was the cheap 80%. The full answer (currency/XP/collection) is meta-economy work that MONETIZE.md's trigger ladder explicitly defers below ~100 actives. Do not invent a currency for 6 players. → deliberately parked.

**Carryover debt (verified still present, none release-blocking):** `useUserStats` loads once per session (Home streak/ward chip stale until restart); Android hardware back unhandled anywhere (`BackHandler` appears nowhere in `src/`); arena 1s polling (§1.2.4); `expo-av` deprecated (migrate at next SDK bump); Scoreboard/Profile still carry private copies of the honor-card grammar + TabBar unextracted; `migrateArmoryIfNeeded` retirement question; zero automated tests over the now-pure `src/game/`.

---

## 2. The plan for Opus — prioritized, dependency-true

### 2.0 Ground rules (read before building anything)

- **Build workflow is sacred** (CLAUDE.md): JS/TS-only → `cd android && gradlew bundleRelease`. Never run `expo prebuild` casually — it wipes the signing config, which must be manually restored. Never suggest EAS. NDK stays pinned.
- **Small slices, every slice builds**: `npx tsc --noEmit` after every step; `node scripts/verify-layouts.js` whenever any `Layout*.tsx` is touched (layouts must stay symmetric + machine-verified — owner constraint).
- **Scoring is frozen without explicit approval** + a stated magnitude rationale (UNBROKEN precedent). Refactors never change gameplay behavior.
- **Sound invariant**: any sound played with rate/volume variants anywhere must route through `SoundService.playAt` everywhere.
- **Owner gates are real gates.** Several packages below need console work (Firebase Auth provider, Firestore rules, Functions deploy, Blaze plan) that only the owner can do — each package states its gate. Ask, don't assume.
- **Doc hygiene**: log shipped slices in the relevant doc (GAMEPLAY.md for mechanics, DESIGN_PLAN.md for screens, this file's tiers for status), keep CLAUDE.md's Current state paragraph true.

### Tier 0 — Ship v1.4 (nothing new; unblock everything)

Everything in MARKET.md and MONETIZE.md gates on v1.4 being live; every tier below compounds only after it. Support work:

1. **Owner playtest gate** — The Siege, The Portcullis, The Citadel, The Eyrie, Dragon's Spine base. On-device sound checks in the same session: capture pitch ladder feel (Android ExoPlayer rate), defeat knell volume, reject thud frequency — if the reject grates at ~half of taps, drop volume 0.45→0.3 *before* touching anything else. Also: Daily-tab podium fix confirm (`a3c266d`).
2. **Release build** — `gradlew bundleRelease` has not been run since the JS-only sessions; run it, smoke the AAB on-device (one full run, one daily, one 2-player arena).
3. **The wipe** — owner decision, then a one-shot script (repo `scripts/`, admin SDK) deleting `allTimeScores/*` and resetting `users.*.bestScore` (v1 profile PBs are 5–20× out of scale and would poison the goal module's PB-gap goal). **Decide §1.2.3 (record-broadcast throttle) in the same breath.**
4. **The local-records wrinkle (flag to owner, cheap either way)** — veterans' devices hold v1-scale local PBs and ghost paces (`@mythic_best_run_pace`). Old 6-field ghosts already self-heal, but v1-scale totals make THE SHADOW unreachable and mute the PB-gap goal. Option: one-time local reset keyed on first v1.4 launch. One small slice if wanted.
5. **Prize terms page** (MONETIZE §4 requires it before Lever 3 fires) — 10 lines, hosted anywhere public; code assist is just linking it from the Guide's prize slide if asked.

### Tier 1 — Tear down the wall: anonymous auth → link-at-first-score *(row 10)*

**Why first among features:** every acquisition lever points strangers at the listing; today the first screen bounces them. This must beat the marketing crescendo, or the crescendo is wasted.

**Design:**
- First open: `auth().signInAnonymously()` → straight into Home. No heroname step, no wall. The €100 pill stays — stakes before commitment is the right order.
- **Anon can:** play free battles fully — crowns, ghost, local PB, coach marks, First Victory all already work off device state. **Anon cannot:** submit scores, appear in any Hall, play Daily/Arena/Lounge (identity modes; Daily's one-attempt enforcement is doc-keyed anyway). Lock those tiles with in-fiction copy ("Etch your name to take the Daily Quest").
- **The link moment:** first game-over, where the rank line renders today, anon users get the prompt instead: "ETCH YOUR NAME IN THE HALL" → Google sign-in → `currentUser.linkWithCredential(googleCredential)`. **Linking preserves the uid**, so no schema or data migration exists at all — that's the entire reason this design is cheap.
- **Edge (must handle):** linking when the Google account already owns a users doc (veteran reinstalling) throws `auth/credential-already-in-use` → catch, `signInWithCredential` instead, proceed as that user. Device-local progress made while anon stays on the device (acceptable, note in code).
- After link: existing heroname step runs (or existing profile loads), then the held score submits.

**Files:** `Authscreen.tsx` (restructure), `App.tsx` (auth-state branch), Home tiles (lock states), `GameOverScreen` (link prompt in the rank slot), `saveGameResults` callers (gate on non-anon).
**Owner gates:** enable Anonymous provider (Firebase console, one toggle); confirm Firestore rules don't require a provider claim (anon sessions still satisfy `request.auth != null` — but rules are console-managed, so verify, don't assume).
**Risk:** medium — touches the auth spine. Mitigate: keep the Google-only path compiling behind the flow until the new one is device-verified. **DoD:** fresh install reaches a dealt board in <15s with zero prompts; link mid-session produces a Hall entry with the right uid; veteran reinstall path verified.

### Tier 2 — Give tomorrow a voice: notifications v1 *(row 11)*

**Design (server push — no native dep, no prebuild):**
- **Client slice:** call `messaging().requestPermission()` at a *contextual* moment — first game-over with a streak ≥ 1 ("we'll guard your streak"), never at auth; store `getToken()` → `users/{uid}.fcmToken` + `onTokenRefresh`. This slice alone also fixes §1.2.1's Android 13+ gap for the existing record push.
- **Server slice (owner deploys):** one scheduled function (`onSchedule`, ~18:00 Europe/Vienna) — read `users` where the streak fields say "played yesterday, not today" (the same fields `useUserStats` reads; verify exact names in code) → streak-at-risk push ("Your {n}-day streak ends at midnight. The Ember Ward can't save you twice."); a second variant for daily-quest-not-taken. Cap: one push/day/user, streak ≥ 2 only. At current scale the reads are trivial.
- **Owner gates:** Functions deploy pipeline (exists — `onAllTimeRecordBroken` proves it), **Blaze plan for Cloud Scheduler** (scheduled functions require it — confirm before writing code), the §1.2.3 broadcast decision.
- **Explicitly not v1:** stop-after-3-ignored (needs open tracking), notification settings UI, rich media. **DoD:** a real device with the app backgrounded receives the streak push at the scheduled hour; Android 13 permission flow verified.

### Tier 3 — Give friends a way in: async duels + challenge codes *(row 12, §5)*

**Sequenced after Tiers 1–2 deliberately:** a challenged stranger must not hit the wall (Tier 1), and a duel answered while you sleep needs a push to close the loop (Tier 2).

**Design sketch (DESIGN_PLAN §7 A1, sharpened):**
- **Enabler slice (tiny, do first):** seed *every* free run (random seed per run, kept in state). No gameplay change — decks were already random; now they're reproducible. This makes any just-finished run challengeable, which puts the challenge button on the emotional peak (game-over) instead of a menu.
- `duels/{code}` (Firestore): 6-char code, challenger uid/name/score, `seedBase`, `createdAt`, `expiresAt` (+24h), opponent uid/name/score (null until answered), `state: open|answered|expired`. Seed feeds the existing seeded-deck + seeded-bounty infra (the daily pattern) — fairness falls out for free.
- **Challenger flow:** game-over → "CHALLENGE" ghost row beside SHARE → creates doc → share sheet text: *"I took 1.2M spoils off this exact deck. Code MK7Q2B — beat me in Mythic Peaks. {store link}"*.
- **Receiver flow:** Arena menu gains "ANSWER A CHALLENGE" → code entry (the room-code grammar exists) → plays the same 7-field run → score writes to the doc → challenger gets the Tier-2 push ("{name} answered — 1.4M to your 1.2M"). Game-over renders a two-row duel verdict when mode is duel.
- **Deep links (`mythicpeaks://duel/CODE`) are v2**, and they're the moment `react-navigation` finally earns its adoption cost (DESIGN_PLAN 3.1) — do not adopt navigation before this needs it.
- **Owner gates:** Firestore rules for `duels/` (console-managed — create for any authed user, score-field updates by participants only). **Risk:** medium-high (new mode touches Game's mode plumbing — dailyMode/arenaMode grow a sibling; keep duel runs out of allTime/lounge submissions). **DoD:** two devices complete a full duel round-trip including the push; an anon receiver can answer after linking.

### Tier 4 — Make tomorrow different: the Daily Edict *(row 13 — decision before code)*

**The decision memo to put to the owner (blocking):** daily runs currently feed `allTimeScores` (verified, `ScoreService.ts:428`) *and* the weekly lounge boards. Two options:
- **A (recommended): decouple.** Daily scores stop feeding the all-time board (one guard at the verified line; decide lounge in the same pass). Rationale: CLAUDE.md's own schema intent (allTimeScores = the all-time board), prize integrity (one-attempt seeded runs and unlimited free runs are different competitions), and it unblocks score-affecting edicts. **The wipe is the once-only moment to do this** — "boards reset; the Daily is its own ladder" is one story instead of two migrations.
- **B: score-neutral edicts only.** Honestly weak — nearly every interesting modifier moves score. Listed for completeness.

**Edict v1 (after A):** seeded per-day pick from a small hand-tuned table (e.g. BOUNTY EDICT: +2 bounty slots · LONG FUSE: +20% time · IRON EDICT: no Free Draw, +flat bank). Same edict for every player on a date — the daily board is per-date, so fairness holds by construction. Surface: pre-battle sealed-quest card names the edict; **AlreadyPlayedScreen teases tomorrow's** ("TOMORROW: THE IRON EDICT") — the return hook lands exactly where returners already look. **Risk:** low-medium once decoupled; edicts touch `initLevel` config only. **DoD:** verifier still passes (edicts must never alter blocking graphs), same-date determinism verified on two devices.

### Tier 5 — Small blades (each ≤ half a day, slot between tiers)

1. **The proper-noun quieting** *(item 8)*: one rule — mid-run, gold Cinzel shouting belongs to the banner ladder alone; field names demote to steel caption grammar at the Breath/pre-battle; rank titles live only on Profile/Hall. Copy + style pass, display-only.
2. **`useUserStats` refresh** — refetch on return-to-Home (or AppState resume); kills the stale streak/ward chip.
3. **`migrateArmoryIfNeeded` retirement** — owner yes/no; delete or keep, one line either way.
4. **Repo hygiene** — debug scripts (`check_activity.js`, `reset-users.js`) into `scripts/`.
5. **Jest over `src/game/`** — scoring table, match rules, seeded-deck determinism. Cheap now, and Tiers 3–4 both lean on seeding correctness; write these *before* Tier 3 if convenient.

### Tier 6 — Parked, with conditions written down

- **Skirmish mode** *(row 14)*: one field, own micro-ladder, no eternal-board writes. Build only on explicit owner appetite — it's a new mode (MARKET.md §10 warns against modes-for-marketing) and the Daily already serves the short session poorly rather than not at all.
- **Share image card** *(item 9)*: `react-native-view-shot` — bundle with the next unavoidable native change (IAP per MONETIZE's ladder, or expo-notifications if server push ever proves insufficient). Never prebuild for this alone.
- **Between-run accumulation / meta-economy** *(item 10)* + **supporter sigil / paid rack**: gated on the MONETIZE.md trigger ladder (~100 actives for the sigil). Do not front-run it.
- **Tech-debt lane** (background, non-blocking, verified §1.3): arena poll → listener; RTDB `.info/connected` presence; `expo-av` → `expo-audio` at the next SDK bump; hardware back via the Tier-3 navigation adoption (not before); TabBar extraction + honor-grammar collapse (3 copies); Lounge & Arena menu identity passes — **blocked on device screenshots** (blind token passes read flat; owner input).

---

## 3. Fable's Verdict

**The game inside a run is finished.** Rows 1–9 closed the last known in-run findings, and the code agrees with the docs — I checked. The remaining problems are all *around* the loop: who gets to it (the wall), why they return to it (silence), and who they bring (no loop). Every hour spent adding another in-run flourish is now an hour taken from the only problems that decide whether installs #17–100 stay.

**The order is dependency-true, not taste.** Ship v1.4 (everything downstream compounds on it, and the wipe is a once-only story). Then the wall, *before* the marketing crescendo points strangers at it. Then notifications, because duels without result-pushes are half a loop. Then duels, because they're the only self-multiplying feature this game can build, and they need both predecessors. Then the edict, because it needs the wipe-moment decoupling decision that only makes narrative sense once. Swapping any two adjacent tiers wastes part of the later one.

**Three cheap truths worth acting on this week:** the Android 13+ permission gap means the one push that exists probably reaches nobody (Tier 2's client slice fixes it in an afternoon); the post-wipe record broadcast will fire on every throne change in launch week (decide throttle vs. drama before the wipe); and the proper-noun quieting is the last 07-13 finding fixable in a day.

**What not to do** (all previously decided; re-litigating them is drift): no monetization below ~100 actives, no ads ever in the current identity, no tournament entry fees ever, no new modes for marketing's sake, no in-app localization yet, no iOS yet, no EAS, no scoring changes without stated magnitude, no layout that isn't symmetric and machine-verified, and no prebuild without budgeting the signing-config restore.

**In one sentence:** ship it, tear down the wall, give tomorrow a voice, give friends a way in, let the board's own drama do the shouting — in that order, one slice at a time, and let the trigger ladder tell you when the first euro is worth asking for.

---

*Status ledger for this doc: §1 verification complete (2026-07-14). Tiers 0–6 not started. When a tier ships, log the slice here and keep CLAUDE.md's Current state true.*

---

### Owner-playtest fix pass — 2026-07-14 (Tier 0 support + Tier 0.3/0.4 prep)

Five fixes off the owner playtest, one commit each, `tsc` clean throughout (verifier re-run on the layout fix):

1. **Fix 1** (`483da57`) — the Breath reveal card overlapping the header/notes on a cleared field in landscape. Card now sizes to the measured stage.
2. **Fix 2** (`7482939`) — **The Siege endgame ease.** The keep gated on both flanks at once (gates needed both wall-ends, hearts needed both halls) → a single-file stall. Split into two independent flank chains: `26←16→28→30`, `27←19→29→31`. Still symmetric + machine-verified. last-5 2.6→1.9, dead 54→51%.
3. **Fix 3** (`acfb70e`) — **v1-scale local reset.** `resetV14LocalScaleIfNeeded` clears `@mythic_best_run_pace` + `@mythic_peaks_scores` once per device (gate `@mythic_v14_reset_done`), called at App startup. Fixes THE SHADOW/PB-gap after the wipe (Tier 0.4).
4. **Fix 4** (`36f0f14`) — **daily/all-time decouple.** `submitAllTimeScore` now guarded on `!dailyMode` (`ScoreService.ts`). Daily feeds the daily board only. Lounge submission deliberately left as-is (Tier 4 decision). Partially closes §1.3 item 4 blocker.
5. **Fix 5** (`d88e210`) — **the wipe script.** `scripts/wipe-alltime-scores.js` (admin SDK, `reset-users.js` pattern, chunked ≤500 batches): deletes `allTimeScores/*`, resets `users.bestScore=0`. Owner-run once pre-release — **not run.** This is Tier 0.3's script half; the record-broadcast throttle decision (§1.2.3) still open.

Still open on Tier 0: owner on-device playtest of the changed boards (The Siege now among them), release `bundleRelease` + smoke, the wipe run itself + throttle decision, prize-terms page.*
