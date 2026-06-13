// Pure game configuration — constants only, no React.
// Extracted verbatim from Game.tsx (Step 1.2).

import type { SigilSpec } from "../ui/sigils"

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

// Milestone escalation now climbs within the fire/metal language (§4.2.4) —
// sage → gold → ember → red → crimson → white-gold → white — and the icons are
// heraldic sigils (rendered via <Sigil>) instead of platform emoji. Kills the
// old magenta/pink/cyan neon (#FF00FF / #FF1493 / #7DF9FF).
export const COMBO_MILESTONES: Record<
  number,
  { text: string; color: string; icon: SigilSpec }
> = {
  5: { text: "WORTHY!", color: "#7BED9F", icon: { fam: "mci", name: "sword-cross" } },
  8: { text: "VALIANT!", color: "#E8C547", icon: { fam: "mci", name: "shield" } },
  12: { text: "GLORIOUS!", color: "#FF8C00", icon: { fam: "mci", name: "crown" } },
  16: { text: "LEGENDARY!", color: "#FF6B35", icon: { fam: "fa5", name: "dragon" } },
  20: { text: "RAMPAGE!", color: "#FF4757", icon: { fam: "mci", name: "lightning-bolt" } },
  24: { text: "UNSTOPPABLE!", color: "#C0392B", icon: { fam: "mci", name: "fire" } },
  28: { text: "DIVINE!", color: "#FFE08A", icon: { fam: "mci", name: "eye" } },
  32: { text: "MASTER OF PEAKS!", color: "#FFFFFF", icon: { fam: "mci", name: "fleur-de-lis" } },
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
