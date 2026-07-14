// Pure-logic tests over src/game/ + the seeded helpers in CardService.
// These cover the invariants Tiers 2-4 lean on: the scoring/banner ladder,
// the match rule, and seeded determinism (duels and the Daily replay the same
// deck + bounties + edict for every player on a seed/date).

import {
  getComboMultiplier,
  getMatchPoints,
  getLayoutMultiplier,
  getBannerBank,
} from "../scoring"
import { BASE_CARD_VALUE, BANNER_MILESTONES, COMBO_MILESTONES } from "../config"
import { isCardMatch } from "../match"
import { getDailyEdict, EDICTS } from "../edict"
import {
  generateDailyDeck,
  pickSeededIndices,
} from "../../services/CardService"
import type { ICard } from "../../components/Card"

const card = (value: number, suit: ICard["suit"] = "hearts"): ICard => ({
  value: String(value),
  suit,
  displayValue: String(value),
  visible: true,
})

// ── Scoring table ──────────────────────────────────────────────────────────
describe("getComboMultiplier", () => {
  // Exact ladder from GAMEPLAY.md §1.5 "Aligned ladders".
  const expected: Record<number, number> = {
    0: 1,
    1: 1,
    2: 2,
    3: 3.5,
    4: 5,
    5: 7,
    8: 13,
    10: 17,
    12: 23,
    16: 35,
    20: 51,
    24: 67,
    28: 87,
  }
  for (const [c, mult] of Object.entries(expected)) {
    it(`combo ${c} → ${mult}×`, () => {
      expect(getComboMultiplier(Number(c))).toBe(mult)
    })
  }

  it("hard-caps at 100× from combo 31", () => {
    expect(getComboMultiplier(30)).toBeLessThan(100)
    expect(getComboMultiplier(31)).toBe(100)
    expect(getComboMultiplier(32)).toBe(100)
    expect(getComboMultiplier(200)).toBe(100)
  })

  it("is monotonic non-decreasing and never exceeds the cap", () => {
    let prev = -Infinity
    for (let c = 0; c <= 120; c++) {
      const m = getComboMultiplier(c)
      expect(m).toBeGreaterThanOrEqual(prev)
      expect(m).toBeLessThanOrEqual(100)
      prev = m
    }
  })
})

describe("banner ladder", () => {
  it("BANNER_MILESTONES equals the sorted milestone keys", () => {
    expect(BANNER_MILESTONES).toEqual([5, 8, 12, 16, 20, 24, 28, 32])
    expect(BANNER_MILESTONES).toEqual(
      Object.keys(COMBO_MILESTONES)
        .map(Number)
        .sort((a, b) => a - b),
    )
  })

  it("getBannerBank = milestone × 1000 × layoutMult × glory", () => {
    expect(getBannerBank(5, 1, false)).toBe(5000) // 5×1000×1.0×1
    expect(getBannerBank(20, 7, false)).toBe(20000 * getLayoutMultiplier(7))
    expect(getBannerBank(12, 3, true)).toBe(
      Math.round(12 * 1000 * getLayoutMultiplier(3) * 2),
    )
  })
})

describe("getMatchPoints / getLayoutMultiplier", () => {
  it("base card at combo 1, level 1, no glory is BASE_CARD_VALUE", () => {
    expect(getMatchPoints(1, 1, false)).toBe(BASE_CARD_VALUE)
  })
  it("layout multiplier is 1 + (level-1)×0.5", () => {
    expect(getLayoutMultiplier(1)).toBe(1)
    expect(getLayoutMultiplier(7)).toBe(4)
  })
  it("glory doubles the match points", () => {
    expect(getMatchPoints(10, 4, true)).toBe(getMatchPoints(10, 4, false) * 2)
  })
})

