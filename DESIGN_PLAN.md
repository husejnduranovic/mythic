# Mythic Peaks — Phase 3 Design, UX & Retention Plan

Written 2026-06-12 from a full audit of the codebase (branch `refactor/v1.4-phase3`) and 12 labeled screenshots in `C:\Users\GAMING PC\Desktop\refactor-images`. Nothing here is built yet — every item needs owner approval before implementation. Items are specified to be implementation-ready for a future session.

**North star:** the app icon (`assets/icon.png`) is the best-looking asset the product has — engraved gold/teal beast crests on dark-green cards, ornate serif title, painterly forest. The in-app UI should converge on that look. Today the gap is: system emojis as icons, off-palette neon accents (blue/purple/magenta), default Roboto everywhere, and "glows" that render as hard-edged blobs.

**Screenshot → screen → file map** (for the implementing session):

| Screenshot | Screen | Files |
|---|---|---|
| home-screen.jpg | Home | `src/components/Homescreen.tsx` |
| game-screen.jpg | Game board | `Game.tsx`, `Card.tsx`, `Timer.tsx`, `game/Battlefield.tsx`, `game/Wall.tsx` |
| betwee-layouts.jpg, game-completed-1.jpg | Between levels | `game/BetweenLevelsScreen.tsx` |
| game-completed-2.jpg, high-score.jpg | Game over / record | `game/GameOverScreen.tsx`, `RecordCelebration.tsx`, `PersonalBestBanner.tsx` |
| profile-screen.jpg | Profile | `Profile.tsx` |
| scoreboard-screen.jpg | Hall of Glory | `Scoreboard.tsx` |
| arena-screen.jpg | Arena menu | `arena/ArenaMenu.tsx`, `arena/arenaStyles.ts` |
| arena-lobby.jpg | Arena lobby | `arena/ArenaLobby.tsx`, `arena/InviteModal.tsx` |
| armory-card-backs.jpg, armory-wild-card-screen.jpg | Armory | `Armory.tsx` |

---

## 0. Priority matrix (impact × effort)

