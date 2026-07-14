// The Daily Edict — a seeded per-day modifier on the shared daily deck
// (REFACTOR_PLAN_V2 Tier 4 / owner Tier 3). Every player on a given date faces
// the SAME edict; the daily board is per-date, so fairness holds by
// construction (same rule for everyone racing that day's seed).
//
import type { IconName } from "../ui/Icon"

// INVARIANT — config-level only. An edict may bend the three level-config
// levers below (time, bounty count, Free Draw grant) and NOTHING else. It
// never touches the scoring math (getMatchPoints / banners / bounty 3×-tier /
// perfect / unbroken) and never touches a blocking graph — layouts stay
// symmetric + machine-verified regardless of the day's decree. Daily runs no
// longer feed the all-time or lounge boards (ScoreService), so an edict-shifted
// score can only ever land on the daily board it was earned on.

// A tiny deterministic PRNG, self-contained so src/game stays dependency-light.
// Same mulberry32 + string hash used for the seeded deck/bounty picks
// (CardService), so "same date → same edict" holds across every device.
const stringToSeed = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}
const mulberry32 = (seed: number): number => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export type Edict = {
  id: string
  // Display name — gold Cinzel on the sealed quest card.
  name: string
  // The decree, one line — the flavor + the mechanical tell in plain words.
  tagline: string
  // mci icon name (rendered via <Icon>).
  icon: IconName
  // ── The three config levers (defaults = an ordinary field) ──
  // Multiplies LEVEL_CONFIG.time before the glory halving.
  timeMult: number
  // Absolute bounty slots seeded per field (default 2, as pickSeededIndices).
  bountyCount: number
  // Free Draws granted at each field start (default 1).
  freeDrawGrant: number
  // Banking cap on carried Free Draws (default 2).
  freeDrawCap: number
}

const DEFAULTS = {
  timeMult: 1,
  bountyCount: 2,
  freeDrawGrant: 1,
  freeDrawCap: 2,
}

// Hand-tuned table — every entry moves exactly one lever off the baseline (or
// none, for the rest day). Kept small and legible; each is one clear decision
// shift, not a stacked modifier. Add here to grow the rotation.
export const EDICTS: Edict[] = [
  {
    ...DEFAULTS,
    id: "open-field",
    name: "THE OPEN FIELD",
    tagline: "No decree today — the field is yours alone.",
    icon: "shield-outline",
  },
  {
    ...DEFAULTS,
    id: "bounty-glut",
    name: "THE GILDED EDICT",
    tagline: "The vaults spill open — twice the bounty on every field.",
    icon: "treasure-chest",
    bountyCount: 4,
  },
  {
    ...DEFAULTS,
    id: "long-fuse",
    name: "THE LONG FUSE",
    tagline: "The hourglass runs slow — a fifth more time to conquer.",
    icon: "timer-sand",
    timeMult: 1.2,
  },
  {
    ...DEFAULTS,
    id: "quick-march",
    name: "THE QUICK MARCH",
    tagline: "The sand runs thin — less time, strike without hesitation.",
    icon: "run-fast",
    timeMult: 0.82,
  },
  {
    ...DEFAULTS,
    id: "the-drought",
    name: "THE DROUGHT",
    tagline: "The wells run dry — no Free Draw is granted this day.",
    icon: "water-off",
    freeDrawGrant: 0,
    freeDrawCap: 0,
  },
  {
    ...DEFAULTS,
    id: "deep-wells",
    name: "THE DEEP WELLS",
    tagline: "The wells overflow — Free Draws to spare, bank up to three.",
    icon: "water",
    freeDrawGrant: 2,
    freeDrawCap: 3,
  },
]

// Deterministic pick for a date string ("2026-07-14"). A dedicated seed prefix
// keeps the edict choice independent of the deck/bounty shuffles on that date.
export const getDailyEdict = (date: string): Edict => {
  const r = mulberry32(stringToSeed(`mythic-edict-${date}`))
  return EDICTS[Math.floor(r * EDICTS.length)]
}