// ── Match rule ───────────────────────────────────────────────────────────────
describe("isCardMatch", () => {
  it("matches adjacent ranks either direction", () => {
    expect(isCardMatch(card(5), card(6))).toBe(true)
    expect(isCardMatch(card(6), card(5))).toBe(true)
    expect(isCardMatch(card(9), card(10))).toBe(true)
  })
  it("rejects non-adjacent ranks", () => {
    expect(isCardMatch(card(5), card(7))).toBe(false)
    expect(isCardMatch(card(2), card(10))).toBe(false)
  })
  it("rejects identical ranks", () => {
    expect(isCardMatch(card(5), card(5))).toBe(false)
  })
  it("wraps the ace to both 2 and King (13)", () => {
    expect(isCardMatch(card(1), card(2))).toBe(true)
    expect(isCardMatch(card(1), card(13))).toBe(true)
    expect(isCardMatch(card(13), card(1))).toBe(true)
    expect(isCardMatch(card(2), card(1))).toBe(true)
    expect(isCardMatch(card(1), card(3))).toBe(false)
    expect(isCardMatch(card(1), card(12))).toBe(false)
  })
  it("ignores suit", () => {
    expect(isCardMatch(card(5, "hearts"), card(6, "spades"))).toBe(true)
    expect(isCardMatch(card(13, "clubs"), card(1, "diamonds"))).toBe(true)
  })
})

// ── Seeded deck determinism ─────────────────────────────────────────────────
const key = (c: ICard) => `${c.value}-${c.suit}`

describe("generateDailyDeck determinism", () => {
  it("same date + level yields byte-identical order every call", () => {
    const a = generateDailyDeck("2026-07-15", 1)
    const b = generateDailyDeck("2026-07-15", 1)
    expect(a.map(key)).toEqual(b.map(key))
  })
  it("is a full 52-card permutation (no dupes, no drops)", () => {
    const deck = generateDailyDeck("2026-07-15", 3)
    expect(deck).toHaveLength(52)
    expect(new Set(deck.map(key)).size).toBe(52)
  })
  it("different level → different order (seed carries the level)", () => {
    const l1 = generateDailyDeck("2026-07-15", 1).map(key)
    const l2 = generateDailyDeck("2026-07-15", 2).map(key)
    expect(l1).not.toEqual(l2)
  })
  it("different date → different order", () => {
    const d1 = generateDailyDeck("2026-07-15", 1).map(key)
    const d2 = generateDailyDeck("2026-07-16", 1).map(key)
    expect(d1).not.toEqual(d2)
  })
})

// ── Bounty seeding ──────────────────────────────────────────────────────────
describe("pickSeededIndices (bounty placement)", () => {
  const seed = "mythic-2026-07-15-level-1-bounty"

  it("same seed yields the same positions every call", () => {
    expect(pickSeededIndices(30, 2, seed)).toEqual(pickSeededIndices(30, 2, seed))
  })
  it("returns exactly `pick` distinct in-range indices", () => {
    const picks = pickSeededIndices(30, 4, seed)
    expect(picks).toHaveLength(4)
    expect(new Set(picks).size).toBe(4)
    for (const i of picks) {
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(30)
    }
  })
  it("the first 2 of a 4-pick are the same 2-pick (widening keeps fairness)", () => {
    // pickSeededIndices slices from one seeded shuffle, so raising the bounty
    // count (THE GILDED EDICT: 2→4) keeps the original 2 and adds to them.
    expect(pickSeededIndices(30, 4, seed).slice(0, 2)).toEqual(
      pickSeededIndices(30, 2, seed),
    )
  })
  it("different seeds generally differ", () => {
    const a = pickSeededIndices(30, 4, "mythic-A-level-1-bounty")
    const b = pickSeededIndices(30, 4, "mythic-B-level-1-bounty")
    expect(a).not.toEqual(b)
  })
})

// ── Daily Edict determinism ─────────────────────────────────────────────────
describe("getDailyEdict", () => {
  it("is deterministic per date and returns a table edict", () => {
    const e = getDailyEdict("2026-07-15")
    expect(getDailyEdict("2026-07-15")).toBe(e)
    expect(EDICTS).toContain(e)
  })
  it("every edict bends only config levers (never negative/absurd)", () => {
    for (const e of EDICTS) {
      expect(e.timeMult).toBeGreaterThan(0)
      expect(e.bountyCount).toBeGreaterThanOrEqual(0)
      expect(e.freeDrawGrant).toBeGreaterThanOrEqual(0)
      expect(e.freeDrawCap).toBeGreaterThanOrEqual(e.freeDrawGrant)
    }
  })
  it("covers more than one distinct decree across a month", () => {
    const seen = new Set<string>()
    for (let d = 1; d <= 28; d++) {
      seen.add(getDailyEdict(`2026-07-${String(d).padStart(2, "0")}`).id)
    }
    expect(seen.size).toBeGreaterThan(1)
  })
})
