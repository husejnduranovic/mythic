// Pure game configuration — constants only, no React.
// Extracted verbatim from Game.tsx (Step 1.2).

export const LEVEL_CONFIG: Record<
  number,
  { fieldCards: number; deckStart: number; time: number; layout: number }
> = {
  1: { fieldCards: 29, deckStart: 29, time: 75, layout: 1 },
  2: { fieldCards: 32, deckStart: 32, time: 85, layout: 9 },
  3: { fieldCards: 30, deckStart: 30, time: 80, layout: 7 },
  4: { fieldCards: 32, deckStart: 32, time: 80, layout: 8 },
  5: { fieldCards: 32, deckStart: 32, time: 85, layout: 2 },
  6: { fieldCards: 28, deckStart: 28, time: 75, layout: 5 },
}

export const TOTAL_LEVELS = Object.keys(LEVEL_CONFIG).length
export const BASE_CARD_VALUE = 500
export const SECOND_CARD_COMBO = 2

export const COMBO_MILESTONES: Record<
  number,
  { text: string; color: string; icon: string }
> = {
  5: { text: "WORTHY!", color: "#7BED9F", icon: "⚔" },
  8: { text: "VALIANT!", color: "#FFD700", icon: "🛡" },
  12: { text: "GLORIOUS!", color: "#FF6B35", icon: "👑" },
  16: { text: "LEGENDARY!", color: "#FF4757", icon: "🐉" },
  20: { text: "RAMPAGE!", color: "#FF00FF", icon: "⚡" },
  24: { text: "UNSTOPPABLE!", color: "#FF1493", icon: "🔥" },
  28: { text: "DIVINE!", color: "#7DF9FF", icon: "👁" },
  32: { text: "MASTER OF PEAKS!", color: "#FFFFFF", icon: "⚜️" },
}

export const RUNES = [
  "ᚠ",
  "ᚢ",
  "ᚦ",
  "ᚨ",
  "ᚱ",
  "ᚲ",
  "ᚷ",
  "ᚹ",
  "ᚺ",
  "ᚾ",
  "ᛁ",
  "ᛃ",
  "ᛈ",
  "ᛊ",
  "ᛏ",
  "ᛒ",
  "ᛞ",
  "ᛟ",
]
