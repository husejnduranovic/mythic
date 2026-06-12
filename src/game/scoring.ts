// Pure scoring math — no React. Formulas extracted verbatim from Game.tsx (Step 1.2).

import { BASE_CARD_VALUE } from "./config"

export const getComboMultiplier = (c: number): number => {
  if (c >= 32) return 300
  if (c >= 30) return 260
  if (c >= 28) return 220
  if (c >= 26) return 185
  if (c >= 24) return 155
  if (c >= 22) return 128
  if (c >= 20) return 105
  if (c >= 18) return 84
  if (c >= 16) return 66
  if (c >= 14) return 50
  if (c >= 12) return 37
  if (c >= 10) return 27
  if (c >= 8) return 18
  if (c >= 6) return 11
  if (c >= 5) return 8
  if (c >= 4) return 5.5
  if (c >= 3) return 3.5
  if (c >= 2) return 2
  return 1
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

// Bounty card bonus — fixed, layout-scaled, NOT multiplied by combo or glory.
export const getBountyBonus = (level: number): number =>
  Math.round(5000 * getLayoutMultiplier(level))

// 50 points per second of remaining time.
export const getTimeBonus = (timeLeft: number, glory: boolean): number =>
  timeLeft * 50 * gloryFactor(glory)

// 200 points per card left undealt in the deck.
export const getDeckBonus = (deckRemaining: number, glory: boolean): number =>
  deckRemaining * 200 * gloryFactor(glory)

// Bonus for clearing the entire field.
export const getPerfectClearBonus = (level: number, glory: boolean): number =>
  Math.round(50000 * getLayoutMultiplier(level) * gloryFactor(glory))