| # | Item | Impact | Effort | Phase |
|---|---|---|---|---|
| P0-1 | **Activate the medieval fonts** (Cinzel is installed but never used — zero new deps) | Very high | Low | 3 |
| P0-2 | **Profile screen fix** (blob bug + safe-area + scaling — it's visibly broken today) | Very high | Low-Med | 3 |
| P0-3 | **Kill off-palette accents** (blue Arena, purple Free Draw, magenta/cyan combos, rainbow ranks, red/white Armory selection) | High | Low | 3 |
| P0-4 | **Icon system**: replace UI-chrome emojis with tinted `@expo/vector-icons` (JS-only dep) | High | Medium | 3 |
| P0-5 | **`src/ui/theme.ts` tokens** — colors/type/spacing/radii; new code consumes it from day 1 | High (enabler) | Low | 3 |
| P1-1 | Shared components (`GoldButton`, `PanelCard`, `OrnateHeader`, `TabBar`, `SelectableTile`, `Medal`, `CodeDigits`) + migrate the 6 menu screens | High | Medium | 3 |
| P1-2 | Between-levels & game-over layout rebalance (dead space → next-battlefield panel, async-rank placeholder) | Medium-High | Low-Med | 3 |
| P1-3 | Retention: day-1/day-2 FCM nudge + first-battle coach marks | High | Low-Med | 3 |
| P1-4 | Arena: async duels ("Challenges") — removes the both-online-now requirement; also the strongest viral-loop carrier (§10) | High | Medium-High | 3/4 |
| P1-5 | **Mid-session hook:** "One More Battle" goal module on game-over (§6.5) | High | Low | 3 |
| P1-6 | **First Victory** celebration → Armory claim flow (§6 R5) | High | Low-Med | 3 |
| P1-7 | **Acquisition:** share-score loop now + store-listing refresh once redesign ships (§10) | High | Low | 3 |
| P2-1 | Warrior's Path onboarding checklist (7 steps, Armory rewards) | Medium-High | Medium | 3 |
| P2-2 | Arena cosmetic monetization (banners/backs/taunts, no P2W) | Medium | Medium | 4 |
| P2-3 | `react-native-svg` for real radial glows/vignettes (native dep — build caution) | Medium (polish) | Medium | 3, late |
| P2-4 | Hall of Glory: weekly tab, pull-to-refresh, scroll-to-self | Medium | Low-Med | 3 |
| P3-1 | **Layout expansion / Conquest progression** — recommend split to **Phase 4** (see §8) | High | High | **4** |
| P3-2 | Card-art pass: replace card-face beast emojis with commissioned crests (match icon.png) | Medium-High | High (art) | 4/5 |

"Phase 3" items are UI/UX-only and behavior-neutral unless flagged. Anything touching scoring/gameplay is explicitly out unless approved.

### Implementation status (live)

| Commit | Scope | Status |
|---|---|---|
| `be88536` | `src/ui/theme.ts` design tokens; activate Cinzel via `useGameFonts()` in App.tsx (splash held until fonts ready, silent fallback); Cinzel applied to **Home** title + primary CTA labels | ✅ shipped |
| `b5ad456` | **Home** de-blue: Arena tile `#4FC3F7` → `ember`; fanned wolf card `#2E86C1` → steel `#1A5C8A`; starts consuming `color` tokens | ✅ shipped |

Backlog status: **P0-5** (theme.ts) ✅ done. **P0-1** (fonts) 🟡 partial — infra + Home done; remaining screens migrate per-slice. **P0-3** (kill off-palette accents) 🟡 partial — Home done; Arena/lobby/timer/combo/ranks/Free Draw still neon. Everything else not started. Owner signed off on the typography + Home palette direction (2026-06-12).

---

## 1. Audit — what's working, what isn't

### Working (keep, don't regress)
- **Palette foundation**: deep forest `#0B1410` + gold `#E8C547` is distinctive and already ~80% consistent.
- **Card design** (`Card.tsx`): parchment faces, suit-tinted frames, runic card backs with medallions — genuinely good, matches the icon art. The in-game board reads premium already.
- **Ornament language**: `— ◆ —` header rules, rune watermarks, letter-spaced uppercase labels.
- **Bounty card** gold framing (game-screen.jpg, left/right edges) — exactly the right direction.
- Layout of the game board itself — owner confirms it's fine across devices. **Do not touch card positioning.**

### Broken / undermining the premium feel
1. **Dead fonts.** `@expo-google-fonts/cinzel` + `medievalsharp` are installed, `src/hooks/Fonts.ts` defines `useGameFonts()` — but it is **never called**, and `fontFamily` appears **nowhere** in the app. Every screen renders default Roboto with `fontWeight:"900"` + letterSpacing. This is the single cheapest transformation available.
2. **Emoji as UI chrome** (every screenshot). 🏟⚔🏆👤🛡📜🚪🏰👑🔥🥇🥈🥉🔒🗝💰⚡❄🕯 render as multicolored Noto glyphs that ignore the palette (blue-ribbon medals, red stadium, light-blue shield, yellow padlocks). They read "hobby project". Distinct from *card-face beasts* (🐉🦅🐺🐍), which function as illustration and can stay until an art pass (§9).
3. **Off-palette accents:**
   - Bright blue `#4FC3F7`: Arena tile (home-screen.jpg), Arena lobby "YOU" chip + player-card border (arena-lobby.jpg), lounge button, frozen timer. Blue is nowhere in the brand.
   - Purple `#5B3A8B`: Free Draw ↻ card (game-screen.jpg bottom bar).
   - Magenta `#FF00FF` / pink `#FF1493` / electric cyan `#7DF9FF`: combo milestone banners (`game/config.ts:24-32`).
   - 14-rank rainbow (`Profile.tsx:30-45`): cyan, magenta, violet `#E040FB`, `#D500F9`, `#00E5FF`…
   - Armory selection: **red ring** on card backs (armory-card-backs.jpg, "Dragon Crest") vs **white ring** on wild styles (armory-wild-card-screen.jpg, "Steel Clash") — two different selection states, both off-palette.
4. **Fake glows.** RN has no radial gradients; every "glow" is a low-opacity rounded rectangle. At ≤5% alpha it passes; the Profile screen's rank glow renders at ~8× intended opacity (bug, §5) and shows as a giant hard-edged gold blob (profile-screen.jpg).
5. **Micro-type.** Dozens of `fontSize: 6/7/8/9` labels (streak milestone names 6px, grid subs 7px). Illegible on-device; hurts perceived quality.
6. **~50 distinct hex colors** inline across components; no single source of truth (hence all of the above). `ThemeContext.ts` only themes card backs/bounty, not the app.
7. **Inconsistent disabled buttons**: "JOIN →" (arena-screen.jpg) and "Need 2+ warriors" (arena-lobby.jpg) render as mustard-filled buttons that look enabled.

---

## 2. Design tokens — `src/ui/theme.ts` (P0-5)

Single exported object; no provider needed (theme is static). All new/touched code imports from here.

```ts
export const color = {
  // surfaces
  bgBase:    "#0B1410",   // app background (existing, keep)
  bgRaised:  "#122019",   // panels / cards on base
  bgSunken:  "#081009",   // wells, code-digit cells
  bgBar:     "#18120E",   // in-game bottom bar (existing, keep)
  parchment: "#F2E8D5",   // card faces, active tabs, "YOU" chip
  parchmentDk:"#E0D2B8",  // pressed parchment
  ink:       "#1A1A1A",   // text on gold / parchment

  // brand gold ramp
  goldBright:"#FFD700",   // record/celebration moments ONLY
  gold:      "#E8C547",   // primary brand: CTAs, titles, key numbers
  goldDeep:  "#D4A017",   // pressed CTA, strong borders
  goldFaded: "rgba(232,197,71,0.55)", // secondary text
  goldLine:  "rgba(232,197,71,0.18)", // hairline borders
  goldWash:  "rgba(232,197,71,0.06)", // subtle fills

  // semantic accents (replaces all neon)
  ember:   "#FF8C00",  // Glory Hunt, streak fire, ARENA accent (replaces #4FC3F7)
  crimson: "#C0392B",  // danger, Leave Room, retreat
  blood:   "#8B1A1A",  // deep red detail (card corners use it already)
  sage:    "#7BED9F",  // success / LIVE / online (existing, keep)
  forest:  "#1E6B3A",  // cleared / serpent suit
  frost:   "#9FD8EF",  // timer-freeze ONLY (de-neoned from #4FC3F7)
  steel:   "#8FA3B0",  // neutral secondary info (replaces misc blues)
  mystic:  "#9A7FD4",  // reserved: top rank tier + storm wild style only
} as const

export const font = {
  display: "Cinzel_900Black",  // screen titles, outcome titles, MYTHIC PEAKS
  heading: "Cinzel_700Bold",   // section headers, CTA labels
  // body/numerals: system Roboto via fontWeight — Cinzel numerals are too ornate for stats
} as const

export const type = {
  overline: { fontSize: 10, letterSpacing: 2.5, fontWeight: "800" },  // labels (min size — replaces all 6–9px)
  caption:  { fontSize: 11, fontWeight: "600" },
  body:     { fontSize: 13, fontWeight: "600" },
  emphasis: { fontSize: 15, fontWeight: "800" },
  title:    { fontSize: 18, fontFamily: font.heading },
  stat:     { fontSize: 22, fontWeight: "900" },       // Roboto numerals
  hero:     { fontSize: 28, fontFamily: font.display },
  display:  { fontSize: 38, fontFamily: font.display }, // Cinzel needs less letterSpacing: use 2–4, not 10
} as const

export const space = [0, 4, 8, 12, 16, 24, 32] as const   // space[1]=4 …
export const radius = { sm: 6, md: 10, lg: 14, round: 999 } as const
export const border = { hair: 1, std: 1.5, bold: 2 } as const
```

**Font activation:** call `useGameFonts()` in `App.tsx` before rendering the screen map (hold splash via `expo-splash-screen` until loaded; on failure fall back silently to system font). JS-only change. Drop `MedievalSharp` from the hook unless used (one candidate: card `KING/KNIGHT` captions) — fewer fonts, faster load.

**Icon dependency:** `npx expo install @expo/vector-icons` — JS + font assets via already-installed `expo-font`; **no prebuild, no native rebuild needed**. Use `MaterialCommunityIcons` exclusively (one family = consistency).

**Emoji → icon map** (chrome only; card-face beasts stay):

| Emoji today | MCI icon | Tint |
|---|---|---|
| ⚔ (buttons/labels) | `sword-cross` | context |
| 🏟 Arena | `sword-cross` | `ember` |
| 🏆 Glory/trophy | `trophy-variant` | `gold` |
| 👤 Profile | `shield-account` | `goldFaded` |
| 🛡 Armory/shield | `shield-half-full` | `goldFaded` |
| 📜 Guide/Daily | `script-text-outline` | `goldFaded` |
| 🚪 Sign out | `logout-variant` | as label |
| 🏰 Return to Castle | `castle` | `goldFaded` |
| 👑 Host/#1 | `crown` | `goldBright` |
| 🔥 Streak | `fire` | `ember` |
| 🕯 (no streak) | `candle` | `steel` |
| ❄ Timer freeze | `snowflake` | `frost` |
| ↻ Free Draw | `restore` | `goldDeep` |
| 💰 Bounty default | `sack` | `#DAA520` |
| ⚡ Glory Hunt | `lightning-bolt` | `ember` |
| 🔒 / 🗝 Armory locks | `lock` / `key-variant` | `steel` |
| 🥇🥈🥉 | `Medal` component (§3) | — |
| ✎ name edit | `pencil` | `goldFaded` |
| ? empty slot | `help` | `steel` |

---

## 3. Shared components — `src/ui/` (P1-1)

Specs concrete enough to build without revisiting screenshots.

**`OrnateHeader`** — `{ icon?, title, subtitle? }`. Row: 24px hairline `goldLine` / 4px `◆` `goldFaded` / hairline; below: optional icon 22 + title in `type.display` 30 `gold`; subtitle `type.caption` `goldFaded` letterSpacing 3. Replaces hand-rolled headers on Arena/Armory/Scoreboard/Profile/Home.

**`GoldButton`** — `{ variant: "primary"|"secondary"|"ghost"|"danger", size: "lg"|"md", icon?, label, disabled }`.
- Sizes: lg height 50 / md 40; paddingH 20/14; radius `radius.md`+2.
- primary: bg `gold`, label `ink`, `font.heading` 15 letterSpacing 1.5; pressed: bg `goldDeep`, scale 0.98. Shadow: `gold` 0.35/12.
- secondary: bg `goldWash`, border `std` rgba(232,197,71,0.35), label `gold`.
- ghost: label `goldFaded` only (Return to Castle pattern: flanked by 24px hairlines, `castle` icon).
- danger: bg rgba(192,57,43,0.10), border `std` rgba(192,57,43,0.45), label `#D9604F`.
- **disabled (any variant): bg rgba(232,197,71,0.10), border `goldLine`, label rgba(232,197,71,0.35), no shadow** — fixes the mustard "looks enabled" JOIN / Need-2+-warriors buttons.

**`PanelCard`** — bg `bgRaised` @ 85% (`#122019D9`), border `std` `goldLine`, radius `radius.lg`, padding `space[4]`. Optional `accent` prop recolors border (e.g. ember for Arena tiles).

**`TabBar`** — pill row, bg `bgSunken`, radius `radius.round`. Active tab: bg `parchment`, label `ink` `type.emphasis`; inactive: label `goldFaded`, icon 14 same tint. (Scoreboard's parchment active tab is the reference — standardize it for Armory's 4–5 tabs too.)

**`SelectableTile`** (Armory) — base: bg `bgRaised`, border `std` `goldLine`, radius `radius.md`, 4 corner `◆` dots `goldLine` (existing motif).
- **Selected: border `bold` `gold` + 18px badge top-right (`gold` circle, `check` icon `ink`).** One style everywhere — kills the red ring (armory-card-backs.jpg) and white ring (armory-wild-card-screen.jpg).
- Locked: content opacity 0.35 greyscale, `lock` 22 `steel` centered, caption "Unlocks at N battles" `type.caption` `steel`; streak-locked uses `key-variant` + ember caption.
- Equipped ≠ owned: selected badge as above; owned-but-not-equipped shows no badge (tap to equip).

**`Medal`** — `{ place: 1|2|3, size?: 28 }`. Circle, fill `#E8C547`/`#C9D1D9`/`#B07B4F`, numeral `ink` 900; place 1 additionally `crown` 14 `goldBright` floated above. Replaces 🥇🥈🥉 (blue ribbons) in Scoreboard podium + prize modal.

**`CodeDigits`** — `{ code: string, size: "lg"|"md", activeIndex? }`. Cells: bg `bgSunken`, border `std` `goldLine`, radius `radius.md`, digit `font.display` 26 `gold`; active input cell border `gold`. Used in lobby ROOM CODE (display) and Join flow (input).

**`PlayerRow`** — height 44, bg `goldWash`, border `hair` `goldLine`, radius `radius.md`; leading 28px icon circle; name `type.body` `#EDEAE0`; trailing chips. Chip spec: HOST = `goldWash` bg / `goldFaded` text; **YOU = `parchment` bg / `ink` text (replaces blue `#4FC3F7` chip, arena-lobby.jpg)**; empty slot: dashed `goldLine` ring + `help` icon `steel` + "Waiting for warrior…" `steel` italic.

**`ScreenBackground`** — wraps `bgBase`, scattered runes (existing `RUNES`) at rgba-gold 0.04, optional corner vignette. Initially View-based; upgrade to SVG radial when P2-3 lands. Centralizes the `Animated.loop` glow-pulse boilerplate currently copy-pasted per screen.

---

## 4. Per-screen specs

### 4.1 Home (`home-screen.jpg` → `Homescreen.tsx`)
1. Title: `MYTHIC` → `type.display` 40, letterSpacing 4 (Cinzel carries the weight — current Roboto needs ls 10 to fake it); `PEAKS` → `font.heading` 18 ls 8 `goldFaded`; tagline `type.overline`.
2. **Arena tile de-blued**: border rgba(255,140,0,0.35), bg rgba(255,140,0,0.07), label `ember`, icon `sword-cross` 24 `ember`, shadow `ember` 0.2. Online badge stays `sage`. (Also delete the big commented-out `menuGrid` block + `loungeBtn` blue styles while touching, lines `Homescreen.tsx:336-439/500-517`.)
3. Icon rail: 4 emojis → MCI 20 `goldFaded` (map §2); labels `type.overline`.
4. Enter Battle → `GoldButton` primary lg, `sword-cross` icon.
5. Daily Quest card → `PanelCard` + 📜→`script-text-outline` 12; keep sage live-dot.
6. Sign Out → ghost + `logout-variant`; prize modal 🥇🥈🥉 → `Medal` md.
7. Fanned display cards: keep beast emojis (illustration); fix right card border `rgba(46,134,193,0.5)` → suit.wolf `rgba(26,92,138,0.5)`.

### 4.2 Game board (`game-screen.jpg` → `Game.tsx`, `Timer.tsx`, `game/Battlefield.tsx`)
1. **Free Draw card** (`Game.tsx` `freeDraw*` styles): purple `#5B3A8B` → `goldDeep` glyphs via `restore` icon (center 28, corners 10), border rgba(184,134,11,0.6). Reads "golden bonus", not "wrong suit".
2. **Timer** (`Timer.tsx:105-112`): healthy `gold` → warn ≤20s `ember` → low ≤10s `crimson`; frozen `frost` + `snowflake` icon (replaces ❄ emoji & `#4FC3F7`). Gold-draining-to-red reads thematically ("spoils burning down") and sits better on green felt than the current traffic-light green.
3. **Combo block**: hide entirely below combo 2 (the persistent `x0` in the corner communicates nothing); fade in at 2+. Visual-only.
4. Combo milestone banners (`game/config.ts:24-32`): recolor escalation within fire/metal language — 5 `#7BED9F`, 8 `#E8C547`, 12 `#FF8C00`, 16 `#FF6B35`, 20 `#FF4757`, 24 `#C0392B`, 28 `#FFE08A` (white-gold), 32 `#FFFFFF`. Kills `#FF00FF`/`#FF1493`/`#7DF9FF`. Banner icons ⚡👁⚜ → MCI `lightning-bolt`/`eye`/`crown` tinted to milestone color.
5. SPOILS label → `type.overline`; score stays Roboto 900 (numerals).
6. Battlefield corner decorations (`game/Battlefield.tsx`): framed emoji boxes (🌲 top-left, beast top-right in screenshot) → remove frames, replace icons with runes at rgba-gold 0.05, keep the center-field beast watermark. The felt should be quiet; the cards are the art.
7. Bounty default icon 💰 → `sack` tinted `#DAA520` (thread through `BountyStyleContext` as component, not string — `ThemeContext.ts:17`).

### 4.3 Between levels (`betwee-layouts.jpg`, `game-completed-1.jpg` → `BetweenLevelsScreen.tsx`)
1. RETREAT/FIELD CLEARED → `type.display` 34; 🛡/⚔ emoji (light-blue shield!) → `shield`/`sword-cross` 36 `steel`/`gold` inside a 64px `goldLine` ring.
2. **Fill the dead right column**: stack (a) "NEXT BATTLEFIELD" `PanelCard` — "1.5× spoils · 32 beasts · 85s" from `LEVEL_CONFIG` (data exists; layout-shape preview deferred to Phase 4 data-driven layouts); (b) Glory Hunt opt-in card (ember border, `lightning-bolt`); (c) `GoldButton` primary "Next Battle". Left column keeps result + spoils + progress pips.
3. Progress pips: reached = `gold` fill + `ink` check; current = pulsing `gold` ring; upcoming = `goldLine` ring.
4. Claim Victory (final field) → same layout, button label swap, `trophy-variant` icon.

### 4.4 Game over / record (`game-completed-2.jpg`, `high-score.jpg` → `GameOverScreen.tsx`)
1. Outcome emoji 👑/⚔️/🛡 → `crown`/`sword-cross`/`shield` 40 in the existing ring; title → `type.display`.
2. **Async rank pop** (REFACTOR_PLAN 3.3): reserve a fixed-height (~22px) slot rendering "— counting ranks —" `steel` shimmer until `rank` resolves; prevents layout jump.
3. ALL-TIME RECORD banner: 🏆 → `trophy-variant` 30 `goldBright`; keep ✦ stars; title `type.hero`.
4. Buttons: Battle Again → primary lg; Return to Castle → ghost (shared component).
5. **Data check (verify, possibly bug):** `game-completed-2.jpg` shows `0% CLEARED / x0 BEST COMBO / 0 CARDS` alongside 45,400 spoils — stats appear to reflect only the final (untouched) field, not the run. Confirm `totalCleared`/`totalFieldCards`/`bestCombo` props accumulate across fields in `Game.tsx`; if intentional, relabel "FINAL FIELD"; if not, fix the accumulation. Behavior-adjacent → separate commit + approval.
6. Sequence "personal best" vs "all-time record" celebrations (never overlap — REFACTOR_PLAN 3.3 note stands).
7. **"One More Battle" goal module** (§6.5) under the score block + share-score button (§10 A-1) next to Return to Castle — this screen is both the mid-session hook point and the viral-loop moment.

### 4.5 Profile (`profile-screen.jpg` → `Profile.tsx`) — see §5 for the layout fix
Visual deltas once fixed:
1. **Rank tier system replaces the 14-color rainbow** (`Profile.tsx:30-45`). Map ranks to 5 metals: Recruit–Footman `#B07B4F` bronze; Apprentice–Proven `#9BA3AB` iron; Veteran–Battle Master `#C9D1D9` steel; Warlord–Immortal King `gold`; Divine Ruler+ `mystic`. Rank icons (emoji 🏹🗡📜…) → MCI ladder: `bow-arrow`, `sword`, `script-text`, `shield-half-full`, `sword-cross`, `axe-battle`, `fire`, `crown`, `skull`, `chess-king`, `lightning-bolt`, `volcano`→`fire-alert`, `weather-hurricane`, `star-four-points`.
2. Streak: 🔥/🕯 → `fire`/`candle`; streak milestone colors: drop the steel-grey ramp (`#606078`…) for `ember`-based: <7d `steel`, ≥7 `#C87533`, ≥21 `#E08A3C`, ≥42 `ember`, ≥60 `goldBright`.
3. Stat-row label emojis (🃏⚔📜🏆) → MCI 14 `goldFaded`.
4. Kill 6–8px text: milestone names → `type.overline` (10), rank progress → `type.caption`.
5. Name editor stays top-left but `pencil` icon affordance (already planned in 3.3).

### 4.6 Hall of Glory (`scoreboard-screen.jpg` → `Scoreboard.tsx`)
1. Podium medals (blue-ribbon 🥇🥈🥉) → `Medal` 32; crown emoji → `crown` icon on place 1; podium #1 card border `gold` `std`, #2 `#C9D1D9`@0.4, #3 `#B07B4F`@0.4.
2. Tabs → `TabBar` (📜/⚔ emojis out, `script-text-outline`/`sword-cross` 14 in).
3. Row rank-avatars (🏹 etc.) → tier ring + tier icon per §4.5.1.
4. Self-row: `goldWash` bg + `goldLine` border + parchment YOU chip; scroll-to-self on load (3.3).
5. COMBO/SPOILS headers → `type.overline`; combo chips `x26` → `goldWash` pill, `goldFaded` text.
6. P2: Weekly tab (matches lounge cadence), pull-to-refresh (3.3 carryover).

### 4.7 Arena menu (`arena-screen.jpg` → `arena/ArenaMenu.tsx`)
1. Header: 🏟 (red sports stadium!) → `OrnateHeader` with `sword-cross` 24 `ember`; subtitle "Same deck · Same battle · One champion" stays.
2. Host/Join cards → `PanelCard`; icon circles 56px `goldLine` ring: host `sword-cross` `gold`, join `shield` `gold` (blue 🛡 emoji out).
3. CREATE → secondary `GoldButton`; JOIN → primary, **disabled state per spec** until 4 digits entered.
4. Code input → `CodeDigits` md (input mode).
5. ONLINE list → `PlayerRow` + INVITE primary sm; sword icon `goldFaded`.

### 4.8 Arena lobby (`arena-lobby.jpg` → `arena/ArenaLobby.tsx`)
1. ROOM CODE → `CodeDigits` lg + "Share this code with allies" `type.caption`; **add system share-sheet icon button** (`share-variant`, ghost, fires `Share.share({ message })`) — 3.3 carryover, low effort.
2. Warriors list → `PlayerRow`: 👑 → `crown` 16 `goldBright`; HOST chip `goldWash`; **YOU chip parchment/ink (blue out)**; player-card blue border → `goldLine`.
3. "Need 2+ warriors" → disabled `GoldButton` primary (label "Need 2+ warriors"); enabled label "⚔ BEGIN BATTLE" (`sword-cross` icon).
4. Leave Room → danger `GoldButton` md, `door-open` icon (🚪 out).
5. INVITE ONLINE section header → `type.overline` flanked by hairlines (existing motif, tokenized).

### 4.9 Armory (`armory-card-backs.jpg`, `armory-wild-card-screen.jpg` → `Armory.tsx`)
1. All tiles → `SelectableTile` (one selection style; locks per spec — yellow emoji padlocks out).
2. Tabs (🃏🏞⚡💰 + Table) → `TabBar` with `cards`, `image-filter-hdr` (peaks), `lightning-bolt`, `sack`, `table-furniture` icons.
3. Header → `OrnateHeader` (`shield-half-full`); "Next unlock at 60 battles" → thin progress bar (`goldLine` track, `gold` fill, 54/60) under the subtitle. P2.
4. **Product art stays emoji for now** (tile beasts/objects are content, not chrome) — normalize presentation: 28px glyph centered in 44px `bgSunken` circle, then Phase 4/5 art pass replaces with engraved crests per icon.png style.
5. De-neon wild-style accents (used in-game): frost `#66DDFF`→`#8FCDE8`, venom `#44FF66`→`#57C878`, storm `#AA66FF`→`mystic #9A7FD4`, inferno `#FF4400`→`#E85A2A` (`Armory.tsx:45-50` + duplicated table at `:242-286`). Spark/steel fine. Product tile bg colors (navy Steel Bastion etc.) are content — keep.

---

## 5. Profile responsive fix (P0-2) — root causes located

Three independent causes, all in `Profile.tsx`:

1. **The giant blob (visible in profile-screen.jpg):** `bgGlow` gets `backgroundColor: rank.color + "18"` (`Profile.tsx:226`) and `avatarGlow` gets `rank.color + "20"` (`:270`). That hex-alpha trick assumes hex colors — but RECRUIT's color is `"rgba(232,197,71,0.4)"` (`:31`), so concatenation produces an invalid color string that RN's parser effectively resolves to the **rgba at 0.4 alpha** — ~8× the intended ~6%. Result: a hard-edged 50%×55% rounded rectangle (RN has no radial gradients) pulsing at 12–20% effective opacity over the whole screen. **Fix:** make all `RANKS[].color` plain hex (§4.5.1 does this anyway) **and** stop alpha-concatenation — use a precomputed `glow` token (e.g. rgba of the tier hex at 0.05). Optionally delete the bgGlow entirely until SVG radial (P2-3); the screen is busier without being prettier for it.
2. **Module-scope sizing:** `Dimensions.get("window")` at import time (`:17-21`) feeds `UI_SCALE`; value is frozen before the activity settles into landscape/immersive, so on some devices the scale is computed from a portrait or bar-inclusive height. **Fix:** `const { width, height } = useWindowDimensions()` inside the component; derive `scale = Math.min(height / 360, 1)` per render (cheap), or better, drop the scale hack: design the two columns to fit height ≥ 320 with fixed compact sizes and let the existing ScrollView absorb anything shorter.
3. **No cutout/safe-area handling:** app is landscape + edge-to-edge (`androidStatusBar.hidden`, immersive nav, targetSdk 35) and `react-native-safe-area-context` is **not installed** — on punch-hole phones the left column sits under the camera. This is the likely "breaks on some newer phones" report. **Fix:** `npx expo install react-native-safe-area-context` (native, autolinks in the existing `android/` gradle build — no prebuild), wrap App in `SafeAreaProvider`, pad Profile (and any screen with content at the horizontal edges) by `useSafeAreaInsets().left/right`. Audit Home (title near left edge) and Game back-button while at it.

Acceptance: verify on 320dp-height landscape (small), ~411×915 tall-aspect, and a punch-hole device; blob gone at every rank tier (test RECRUIT specifically).

---

## 6. New-player retention & first session (P1-3, P1-5, P1-6, P2-1)

### 6.0 Directional activity data (owner-provided, 2026-06-12)

6 players active in the last 3 days (no formal Play Console retention export; n=6 — directional only): Bekac 186 games / streak 1 · hd21 56 / 5 · Bily 23 / 5 · L E M O N 18 / 1 · jimmy 9 / 2 (last seen 3 days prior) · Kenan **1 game**.

What it suggests:
- **Converts go deep.** Everyone past the first handful of games has 18–186 games — the core loop retains the players it captures. Mid/long-term retention is not the binding constraint.
- **The first session is the leak** (the 1-game profile is the classic pattern) → R2 + R5 target exactly this.
- **Streaks are short even among heavy players** (max 5) → daily-return mechanics (R1, R4) have headroom.
- **6 actives in production means distribution is the #1 constraint** — the app is live but unknown. Acquisition work (§10) and viral-loop features (share, duels, deep links) outrank pure polish in value; polish still matters because it feeds the store-listing refresh (§10 A-3).

Ordered by evidence-independence and leverage:

- **R1 — Day-1/2 FCM nudge (low effort, FCM already integrated):** schedule a local/push reminder ~20h after first session: "Your Daily Quest awaits — same deck as every warrior. Keep your 1-day streak alive." Streak + daily quest already exist; this just surfaces them at the right moment. Cap: 1/day, stop after 3 ignored.
- **R2 — First-battle coach marks (visual-only, no gameplay change):** 3 dismissible tooltips on the first run ever: (1) "Capture any beast one above or below your card" pointing at the open card; (2) combo meter at first combo ≥2: "Chains multiply spoils ×3.5 and beyond"; (3) Free Draw card: "One free reinforcement per battlefield — no combo loss." Store `@mythic_seen_coachmarks` in `storageKeys.ts`. The game currently explains nothing in-session (Guide is a separate screen nobody reads).
- **R5 — "First Victory" early-reward celebration (the specific first-session feature, P1-6):** today the first game ends on the same plain game-over screen as game #200, and the 1-battle Armory unlock happens silently — the player owns something and is never told. Spec: on first-ever completed game (profile `totalGames === 1`, guard with `@mythic_first_victory_seen`), before the normal game-over content settles, show a full-screen overlay — "FIRST VICTORY" in `type.display`, ✦ flourishes, then "The Armory opens — your first banner awaits" and a primary `GoldButton` **"Claim your Card Back"** → routes to Armory with the newly-unlocked tile auto-highlighted (pulsing gold ring) and an equip prompt. Session 1 then has a complete arc: *play → win → own something → carry it into battle 2*. Pairs the reward with the competence moment, and hands the player a reason to start battle 2 immediately (see §6.5). Effort: one overlay + an Armory `highlightItem` param. Behavior-neutral — the unlock already exists, we celebrate it.
- **R3 — Warrior's Path (7-step checklist on Home):** PanelCard listing e.g. *Win first battle → Reach combo ×5 → Play a Daily Quest → Equip a card back → Clear battlefield 3 → Reach 3-day streak → Play an Arena match*; each grants an existing Armory unlock (several early items already key off games-played — re-point 2–3 of them at Path steps so no new content needed). Gives day 1–7 a visible goal ladder and routes players into every system once. Medium effort: state in `users/{uid}` + one Home card + claim toasts.
- **R4 — Streak shield ("Ember Ward"):** one missed day per week auto-forgiven (toast: "Your ember survived the night"). Strongest known streak-retention mechanic; touches streak calc in `useUserStats`/profile update — small but behavioral, needs approval.

Skip-for-now: rewarded ads for streak repair (monetization+retention hybrid) — flag only; changes the product's feel, owner call.

### 6.5 Mid-session hook — "One More Battle" module (P1-5)

Goal: a reason to start the *next* run inside the same sitting, triggered at the natural decision point — the game-over screen (`game-completed-2.jpg`). Today that screen answers "how did I do?" but never "what's within reach?" — the #1 cheap lever for run-to-run continuation. Fully behavior-neutral (no scoring/gameplay change).

**Mechanic:** at game-over, compute candidate "next goals" from data that is already client-side (or one small read), pick the single most *imminent* one, render it as one line + thin progress bar directly under the score block, and mirror it as a subtitle inside the Battle Again button.

Candidate goals & sources:
1. **Personal best gap** — `previousBest − score` (already returned by `saveGameResults`). Eligible when score ≥ 75% of PB. → "2,400 spoils from your personal best"
2. **Leaderboard ladder** — points to the player one rank above (rank already resolved on this screen; extend `saveGameResults` to also return `nextRankScore` when rank ≤ 50 — the top-50 read already happens for rank). → "#9 is 1,850 spoils away"
3. **Armory unlock** — battles remaining to the next unlock (Armory already computes "Next unlock at N battles"; export that helper from `Armory.tsx`). → "2 battles to Flame Sworn"
4. **Profile rank tier** — battles to next `RANKS` tier (helper exists in `Profile.tsx`, move to shared). → "1 battle to FOOTMAN"

Selection rule (imminence-first): pick (3) or (4) if ≤ 3 battles away (a *countable* number of runs is the strongest "one more" trigger); else (1) if within 25% of PB; else (2) if the gap ≤ the player's average score (beatable in one normal run); else fall back to the streak line ("Return tomorrow to keep your 5-day streak" — bridges to R1). Never show more than one goal — a single near-miss beats a dashboard.

UI spec: container 28px high, `goldWash` bg, radius `radius.md`; text `type.caption` `goldFaded` with the delta number in `gold` 800; 3px progress bar underneath (`goldLine` track, contextual fill: `gold` for spoils goals, `ember` for battle-count goals). Battle Again button subtitle: `type.overline`, same copy shortened. On goal completion in a later run, the module renders a one-time "✦ GOAL STRUCK ✦" state in `goldBright` before showing the next goal — closes the loop.

Effort: low — one component + goal-selection helper (`src/game/nextGoal.ts`, pure & unit-testable) + two small service extensions. Also slots naturally under the R5 overlay for battle #2 ("1 battle to FOOTMAN" is almost always true at that moment).

---

## 7. Arena competitive review (P1-4, P2-2)

**Format verdict:** the core format is right for the game (synchronous same-seed race, 2–6, room codes, rematch). Post-Phase-2 invites work from any screen. Its real weakness is **liquidity** — both players must be online now; with a small playerbase the "ONLINE · 2" list is usually you and nobody (arena-screen.jpg shows exactly this). Don't redesign the live mode; add an async lane beside it.

- **A1 — Async Duels ("Challenges") — the highest-value multiplayer addition.** Challenge any player (online or not) → both get the same seeded deck (daily-quest seeding infra reused) → 24h to play one run → winner banner + optional rematch. Storage: `duels/{duelId}` in Firestore (challenger/opponent/seed/scores/expiry), FCM on challenge + on result. Solves liquidity, creates a return-tomorrow loop (pairs with R1), reuses: seeded decks, score submission, invite UI (now global), FCM. Effort: medium-high (new service + 2 screens/states), no scoring changes.
- **A2 — Show live opponent deltas in-match (small, juicy):** RTDB already streams `players/{uid}/score`; surface a slim banner ("Kenan +4,200 ahead") at field transitions, not constantly. Reuses existing data, ~1 component.
- **A3 — Best-of-3 series:** wrap the existing atomic rematch in a `seriesScore` on the room. Cheap, makes rematches mean something.
- **A4 — Daily Arena (later, needs liquidity):** one shared seed/day, async bracket from all entrants. Overlaps Daily Quest — differentiate by making it head-to-head pools of 4. Phase 4+.

**Monetization (hard constraint honored: zero competitive advantage):**
- **M1 — Arena-visible cosmetics:** victory banners (shown on opponents' result screens), exclusive card backs/table styles flagged "Arena", entrance flourishes. Pure Armory extension — the Armory pipeline (unlock conditions, equipping, theming contexts) already supports it; add a "paid" acquisition path alongside unlocks.
- **M2 — Tournament tickets with cosmetic prizes:** paid entry, prize = exclusive cosmetic + Hall of Glory laurel (a wreath ring on your leaderboard avatar). Fairness intact: gameplay identical, same decks.
- **M3 — Supporter sigil:** one-time purchase, profile + lobby badge. Trivial to build once `PlayerRow` chips exist.
- Anti-goals: paid wilds/insurance/time, paid extra attempts in any leaderboard mode — all P2W, all out.

---

## 8. Layout & progression expansion → recommend **Phase 4** (P3-1)

Current state: 6 fixed battlefields in a fixed order (`game/config.ts`), multiplier 1.0→3.5× (`scoring.ts:28`), zero run-to-run variation. 9 layout components exist (`Layout1–9`); **Layouts 3, 4c and 6 were deliberately shelved** — owner built and play-tested them and the current 6 felt better in actual play. So they are *candidates with known feel-problems*, not free content: any Phase 4 evaluation starts by articulating **why** they felt worse (dead openings? choke-point dependencies? unreachable peaks too early?) and either fixes that or discards them.

**Phase 4 goal (owner-set):** more layout variety so repeat runs don't serve the same card arrangements and score curves — replay variety **without hurting the feel that made the current 6 the pick**. The fixed 6-in-order run is the baseline to protect, not replace.

**Why split to Phase 4:** touching run structure touches scoring runs, Hall of Glory comparability, daily quest, and Arena seeds simultaneously — it deserves its own approval gate, sequencing, and (per REFACTOR_PLAN Step 1.8) the data-driven layout refactor as a prerequisite. Folding it into Phase 3 would stall the cheap visual wins behind a design debate. **Flagging: yes, split.**

Direction to bring to that phase (strawman for discussion, not commitment) — ordered by how directly each serves the variety goal:
- **4a — Rotation pool (variety-first, minimal structural change):** a run remains exactly 6 battlefields with the same multiplier curve, but the 6 are drawn from a pool of N ≥ 8 layouts under slot constraints (slots 1–2 from "open/forgiving" layouts, 3–4 mid, 5–6 hardest). Drawn **seeded per day, same for all players** (daily-quest seeding pattern) so Hall of Glory stays comparable and each day feels fresh. The current 6 remain the pool's backbone; shelved/new layouts enter only after passing the feel gate below.
- **4b — Battlefield variants (cheap content multiplier):** remix trusted silhouettes rather than invent risky new ones — mirrored variant, bounty-rich variant (+2 bounty slots), short-deck variant (−4 deck, +15s). Same proven shapes, different decisions. Served through the same per-day rotation for fairness.
- **4c — Full "Conquest of the Peaks" campaign:** 3 regions × 4 battlefields, per-field ★★★ goals (clear%, combo, time), stars gate regions, region themes reuse Armory field styles. Classic 6-field run stays untouched as the Hall-of-Glory mode; campaign is a parallel progression track. Pairs with R3's goal-ladder psychology. Biggest build — only if 4a/4b prove appetite.
- **Feel gate (applies to anything entering rotation, including the shelved 3):** a layout ships only after (a) a written diagnosis of why it was shelved (dead openings? choke-point cascades? early unreachable peaks?) and a fix, (b) owner playtest sign-off — the same judgment that picked the current 6 stays the final arbiter.
- **Leaderboard rule:** any variation must be identical for all players on a given day, or boards split. No per-player random layout draws on ranked runs.
- Prereq for all of it: **Step 1.8 data-driven layouts** (one component + N position tables) — also unlocks the between-levels "next battlefield silhouette" tease (§4.3.2) and makes variants (mirroring, slot edits) data edits instead of new components.

---

## 9. Out-of-scope notes & build cautions

- **Card-face beast emojis (🐉🦅🐺🐍)**: consistent for the Android-only user base (one Noto set), function as art, and sit on well-designed faces — keep until a commissioned crest pass (P3-2; icon.png is the style reference). Do not swap them for monochrome icons; that would *reduce* charm.
- **Heronames containing emoji** (e.g. "LEMON🍋", scoreboard-screen.jpg): user data, leave rendering as-is; optionally strip emoji at rename input later. Note only.
- **CLAUDE.md drift**: combo milestones are 5/8/12/16/20/24/28/32 in code (CLAUDE.md says 3/5/7/10/15/20/25/30) and multipliers reach 3.5× (says 1–3×) — update CLAUDE.md when convenient.
- **Build workflow:** fonts + `@expo/vector-icons` = JS-only (safe with `gradlew bundleRelease`). `react-native-safe-area-context` and (later) `react-native-svg` are native but autolink through the existing `android/` folder with a normal gradle build — **do NOT run `expo prebuild`** for them (signing-config wipe). NDK pin untouched.
- **Suggested commit sequence for Phase 3 implementation:** (1) theme.ts + fonts activated on Home only → visual sign-off ✅ `be88536` (+ Home de-blue ✅ `b5ad456`); (2) icons dep + Home/Arena/Lobby; (3) Profile fix (own commit, test devices); (4) Armory tiles + tabs; (5) Scoreboard; (6) Game board accents (timer/free-draw/combo colors); (7) between-levels/game-over layout rebalance; (8) shared-component migration sweep; (9) "One More Battle" module + share-score button (§6.5, §10 A-1); (10) First Victory celebration (R5) + coach marks (R2); (11) FCM nudge (R1); then store-listing refresh (§10 A-3, non-code). Each slice builds & ships independently per working rules.

---

## 10. Acquisition — getting new players (P1-7)

Context from §6.0: the game is live but unknown (6 actives). No amount of retention work compounds from a near-zero base, so acquisition levers sit alongside the P0 visual work — and the visual work is itself the prerequisite for the highest-leverage non-code lever (the store listing). Code levers first:

- **A-1 — Share the moment (code, low effort, ship with commit 9):** a share button (`share-variant` icon, ghost button) on the game-over and all-time-record screens firing `Share.share()` with: "I plundered 93,116,425 spoils in Mythic Peaks — beat me if you can. ⚔ https://play.google.com/store/apps/details?id=com.husejn.mythicpeaks". v1 is text-only (zero deps, RN core API). v2 (later): rendered score-card image via `react-native-view-shot` (native dep — same build caution as §9). The all-time-record screen (high-score.jpg) is the single most shareable moment the game produces — it currently dead-ends.
- **A-2 — Challenge links (code, rides on A1 duels + 3.1 navigation):** `mythicpeaks://duel/XYZ` deep link in the share text turns every async duel into an install prompt — the receiver lands in the duel after install (deferred deep link via Play Store referrer is a stretch goal; v1: app opens to a "enter challenge code" fallback). This is the only *self-multiplying* loop available; it's why A1 duels are rated "viral-loop carrier" in the matrix.
- **A-3 — Store listing refresh (non-code, after the Phase 3 visual pass ships):** new screenshots (the redesigned screens are the marketing), feature graphic derived from icon.png art, short-description copy leading with "€100 monthly prize" + "real-time duels". ASO terms to cover: *tri peaks solitaire, solitaire battle, card duel, kartenspiel* — and a **German (+ Bosnian/Croatian/Serbian) store-listing localization**: the existing playerbase and the VIENNA lounge venue say the seed market is DACH/Balkan diaspora; localized listings are disproportionately cheap reach there.
- **A-4 — Lounge venues as a physical channel (mostly non-code):** the Hookah Lounge system is a built-in local-acquisition machine that's currently invisible — a venue poster/table-card with a QR code (Play Store link + printed venue code, e.g. VIENNA) plus the venue's weekly leaderboard on a tablet/TV makes the game a venue activity. Code assist (small): a "Venue kit" — shareable QR/post asset per lounge — can be generated outside the app; in-app, surface "Playing at a lounge? Enter the code" more prominently for new installs with no lounge joined.
- **A-5 — Surface the €100 prize earlier (tiny code + listing):** it's already on Home; repeat it on the Auth/Intro screen (first thing a fresh install sees) and in the store listing. New players should know the stakes before their first battle, not after exploring.
- **A-6 — Content moments (non-code, owner-driven):** 15-second clips of RAMPAGE/×30 combo runs (screen-record + the milestone banners are made for this) for TikTok/Reels/Shorts; post the weekly lounge winner. Zero build cost; pairs with A-1's link.

Sequencing: A-1 and A-5 ship inside Phase 3; A-3 immediately after Phase 3 is visually done; A-2 lands with async duels; A-4/A-6 are owner-side and can start anytime.
