// Pure game configuration — constants only, no React.
// Extracted verbatim from Game.tsx (Step 1.2).

import type { SigilSpec } from "../ui/sigils"

export const LEVEL_CONFIG: Record<
  number,
  {
    fieldCards: number
    deckStart: number
    time: number
    layout: number
    name: string
  }
> = {
  1: { fieldCards: 29, deckStart: 29, time: 75, layout: 1, name: "Battlements" },
  // Layout 11 "The Siege" replaced Cross of Clans (layout 9, shelved) after
  // the 2026-07-02 layout audit — 75% dead taps, four identical clusters.
  2: { fieldCards: 32, deckStart: 32, time: 85, layout: 11, name: "The Siege" },
  // Layout 12 "The Hourglass" replaced The Stronghold (layout 7, shelved) —
  // same audit: the inverted pyramid decayed (best moment was move 1) and the
  // archetype duplicated Battlements.
  3: { fieldCards: 30, deckStart: 30, time: 80, layout: 12, name: "The Hourglass" },
  4: { fieldCards: 32, deckStart: 32, time: 80, layout: 8, name: "Snake Eyes" },
  // Layout 10 "The Citadel" (mirror-symmetric successor to the unshipped
  // asymmetric Warfront) sits where the unnamed piles+wall (layout 2, shelved)
  // used to — no base row; owner playtest gate applies.
  5: { fieldCards: 32, deckStart: 32, time: 85, layout: 10, name: "The Citadel" },
  6: { fieldCards: 28, deckStart: 28, time: 75, layout: 5, name: "Dragon's Spine" },
  // Layout 13 "The Mythic Peaks" — the classic tri-peaks board, the game's
  // namesake, as the new finale (2026-07-02). Ten contiguous opens = the
  // widest chain freedom in the set, where the 4.0× banner hunt lives.
  7: { fieldCards: 28, deckStart: 28, time: 75, layout: 13, name: "The Mythic Peaks" },
}

export const TOTAL_LEVELS = Object.keys(LEVEL_CONFIG).length
export const BASE_CARD_VALUE = 500
export const SECOND_CARD_COMBO = 2

// Milestone escalation climbs within the fire/metal language (§4.2.4) —
// sage → gold → ember → red → crimson → white-gold → white — icons are
// heraldic sigils (rendered via <Sigil>).
// Since scoring v2 these keys ARE the banner ladder: each one banks a banner
// (getBannerBank), freezes the timer, fires the tier sound, and drives the
// HUD tier color/title. One ladder, one source of truth (GAMEPLAY.md §1.5).
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

// The banner ladder, ascending — derived once from the milestone keys.
export const BANNER_MILESTONES = Object.keys(COMBO_MILESTONES)
  .map(Number)
  .sort((a, b) => a - b)

// Every planted banner freezes the clock for a flat, learnable 3 seconds.
export const BANNER_FREEZE_SECONDS = 3

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
