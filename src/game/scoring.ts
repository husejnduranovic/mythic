// Pure scoring math — no React.
// v2 "Spoils, Banners & Bounties" (GAMEPLAY.md §1.5, 2026-07-01): tamed and
// capped chain curve, banked banner bonuses on the milestone ladder, bounties
// worth 3× the current tier, everything else carried over from v1.

import { BASE_CARD_VALUE } from "./config"

// Stamped onto every submitted score document — v2 runs score ~5–20× lower
// than v1, so leaderboards must be able to tell the two apart (or be wiped).
export const SCORING_VERSION = 2

// Chain multiplier: v1's hook for combos 1–5, then stepwise-linear, hard cap
// 100× from combo 31. (v1 reached 300× at combo 32 — the tail devoured every
// other point source and made chain length the only strategy on every board.)
export const getComboMultiplier = (c: number): number => {
  if (c <= 1) return 1
  if (c === 2) return 2
  if (c === 3) return 3.5
  if (c === 4) return 5
  if (c === 5) return 7
  if (c <= 10) return 7 + (c - 5) * 2 // 9 … 17
  if (c <= 16) return 17 + (c - 10) * 3 // 20 … 35
  if (c <= 24) return 35 + (c - 16) * 4 // 39 … 67
  return Math.min(100, 67 + (c - 24) * 5) // 72 … 97, capped 100 (c ≥ 31)
}

// Per-layout score multiplier: 1x on level 1, +0.5x per level.
export const getLayoutMultiplier = (level: number): number =>
  1 + (level - 1) * 0.5

const gloryFactor = (glory: boolean): number => (glory ? 2 : 1)

// Points for a single matched card (combo-multiplied, layout-multiplied, glory-multiplied).
export const getMatchPoints = (
  combo: number,
  level: number,
  glory: boolean,
): number =>
  Math.round(
    BASE_CARD_VALUE *
      getComboMultiplier(combo) *
      getLayoutMultiplier(level) *
      gloryFactor(glory),
  )

// Banner bank — planted at each combo milestone, permanent for the run.
// milestone × 1,000, layout- and glory-scaled. The push-your-luck axis: a
// chain that dies still keeps its planted banners.
export const getBannerBank = (
  milestone: number,
  level: number,
  glory: boolean,
): number =>
  Math.round(milestone * 1000 * getLayoutMultiplier(level) * gloryFactor(glory))

// Bounty bonus v2 — the bounty card is worth 3× its match points at the
// player's current combo tier (this is the +2× on top of the match itself).
// Early capture is small, late-chain capture is huge → a routing decision,
// not the ignorable flat +5000 of v1.
export const getBountyBonus = (
  combo: number,
  level: number,
  glory: boolean,
): number => 2 * getMatchPoints(combo, level, glory)

// 50 points per second of remaining time.
export const getTimeBonus = (timeLeft: number, glory: boolean): number =>
  timeLeft * 50 * gloryFactor(glory)

// 200 points per card left undealt in the deck.
export const getDeckBonus = (deckRemaining: number, glory: boolean): number =>
  deckRemaining * 200 * gloryFactor(glory)

// Bonus for clearing the entire field.
export const getPerfectClearBonus = (level: number, glory: boolean): number =>
  Math.round(50000 * getLayoutMultiplier(level) * gloryFactor(glory))
